import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

if (!baseURL) {
    throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL is required");
}

export const authClient = createAuthClient({
    baseURL,
    plugins: [polarClient()],
});
