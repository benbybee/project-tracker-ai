import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const Schema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = Schema.parse(body);

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      email,
      passwordHash: hash,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? "Registration failed";
    // Zod errors
    if (err?.issues) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
