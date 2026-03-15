"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { navSections, type NavItem } from "../../lib/nav-items";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { hasPermission, loading } = usePermissions();

  const filteredNavSections = useMemo(() => {
    if (loading) return [];

    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Check top-level item permission
        if (item.permission && !hasPermission(item.permission)) return false;

        // If it has children, filter them too
        if (item.children) {
          item.children = item.children.filter(child => {
            if (child.permission && !hasPermission(child.permission)) return false;
            return true;
          });
          // Hide parent if all children are filtered out
          if (item.children.length === 0 && !item.href) return false;
        }

        return true;
      })
    })).filter(section => section.items.length > 0);
  }, [loading, hasPermission]);

  const renderItem = (item: NavItem) => {
    const hasChildren = !!item.children;
    const isExpanded = expanded === item.label;
    const active = item.href && pathname === item.href;
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(isExpanded ? null : item.label)}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-muted-foreground",
              open ? "gap-3 justify-start" : "justify-center",
            )}
            title={!open ? item.label : undefined}
          >
            {Icon && <Icon size={18} />}
            {open && (
              <span className="flex-1 flex items-center justify-between">
                {item.label}
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-2 transition-transform",
                    isExpanded ? "rotate-180" : "",
                  )}
                />
              </span>
            )}
          </button>
        ) : (
          <Link
            href={item.href as any}
            className={cn(
              "flex items-center rounded-xl px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-muted-foreground",
              open ? "gap-3 justify-start" : "justify-center",
            )}
            title={!open ? item.label : undefined}
          >
            {Icon && <Icon size={18} />}
            {open && <span>{item.label}</span>}
          </Link>
        )}

        {/* Submenu */}
        {hasChildren && isExpanded && open && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children?.map((child, index) => {
              if (child.divider) {
                return (
                  <hr
                    key={`divider-${index}`}
                    className="my-2 border-border"
                  />
                );
              }

              const childActive = pathname === child.href;
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href || `link-${index}`}
                  href={child.href as any}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors",
                    childActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {ChildIcon && <ChildIcon size={16} />}
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[105] bg-black/40 lg:hidden transition-opacity",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "group fixed top-0 left-0 z-[110] h-screen bg-card border-r border-border transition-all duration-300 overflow-hidden",
          open ? "w-64" : "w-0 lg:w-16 border-none lg:border-r",
        )}
      >
        <div className="flex flex-col h-full p-3 pt-2">
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-2 py-2 font-semibold whitespace-nowrap",
            open ? "px-2" : "px-0 justify-center"
          )}>
            <div className="flex items-center justify-center w-10 h-10 shrink-0">
              <Image
                src="/icon1.png"
                alt="Brand Logo"
                width={40}
                height={40}
                priority
              />
            </div>

            {/* Text - Only show when open */}
            <span
              className={cn(
                "text-lg transition-all duration-300 origin-left overflow-hidden",
                open ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0"
              )}
            >
              Hotel Dashboard
            </span>
          </div>

          {/* Navigation */}
          {open && (
            <div className="flex-1 overflow-y-auto">
              {filteredNavSections.map((section, idx) => (
                <div key={idx} className="mt-2">
                  <div className="px-2 text-xs uppercase tracking-wide text-muted-foreground/60 font-semibold">
                    {section.title}
                  </div>
                  <nav className="mt-1 space-y-1">
                    {section.items.map(renderItem)}
                  </nav>
                </div>
              ))}
            </div>
          )}

          {open && (
            <footer className="mt-3 pt-3 border-t border-border">
              <p className="text-center text-xs text-neutral-500 truncate">
                V&nbsp;1.0.0
              </p>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
}
