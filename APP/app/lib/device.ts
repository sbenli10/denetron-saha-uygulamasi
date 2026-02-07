import crypto from "crypto";

export function parseDevice(agent: string) {
  const ua = agent.toLowerCase();

  let browser = "Bilinmeyen";
  let os = "Bilinmeyen";

  if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edge")) browser = "Edge";

  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  const label = `${browser} · ${os}`;

  return { browser, os, label };
}

export function deviceHash(agent: string) {
  return crypto
    .createHash("sha256")
    .update(agent)
    .digest("hex");
}
