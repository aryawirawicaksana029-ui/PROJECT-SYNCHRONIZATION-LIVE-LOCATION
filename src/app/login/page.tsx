"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const { getUsers, setCurrentUser } = await import("@/lib/db");
      const userList = await getUsers();
      const matchedUser = userList.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!matchedUser) {
        setError("Email atau password salah.");
        setIsLoading(false);
        return;
      }

      if (matchedUser.status === "inactive") {
        setError("Akun Anda berstatus Nonaktif. Silakan hubungi Administrator.");
        setIsLoading(false);
        return;
      }

      if (matchedUser.password && matchedUser.password !== password.trim()) {
        setError("Email atau password salah.");
        setIsLoading(false);
        return;
      }

      // Save user session in localStorage so it stays active
      setCurrentUser({
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        phone: matchedUser.phone,
        status: matchedUser.status,
        joined_at: matchedUser.created_at || new Date().toISOString(),
      });

      if (matchedUser.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/mobile");
      }
    } catch {
      setError("Terjadi kesalahan saat memproses login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 -z-10 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(135deg, #142757 0%, #1b6cf5 25%, #059669 50%, #1456e1 75%, #142757 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <div className="w-full max-w-md animate-slide-up">
        <div
          className="rounded-2xl border border-white/20 p-8 shadow-2xl backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-8 w-8 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SLL
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Synchronization Live Location
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-danger-500/20 border border-danger-500/30 px-4 py-3 text-sm text-white animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-white/90"
              >
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4.5 w-4.5 text-white/40"
                  >
                    <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                    <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-white/90"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4.5 w-4.5 text-white/40"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-11 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z" clipRule="evenodd" />
                      <path d="M10.748 13.93 8.07 11.25A2.5 2.5 0 0 0 10.748 13.93Zm-6.38-3.117a10.025 10.025 0 0 1 2.28-2.765L4.97 6.37A11.544 11.544 0 0 0 2.665 9.41a1.651 1.651 0 0 0 0 1.186 10.004 10.004 0 0 0 4.27 4.397l-1.298-1.299a8.468 8.468 0 0 1-1.27-1.881Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="relative w-full rounded-xl bg-white py-3 text-sm font-semibold text-primary-800 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-800 border-t-transparent animate-spin" />
                  Masuk...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/40">
            Hanya untuk pengguna terdaftar.
            <br />
            Hubungi Admin untuk membuat akun.
          </p>
        </div>

        {/* Brand footer */}
        <p className="mt-6 text-center text-xs text-white/30">
          © 2026 SLL · Synchronization Live Location
        </p>
      </div>
    </div>
  );
}
