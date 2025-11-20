/**
 * Better Auth plugin for server-side password validation
 *
 * This plugin intercepts password creation/updates and validates
 * them against security requirements to prevent weak passwords.
 */

import type { BetterAuthPlugin } from "better-auth";
import { validatePassword } from "./password-validation";

export const passwordValidationPlugin = (): BetterAuthPlugin => {
    return {
        id: "password-validation",
        hooks: {
            user: {
                create: {
                    before: async (user) => {
                        // Validate password on user creation (signup)
                        if ("password" in user && user.password) {
                            const validation = validatePassword(user.password as string);

                            if (!validation.valid) {
                                throw new Error(validation.errors[0]);
                            }
                        }

                        return user;
                    },
                },
                update: {
                    before: async (user) => {
                        // Validate password on user update (password change)
                        if ("password" in user && user.password) {
                            const validation = validatePassword(user.password as string);

                            if (!validation.valid) {
                                throw new Error(validation.errors[0]);
                            }
                        }

                        return user;
                    },
                },
            },
        },
    };
};
