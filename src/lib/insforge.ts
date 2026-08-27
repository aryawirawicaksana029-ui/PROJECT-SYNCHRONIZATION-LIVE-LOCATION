import { createClient } from "@insforge/sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://placeholder.insforge.co";
const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "placeholder-anon-key";

export const insforge = createClient({
  baseUrl,
  anonKey,
});

export const isInsForgeConfigured = () => {
  return (
    baseUrl !== "https://placeholder.insforge.co" &&
    anonKey !== "placeholder-anon-key" &&
    !baseUrl.includes("placeholder")
  );
};
