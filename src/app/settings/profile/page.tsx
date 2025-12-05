"use client";

import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and security settings
        </p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border",
          },
        }}
      />
    </div>
  );
}
