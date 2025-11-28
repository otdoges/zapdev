"use client";

import { useUser } from "@workos-inc/authkit-nextjs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

interface Props {
  showName?: boolean;
}

export const UserControl = ({ showName }: Props) => {
  const router = useRouter();
  const { user } = useUser();

  if (!user) return null;

  const handleSignOut = async () => {
    // WorkOS sign out - redirect to sign out endpoint
    window.location.href = "/sign-out";
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const avatarSrc = user.profilePictureUrl || undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md focus:outline-none">
        <Avatar className="size-8 rounded-md">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
        </Avatar>
        {showName && (
          <span className="text-sm font-medium hidden md:inline-block">
            {displayName}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
