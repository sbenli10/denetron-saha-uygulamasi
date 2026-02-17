// APP/app/api/security/pwned-password/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

function getIP(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function pwnedCount(password: string): Promise<number> {
  const sha1 = crypto
    .createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();

  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "Denetron/1.0 (password-check)",
          "Add-Padding": "true",
        },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!res.ok) return 0;

    const text = await res.text();

    for (const line of text.split("\n")) {
      const [suf, cnt] = line.trim().split(":");
      if (suf === suffix) {
        return Number(cnt) || 0;
      }
    }

    return 0;
  } catch {
    // HIBP erişilemezse reset sürecini bloklamıyoruz
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);

    // 🔒 1 dakikada 20 kontrol
    const rl = rateLimit(`pwned:${ip}`, 20, 60_000);

    if (!rl.ok) {
      return new NextResponse(
        JSON.stringify({ error: "Too many checks" }),
        {
          status: 429,
          headers: {
            "retry-after": String(
              Math.ceil((rl.retryAfterMs ?? 0) / 1000)
            ),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body.password !== "string" ||
      body.password.length < 1
    ) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const password = body.password;

    // Çok kısa şifrelerde dış API çağırmıyoruz
    if (password.length < 8) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const count = await pwnedCount(password);

    return NextResponse.json({ count }, { status: 200 });

  } catch (err) {
    console.error("Pwned password check error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
