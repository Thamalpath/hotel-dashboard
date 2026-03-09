"use client";

import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Sidebar } from "../../components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

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
        <main className="container-page flex-1 w-full">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
