// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Secret for JWT
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "SUPER_SECRET_KEY"
);

export async function middleware(req: NextRequest) {
  console.log("🟢 Middleware triggered →", req.nextUrl.pathname);

  // Protect forecast routes
  if (req.nextUrl.pathname.startsWith("/forecast")) {
    const token = req.cookies.get("token")?.value;
    console.log("🍪 Token found?", token ? "YES" : "NO");

    // DEBUG: Force redirect test
    // 🔴 Uncomment this block to *always* redirect forecast
    // return NextResponse.redirect(new URL("/login", req.url));

    if (!token) {
      console.log("❌ No token → redirecting to /login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      console.log("✅ Token verified. Payload:", payload);
    } catch (err) {
      console.log("⚠️ Invalid/expired token → redirecting");
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

