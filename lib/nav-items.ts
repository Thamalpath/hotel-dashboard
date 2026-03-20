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
  Layout,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  permission?: string;
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
    permission?: string;
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
        permission: "view-dashboard",
      },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        href: "/dashboard/merchants",
        label: "Merchant Management",
        icon: Building2,
        permission: "manage-users",
      },
      {
        href: "/dashboard/layout",
        label: "Website Layout",
        icon: Layout,
        permission: "manage-users",
      },
      {
        label: "User Management",
        icon: UserCog,
        permission: "manage-users",
        children: [
          {
            href: "/dashboard/users",
            label: "Users",
            icon: Users,
            permission: "manage-users",
          },
          {
            href: "/dashboard/roles",
            label: "Roles",
            icon: ShieldCheck,
            permission: "manage-roles",
          },
          {
            href: "/dashboard/permissions",
            label: "Permissions",
            icon: LockKeyhole,
            permission: "manage-roles",
          },
          {
            href: "/dashboard/roles/assign-permissions",
            label: "Permissions Assigning",
            icon: KeySquare,
            permission: "manage-roles",
          },
        ],
      },
    ],
  },
];
