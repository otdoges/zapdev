import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
