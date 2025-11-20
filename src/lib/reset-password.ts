import type { ReadonlyURLSearchParams } from "next/navigation";

export function extractResetToken(params: URLSearchParams | ReadonlyURLSearchParams | null) {
    if (!params) {
        return null;
    }

    return (
        params.get("token") ??
        params.get("code") ??
        params.get("oobCode")
    );
}
