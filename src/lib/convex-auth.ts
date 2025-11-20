import { exportJWK, generateKeyPair, importPKCS8, importSPKI, SignJWT } from 'jose';

type StoredKey = {
    kid: string;
    privateKey?: CryptoKey;
    publicKey: CryptoKey;
    jwk: any;
    createdAt: number;
    source: "env" | "generated" | "additional";
};

const ALG = 'RS256';
const DEFAULT_KID = process.env.CONVEX_AUTH_KEY_ID || 'convex-auth-key';
const ROTATION_WARNING_MS = Number.parseInt(process.env.CONVEX_AUTH_KEY_STALENESS_HOURS || "72", 10) * 60 * 60 * 1000;
const DEV_ROTATION_MS = Number.parseInt(process.env.CONVEX_AUTH_ROTATE_AFTER_HOURS || "24", 10) * 60 * 60 * 1000;

const keyStore = new Map<string, StoredKey>();
let activeKid: string | null = null;
let initPromise: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildJwks = () => ({
    keys: Array.from(keyStore.values()).map((key) => key.jwk),
});

async function loadAdditionalPublicKeys() {
    const raw = process.env.CONVEX_AUTH_ADDITIONAL_PUBLIC_KEYS;
    if (!raw) return;

    try {
        const entries = JSON.parse(raw);
        if (!Array.isArray(entries)) {
            console.warn("CONVEX_AUTH_ADDITIONAL_PUBLIC_KEYS must be an array of { kid, publicKey }");
            return;
        }

        for (const entry of entries) {
            const kid = typeof entry?.kid === "string" && entry.kid.trim() ? entry.kid.trim() : undefined;
            const publicKeyString = typeof entry?.publicKey === "string" && entry.publicKey.trim()
                ? entry.publicKey.trim()
                : undefined;

            if (!kid || !publicKeyString) continue;

            try {
                const publicKey = await importSPKI(publicKeyString, ALG);
                const jwk = await exportJWK(publicKey);
                keyStore.set(kid, {
                    kid,
                    publicKey,
                    jwk: { ...jwk, kid, alg: ALG, use: 'sig' },
                    createdAt: Date.now(),
                    source: "additional",
                });
            } catch (error) {
                console.error(`Failed to import additional public key for kid=${kid}`, error);
            }
        }
    } catch (error) {
        console.error("Failed to parse CONVEX_AUTH_ADDITIONAL_PUBLIC_KEYS", error);
    }
}

async function loadEnvKeys() {
    const privateKeyPem = process.env.CONVEX_AUTH_PRIVATE_KEY;
    const publicKeyPem = process.env.CONVEX_AUTH_PUBLIC_KEY;

    if (privateKeyPem && publicKeyPem) {
        const kid = DEFAULT_KID;
        const privateKey = await importPKCS8(privateKeyPem, ALG);
        const publicKey = await importSPKI(publicKeyPem, ALG);
        const jwk = await exportJWK(publicKey);

        keyStore.set(kid, {
            kid,
            privateKey,
            publicKey,
            jwk: { ...jwk, kid, alg: ALG, use: 'sig' },
            createdAt: Date.now(),
            source: "env",
        });
        activeKid = kid;
    }

    await loadAdditionalPublicKeys();
}

async function generateKeyPairWithKid(kid?: string) {
    const generatedKid = kid || `convex-dev-${Date.now()}`;
    const { privateKey, publicKey } = await generateKeyPair(ALG);
    const jwk = await exportJWK(publicKey);

    keyStore.set(generatedKid, {
        kid: generatedKid,
        privateKey,
        publicKey,
        jwk: { ...jwk, kid: generatedKid, alg: ALG, use: 'sig' },
        createdAt: Date.now(),
        source: "generated",
    });
    activeKid = generatedKid;
}

function getActiveKey(): StoredKey | undefined {
    if (!activeKid) return undefined;
    return keyStore.get(activeKid);
}

async function initialiseKeys() {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        if (process.env.NODE_ENV === 'production') {
            if (!process.env.CONVEX_AUTH_PRIVATE_KEY || !process.env.CONVEX_AUTH_PUBLIC_KEY) {
                throw new Error('CONVEX_AUTH_PRIVATE_KEY and CONVEX_AUTH_PUBLIC_KEY must be set in production');
            }
        }

        try {
            await loadEnvKeys();
        } catch (error) {
            console.error("Failed to load Convex Auth keys from environment", error);
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Failed to initialise Convex Auth keys in production');
            }
        }

        if (!keyStore.size) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Convex Auth keys missing in production');
            }

            await generateKeyPairWithKid(DEFAULT_KID);
            console.warn("Generated Convex Auth keys for development. Tokens will be invalid after process restart.");
        }
    })()
        .finally(() => {
            initPromise = null;
        });

    return initPromise;
}

async function ensureDevRotation() {
    const activeKey = getActiveKey();
    if (!activeKey || activeKey.source !== "generated") return;

    const age = Date.now() - activeKey.createdAt;
    if (age < DEV_ROTATION_MS) return;

    await generateKeyPairWithKid();

    // Keep the previous public key available for existing tokens (1h expiry)
    const jwk = await exportJWK(activeKey.publicKey);
    keyStore.set(activeKey.kid, {
        ...activeKey,
        jwk: { ...jwk, kid: activeKey.kid, alg: ALG, use: 'sig' },
    });
}

async function maybeWarnForStaleKeys() {
    const activeKey = getActiveKey();
    if (!activeKey) return;
    if (!Number.isFinite(ROTATION_WARNING_MS) || ROTATION_WARNING_MS <= 0) return;

    const age = Date.now() - activeKey.createdAt;
    if (age < ROTATION_WARNING_MS) return;

    const message = `Convex Auth key ${activeKey.kid} is older than configured staleness threshold (${ROTATION_WARNING_MS / (1000 * 60 * 60)}h). Rotate keys to limit blast radius.`;
    console.warn(message);

    try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureMessage(message, {
            level: "warning",
            tags: { kid: activeKey.kid, source: activeKey.source },
        });
    } catch {
        // Sentry optional; ignore if not configured
    }
}

async function getKeys() {
    await initialiseKeys();

    // Prevent duplicate generation under concurrency
    const activeKey = getActiveKey();
    if (!activeKey) {
        await sleep(50);
    }

    await ensureDevRotation();
    await maybeWarnForStaleKeys();

    const selectedKey = getActiveKey();
    if (!selectedKey || !selectedKey.privateKey) {
        throw new Error("Active Convex Auth signing key missing. Ensure CONVEX_AUTH_PRIVATE_KEY and CONVEX_AUTH_PUBLIC_KEY are configured.");
    }

    return {
        privateKey: selectedKey.privateKey,
        publicKey: selectedKey.publicKey,
        jwks: buildJwks(),
        kid: selectedKey.kid,
    };
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
    const { privateKey, kid } = await getKeys();
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG, kid })
        .setIssuedAt()
        .setIssuer(process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000")
        .setAudience("convex")
        .setExpirationTime('1h')
        .sign(privateKey);
    return jwt;
}
