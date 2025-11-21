import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    plugins: [polarClient()],
});
