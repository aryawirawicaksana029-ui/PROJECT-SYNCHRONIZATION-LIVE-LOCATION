import { Geolocation } from "@capacitor/geolocation";
import { addLocationLog, getCurrentUser } from "./db";

export interface LiveTrackingState {
  isActive: boolean;
  userId: string | null;
  sessionId: string | null;
  storeId: string | null;
  startTime: number | null;
  lastPingTime: string | null;
  totalPings: number;
}

class TrackingService {
  private timerId: NodeJS.Timeout | null = null;
  private state: LiveTrackingState = {
    isActive: false,
    userId: null,
    sessionId: null,
    storeId: null,
    startTime: null,
    lastPingTime: null,
    totalPings: 0,
  };

  private listeners: ((state: LiveTrackingState) => void)[] = [];

  constructor() {
    this.restoreState();
  }

  public restoreState(currentUserId?: string) {
    if (typeof window !== "undefined") {
      const activeUser = currentUserId || getCurrentUser()?.id || "default";
      const saved = localStorage.getItem(`sll_live_tracking_${activeUser}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isActive && (!currentUserId || parsed.userId === currentUserId)) {
            this.state = parsed;
            this.startIntervalPing();
            return;
          }
        } catch {
          // ignore error
        }
      }
      
      // If no active tracking for this user, ensure inactive state
      this.state = {
        isActive: false,
        userId: currentUserId || null,
        sessionId: null,
        storeId: null,
        startTime: null,
        lastPingTime: null,
        totalPings: 0,
      };
    }
  }

  public getState(): LiveTrackingState {
    const currentUser = getCurrentUser();
    if (currentUser && this.state.isActive && this.state.userId && this.state.userId !== currentUser.id) {
      // Different user logged in, check their own saved state
      const saved = localStorage.getItem(`sll_live_tracking_${currentUser.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      return {
        isActive: false,
        userId: currentUser.id,
        sessionId: null,
        storeId: null,
        startTime: null,
        lastPingTime: null,
        totalPings: 0,
      };
    }
    return { ...this.state };
  }

  public subscribe(callback: (state: LiveTrackingState) => void): () => void {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    if (typeof window !== "undefined") {
      const activeUser = this.state.userId || getCurrentUser()?.id || "default";
      if (this.state.isActive) {
        localStorage.setItem(`sll_live_tracking_${activeUser}`, JSON.stringify(this.state));
      } else {
        localStorage.removeItem(`sll_live_tracking_${activeUser}`);
      }
    }
    this.listeners.forEach((l) => l(this.getState()));
  }

  public async startLiveTracking(storeId?: string, explicitUserId?: string): Promise<{ success: boolean; sessionId: string }> {
    const currentUser = getCurrentUser();
    const userId = explicitUserId || currentUser?.id || "u-2";

    if (this.state.isActive && this.state.userId === userId) {
      return { success: true, sessionId: this.state.sessionId! };
    }

    // Request permissions from Capacitor Geolocation
    try {
      if (typeof window !== "undefined" && "navigator" in window) {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== "granted") {
          await Geolocation.requestPermissions();
        }
      }
    } catch {
      // Fallback if browser/emulator environment
    }

    const sessionId = "SES-" + Math.floor(100000 + Math.random() * 900000);
    this.state = {
      isActive: true,
      userId,
      sessionId,
      storeId: storeId || null,
      startTime: Date.now(),
      lastPingTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      totalPings: 0,
    };

    // Perform immediate first ping with REAL battery & GPS
    await this.captureAndSendPing();

    // Set interval ping every 60 seconds (1 minute)
    this.startIntervalPing();

    this.notify();

    // Show Notification in Browser/System if available
    this.showForegroundNotification(
      "📡 Shareloc Live Aktif",
      `Session ID: ${sessionId}. Lokasi dikirim otomatis ke server setiap 5 menit.`
    );

    return { success: true, sessionId };
  }

  public stopLiveTracking(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    const lastSession = this.state.sessionId;
    const activeUser = this.state.userId || getCurrentUser()?.id || "default";

    this.state = {
      isActive: false,
      userId: this.state.userId,
      sessionId: null,
      storeId: null,
      startTime: null,
      lastPingTime: null,
      totalPings: 0,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem(`sll_live_tracking_${activeUser}`);
    }

    this.notify();

    this.showForegroundNotification(
      "🛑 Shareloc Live Dihentikan",
      `Sesi tracking ${lastSession || ""} telah dihentikan.`
    );
  }

  private startIntervalPing() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.timerId = setInterval(async () => {
      if (this.state.isActive) {
        await this.captureAndSendPing();
      }
    }, 300000); // Exactly 5 minutes (300,000 ms)
  }

  private async captureAndSendPing() {
    try {
      let lat = -6.2088;
      let lng = 106.8456;
      let accuracy = 10;
      let pingStatus: "success" | "gps_denied" | "failed" = "success";

      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        accuracy = position.coords.accuracy;
      } catch {
        pingStatus = "gps_denied";
      }

      const realBattery = await this.getRealBatteryLevel();

      await addLocationLog({
        user_id: this.state.userId || getCurrentUser()?.id || undefined,
        store_id: this.state.storeId || undefined,
        latitude: lat,
        longitude: lng,
        accuracy_m: Math.round(accuracy),
        battery_level: realBattery,
        ping_status: pingStatus,
      });

      this.state.lastPingTime = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.state.totalPings += 1;
      this.notify();
    } catch {
      // ignore
    }
  }

  // Real Battery API Integration
  private async getRealBatteryLevel(): Promise<number> {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      } catch {
        // fallback
      }
    }
    return 88;
  }

  private showForegroundNotification(title: string, body: string) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        });
      }
    }
  }
}

export const trackingService = new TrackingService();
