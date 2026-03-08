"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  BellRing,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [hasNotification, setHasNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Fetch user details from local storage
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          setUserName(user.name);
        }
      }
    } catch (e) {
      console.error("Failed to parse user details:", e);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
    } catch {}

    // Expire cookie so middleware treats user as logged out
    document.cookie =
      "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    router.push("/login");
  };

  return (
    <div className="h-12 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-[100]">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <Button
            aria-label="Toggle sidebar"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSidebar}
          >
            <Menu size={12} />
          </Button>
        </div>

        {/* Right: Notification + Theme + User */}
        <div className="flex items-center gap-2">
          <div className="relative">
            {/* Notification */}
            {hasNotification && (
              <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`
                    h-8 w-8
                    relative z-10
                    transition-all duration-300 ease-out
                    hover:scale-105 hover:rotate-3
                    ${
                      hasNotification
                        ? "border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                        : ""
                    }
                  `}
                >
                  <BellRing
                    size={12}
                    className={`
                        transition-all duration-300
                        ${hasNotification ? "fill-red-500 animate-wiggle" : ""}
                      `}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2 mt-2 bg-card/90 backdrop-blur-xl border border-border shadow-xl rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2"
              >
                <div className="flex items-center justify-between px-3 py-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[10px] font-medium text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      {notifications.length}
                    </span>
                  )}
                </div>

                <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent mb-2" />

                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-2 text-muted-foreground/50">
                      <BellRing className="w-2 h-2 opacity-10" />
                      <p className="text-xs font-medium mb-2">
                        Notifications not available
                      </p>
                    </div>
                  ) : (
                    notifications.map((item: any, index: number) => (
                      <DropdownMenuItem
                        key={index}
                        className="group relative flex flex-col items-start gap-1 p-3 mb-1 rounded-xl cursor-pointer transition-all duration-300 hover:bg-accent focus:bg-accent border border-transparent hover:border-border"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.doc_no}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Theme Menu */}
          {mounted && (
            <Button
              aria-label="Toggle theme"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
            </Button>
          )}

          {/* User Menu */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  aria-label="User menu"
                  className="h-8 gap-2 px-2"
                >
                  <User size={14} />
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {userName || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
