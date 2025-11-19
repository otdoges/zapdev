import { importPKCS8, importSPKI, exportJWK, generateKeyPair, SignJWT } from 'jose';

let privateKey: CryptoKey | undefined;
let publicKey: CryptoKey | undefined;
let jwks: any;
let keysPromise: Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; jwks: any }> | undefined;

const ALG = 'RS256';

async function getKeys() {
    if (privateKey && publicKey) return { privateKey, publicKey, jwks };

    if (keysPromise) {
        return keysPromise;
    }

    keysPromise = (async () => {
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.CONVEX_AUTH_PRIVATE_KEY || !process.env.CONVEX_AUTH_PUBLIC_KEY) {
                throw new Error('CONVEX_AUTH_PRIVATE_KEY and CONVEX_AUTH_PUBLIC_KEY must be set in production');
            }
        }

        if (process.env.CONVEX_AUTH_PRIVATE_KEY && process.env.CONVEX_AUTH_PUBLIC_KEY) {
            try {
                privateKey = await importPKCS8(process.env.CONVEX_AUTH_PRIVATE_KEY, ALG);
                publicKey = await importSPKI(process.env.CONVEX_AUTH_PUBLIC_KEY, ALG);
                const jwk = await exportJWK(publicKey);
                jwks = { keys: [{ ...jwk, kid: 'convex-auth-key', alg: ALG, use: 'sig' }] };
                return { privateKey, publicKey, jwks };
            } catch (e) {
                console.error("Failed to load keys from env, generating new ones", e);
                if (process.env.NODE_ENV === 'production') {
                    throw new Error('Failed to load CONVEX_AUTH keys in production. Check key format.');
                }
            }
        }

        if (process.env.NODE_ENV === 'production') {
            throw new Error('CONVEX_AUTH_PRIVATE_KEY and CONVEX_AUTH_PUBLIC_KEY must be set in production');
        }

        const { privateKey: priv, publicKey: pub } = await generateKeyPair(ALG);
        privateKey = priv;
        publicKey = pub;
        const jwk = await exportJWK(pub);
        jwks = { keys: [{ ...jwk, kid: 'convex-auth-key', alg: ALG, use: 'sig' }] };
        console.warn("Generated new Convex Auth keys. Tokens will be invalid after restart. Set CONVEX_AUTH_PRIVATE_KEY and CONVEX_AUTH_PUBLIC_KEY to persist.");

        return { privateKey, publicKey, jwks };
    })();

    return keysPromise;
}

export async function getJWKS() {
    const { jwks } = await getKeys();
    return jwks;
}

/**
 * Signs a JWT for Convex authentication
 * @param payload - The payload to sign
 * @returns The signed JWT string
 */
export async function signConvexJWT(payload: any) {
    const { privateKey } = await getKeys();
    if (!privateKey) {
        throw new Error("Failed to load private key");
    }
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG, kid: 'convex-auth-key' })
        .setIssuedAt()
        .setIssuer(process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000")
        .setAudience("convex")
        .setExpirationTime('1h')
        .sign(privateKey);
    return jwt;
}
