/**
 * Better Auth plugin for server-side password validation
 *
 * DEPRECATED: This plugin is incompatible with Better Auth v1.3.34+
 * The hooks API has changed and no longer supports the user.create/update structure.
 *
 * Password validation is now handled by:
 * - Better Auth built-in minPasswordLength/maxPasswordLength settings
 * - Client-side validation in forms
 *
 * This file is kept for reference only and should not be used.
 */

import type { BetterAuthPlugin } from "better-auth";

export const passwordValidationPlugin = (): BetterAuthPlugin => {
    // Disabled - return minimal plugin that does nothing
    return {
        id: "password-validation-deprecated",
    } as BetterAuthPlugin;
};
