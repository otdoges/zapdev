"use client";

import { dark } from "@clerk/themes";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { useCurrentTheme } from "@/hooks/use-current-theme";

interface Props {
  showName?: boolean;
};

export const UserControl = ({ showName }: Props) => {
  const [clerkAvailable, setClerkAvailable] = useState(false);
  useEffect(() => {
    setClerkAvailable(!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  }, []);
  const currentTheme = useCurrentTheme();

  return (
    clerkAvailable ? (
      <UserButton
        showName={showName}
        appearance={{
          elements: {
            userButtonBox: "rounded-md!",
            userButtonAvatarBox: "rounded-md! size-8!",
            userButtonTrigger: "rounded-md!"
          },
          baseTheme: currentTheme === "dark" ? dark : undefined,
        }}
      />
    ) : null
  );
};
