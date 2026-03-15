"use client";

import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { navSections } from "@/lib/nav-items";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, loading: authLoading } = usePermissions();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Flatten nav items to easily check permissions
  const allRoutes = navSections.flatMap(section => 
    section.items.flatMap(item => [
      item,
      ...(item.children || [])
    ])
  ).filter(item => item.href);

  useEffect(() => {
    if (authLoading) return;

    // Find the item that matches current path (longest match first for specificity)
    const matchingItem = allRoutes
      .filter(item => item.href && pathname.startsWith(item.href))
      .sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0))[0];

    if (matchingItem && matchingItem.permission) {
      const hasAccess = hasPermission(matchingItem.permission);
      setAuthorized(hasAccess);
      
      if (!hasAccess && pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    } else {
        // If no specific permission required or route not in nav, allow (e.g. basic dashboard)
        setAuthorized(true);
    }
  }, [pathname, authLoading, hasPermission, router, allRoutes]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("sidebar:open")
        : null;

    if (saved !== null) {
      setOpen(saved === "true");
    } else {
      if (typeof window !== "undefined") {
        setOpen(window.innerWidth >= 1024);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar:open", String(open));
    }
  }, [open]);

  const navbarLeft = open ? "lg:left-64" : "lg:left-16";
  const contentLeft = open ? "lg:pl-64" : "lg:pl-16";

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
          navbarLeft,
        )}
      >
        <Navbar onToggleSidebar={() => setOpen((o) => !o)} />
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen w-full pt-6 lg:pt-10 transition-all duration-300",
          contentLeft,
        )}
      >
        <main className="container-page flex-1 w-full">
            {authLoading || authorized === null ? (
                <div className="flex h-[400px] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : authorized ? (
                children
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                    <div className="bg-destructive/10 p-6 rounded-full">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground text-center max-w-sm">
                        You do not have the required permissions to access this page.
                    </p>
                </div>
            )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
