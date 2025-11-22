/**
 * Navigation Component
 *
 * Main navigation bar displayed for authenticated users.
 * Includes app branding, main menu links, and user dropdown with logout.
 */

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

interface NavigationProps {
  user: {
    email: string;
    id: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Nie udało się wylogować");
        return;
      }

      // Success - redirect to login page
      toast.success("Wylogowano pomyślnie");
      window.location.href = "/login";
    } catch {
      toast.error("Problem z połączeniem. Sprawdź internet i spróbuj ponownie");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
              EduKids
            </a>

            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="/topics" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Tematy
              </a>
              <a href="/generate" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Generuj pytania
              </a>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-600 text-white">{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Moje konto</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/settings" className="cursor-pointer">
                    Ustawienia konta
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
