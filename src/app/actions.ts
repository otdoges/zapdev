"use server";

export async function getSignInUrlAction() {
  return "/handler/sign-in";
}

export async function getSignUpUrlAction() {
  return "/handler/sign-up";
}
