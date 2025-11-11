import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendVerificationEmail, generateVerificationToken } from "@/lib/email";
import { checkRateLimit, sensitiveAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Apply stricter rate limiting for verification emails
    const rateLimitResult = await checkRateLimit(request, sensitiveAuthRateLimit);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await fetchQuery(api.users.getByEmail, { email });
    
    if (!user) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const token = generateVerificationToken();
    
    await fetchMutation(api.emailVerifications.create, {
      userId: user._id,
      email: user.email,
      token,
    });

    // Send verification email
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("Failed to resend verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
