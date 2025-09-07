import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === "admin" && password === "password123") {
    const token = jwt.sign({ user: username }, SECRET, { expiresIn: "1h" });

    return NextResponse.json({ ok: true, token });
  }

  return NextResponse.json(
    { ok: false, error: "Invalid credentials" },
    { status: 401 }
  );
}
