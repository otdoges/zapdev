/**
 * Password validation utility for server-side validation
 *
 * This provides additional password strength validation beyond
 * the client-side checks to prevent bypass attempts.
 */

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

export interface PasswordRequirements {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialCharacters: boolean;
    disallowCommonPasswords: boolean;
}

// List of commonly used passwords to reject
const COMMON_PASSWORDS = new Set([
    "password", "12345678", "123456789", "1234567890",
    "password1", "password123", "qwerty", "qwerty123",
    "abc123", "letmein", "welcome", "monkey", "dragon",
    "master", "sunshine", "princess", "admin", "user",
]);

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialCharacters: false,
    disallowCommonPasswords: true,
};

/**
 * Validates a password against security requirements
 */
export function validatePassword(
    password: string,
    requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
    const errors: string[] = [];

    // Check length
    if (password.length < requirements.minLength) {
        errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    if (password.length > requirements.maxLength) {
        errors.push(`Password must not exceed ${requirements.maxLength} characters`);
    }

    // Check uppercase
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    // Check lowercase
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    // Check numbers
    if (requirements.requireNumbers && !/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    // Check special characters
    if (requirements.requireSpecialCharacters && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    // Check common passwords
    if (requirements.disallowCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
        errors.push("This password is too common. Please choose a stronger password");
    }

    // Calculate entropy (basic check)
    // NIST recommends minimum 50 bits for sensitive systems
    const entropy = calculatePasswordEntropy(password);
    if (entropy < 50) {
        errors.push("Password is too weak. Please use a mix of letters, numbers, and symbols");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calculates a basic entropy score for the password
 */
function calculatePasswordEntropy(password: string): number {
    let charsetSize = 0;

    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Approximate special chars

    // Entropy = log2(charsetSize^length)
    return password.length * Math.log2(charsetSize);
}

/**
 * Checks if a password has been exposed in data breaches (basic version)
 * For production, consider integrating with HaveIBeenPwned API
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
    // This is a placeholder - in production, you would integrate with
    // the HaveIBeenPwned Passwords API using k-anonymity
    // https://haveibeenpwned.com/API/v3#PwnedPasswords

    // For now, just check against common passwords
    return COMMON_PASSWORDS.has(password.toLowerCase());
}
