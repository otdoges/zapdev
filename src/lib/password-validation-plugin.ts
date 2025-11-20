/**
 * Better Auth plugin for server-side password validation
 *
 * This plugin intercepts password creation/updates and validates
 * them against security requirements to prevent weak passwords.
 */

import type { BetterAuthPlugin } from "better-auth";
import { validatePassword } from "./password-validation";

type PasswordCarrier = Record<string, unknown> & {
    password?: unknown;
};

function enforcePasswordPolicy(payload: PasswordCarrier) {
    if (!("password" in payload)) {
        return;
    }

    const password = payload.password;

    if (typeof password !== "string" || password.length === 0) {
        return;
    }

    const validation = validatePassword(password);

    if (!validation.valid) {
        throw new Error(validation.errors[0]);
    }
}

export const passwordValidationPlugin = (): BetterAuthPlugin => {
    return {
        id: "password-validation",
        init: () => ({
            options: {
                databaseHooks: {
                    user: {
                        create: {
                            before: async (user) => {
                                enforcePasswordPolicy(user);
                            },
                        },
                        update: {
                            before: async (user) => {
                                enforcePasswordPolicy(user);
                            },
                        },
                    },
                },
            },
        }),
    };
};
