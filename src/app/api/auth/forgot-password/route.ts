import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ email: z.string().email() });

// In production, send OTP via email/SMS. Here we store in DB and return for dev.
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = bodySchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account with this email" }, { status: 404 });
    }
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });
    // TODO: send OTP via email/SMS. For dev we return it (remove in prod).
    return NextResponse.json({
      message: "OTP sent to your email/phone",
      devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
