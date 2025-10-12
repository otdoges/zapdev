"use client";

import { dark } from "@clerk/themes";
import { SignIn } from "@clerk/nextjs";

import { useCurrentTheme } from "@/hooks/use-current-theme";

export const SignInContent = () => {
  const currentTheme = useCurrentTheme();

  return (
    <section className="space-y-6 pt-[16vh] 2xl:pt-48">
      <div className="flex flex-col items-center">
        <SignIn
          appearance={{
            baseTheme: currentTheme === "dark" ? dark : undefined,
            elements: {
              cardBox: "border! shadow-none! rounded-lg!",
            },
          }}
        />
      </div>
    </section>
  );
};
