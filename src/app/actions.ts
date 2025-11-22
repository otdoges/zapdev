"use server";

import { getSignInUrl, getSignUpUrl } from "@workos-inc/authkit-nextjs";

export async function getSignInUrlAction() {
  return await getSignInUrl();
}

export async function getSignUpUrlAction() {
  return await getSignUpUrl();
}

