import { Polar } from "@polar-sh/sdk";

let polarInstance: Polar | null = null;

export const getPolarClient = () => {
  if (!polarInstance) {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("POLAR_ACCESS_TOKEN is missing");
    }

    polarInstance = new Polar({
      accessToken,
      server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
    });
  }
  return polarInstance;
};
