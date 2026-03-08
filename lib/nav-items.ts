import {
  type LucideIcon,
  LayoutDashboard,
  Archive,
  Building2,
  Users,
  ShieldCheck,
  KeySquare,
  UserCog,
  LockKeyhole,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
    divider?: boolean;
    completed?: boolean;
  }[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Dashboards",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        label: "Master Files",
        icon: Archive,
        children: [
          {
            href: "/dashboard/master/merchants",
            label: "Merchants",
            icon: Building2,
          },
        ],
      },
      {
        label: "User Management",
        icon: UserCog,
        children: [
          {
            href: "/dashboard/users",
            label: "Users",
            icon: Users,
          },
          {
            href: "/dashboard/roles",
            label: "Roles",
            icon: ShieldCheck,
          },
          {
            href: "/dashboard/permissions",
            label: "Permissions",
            icon: LockKeyhole,
          },
          {
            href: "/dashboard/roles/assign-permissions",
            label: "Permissions Assigning",
            icon: KeySquare,
          },
        ],
      },
    ],
  },
];
