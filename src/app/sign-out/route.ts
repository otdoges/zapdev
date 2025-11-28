import { NextResponse } from "next/server";
import { signOut } from "@workos-inc/authkit-nextjs";

export async function GET(request: Request) {
  await signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
