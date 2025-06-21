import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Check if Polar is properly configured
const accessToken = process.env.POLAR_ACCESS_TOKEN;
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

export const GET = !accessToken 
  ? async (request: NextRequest) => {
      console.error("POLAR_ACCESS_TOKEN is not configured");
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 500 }
      );
    }
  : Checkout({
      accessToken,
      successUrl: process.env.POLAR_SUCCESS_URL || `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/success`,
      server,
    }); 