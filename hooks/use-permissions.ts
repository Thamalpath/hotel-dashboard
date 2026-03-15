import { useState, useEffect } from 'react';

export type UserPermissions = {
  direct: string[];
  roles: string[];
  all: string[];
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('permissions');
    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse permissions from localStorage", e);
      }
    }
    setLoading(false);
  }, []);

  const hasPermission = (permission: string) => {
    if (!permissions) return false;
    return permissions.all.includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (!permissions) return false;
    return perms.some(p => permissions.all.includes(p));
  };

  const hasAllPermissions = (perms: string[]) => {
    if (!permissions) return false;
    return perms.every(p => permissions.all.includes(p));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
