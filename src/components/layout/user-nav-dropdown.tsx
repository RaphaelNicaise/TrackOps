"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserNavDropdownProps {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

export function UserNavDropdown({ name, email, role }: UserNavDropdownProps) {
  const displayName = name || email || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.warn("SignOut notice:", e);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-1 hover:ring-2 hover:ring-primary/20 focus:outline-hidden cursor-pointer transition"
          aria-label="Menú de usuario"
        >
          <span className="font-medium text-foreground text-sm hidden sm:block max-w-[140px] truncate">
            {displayName}
          </span>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/25 text-primary font-bold text-xs shrink-0 shadow-2xs">
            {initial}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground truncate">{displayName}</p>
            {email && <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>}
            {role && (
              <span className="inline-block mt-1 w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                ROL: {role}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium gap-2 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
