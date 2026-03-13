"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  LockKeyhole, 
  Save, 
  Loader2, 
  CheckSquare, 
  Check, 
  X 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: number;
  name: string;
  permissions: Permission[];
};

type Permission = {
  id: number;
  name: string;
};

// Helper to group permissions into "Dashboard permissions" and "User management"
const groupPermissions = (permissions: Permission[]) => {
  const groups: { [key: string]: Permission[] } = {
    "Dashboard permissions": [],
    "User management": []
  };
  
  permissions.forEach(permission => {
    const name = permission.name.toLowerCase();
    // Keywords for User Management
    const isUserMgmt = name.includes('user') || 
                       name.includes('role') || 
                       name.includes('permission') ||
                       name.includes('account');
    
    if (isUserMgmt) {
      groups["User management"].push(permission);
    } else {
      groups["Dashboard permissions"].push(permission);
    }
  });
  
  // Filter out groups with no permissions if they happen to be empty
  return Object.fromEntries(Object.entries(groups).filter(([_, perms]) => perms.length > 0));
};

export default function AssignPermissionsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/all-permissions"),
      ]);
      setUsers(rolesRes.data.data || rolesRes.data);
      setAllPermissions(permissionsRes.data.data || permissionsRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchData();
      fetched.current = true;
    }
  }, [fetchData]);

useEffect(() => {
  if (selectedUserId) {
    // Fetch the user's current permissions
    api.get(`/admin/users/${selectedUserId}`)
      .then((res) => {
        const user = res.data.data || res.data;
        setSelectedPermissions(user.permissions?.map((p: Permission) => p.name) || []);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to load user permissions",
          type: "error",
        });
        setSelectedPermissions([]);
      });
  } else {
    setSelectedPermissions([]);
  }
}, [selectedUserId, toast]);

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleToggleGroup = (groupPermissions: Permission[]) => {
    const groupNames = groupPermissions.map(p => p.name);
    const allSelected = groupNames.every(name => selectedPermissions.includes(name));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(name => !groupNames.includes(name)));
    } else {
      setSelectedPermissions(prev => {
        const newOnes = groupNames.filter(name => !prev.includes(name));
        return [...prev, ...newOnes];
      });
    }
  };

  const handleToggleAll = () => {
    if (selectedPermissions.length === allPermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissions.map(p => p.name));
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await api.post(`/admin/roles/assign-permissions-to-user/${selectedUserId}`, {  // Changed endpoint
        permissions: selectedPermissions,
      });
      toast({
        title: "Success",
        description: "Permissions assigned to user successfully",
        type: "success",
      });
      setSelectedUserId("");
      setSelectedPermissions([]);
    } catch (error: any) {
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = groupPermissions(allPermissions);
  const isAllGlobalSelected = allPermissions.length > 0 && selectedPermissions.length === allPermissions.length;

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <LockKeyhole className="text-primary h-5 w-5" />
          <h1 className="text-lg font-bold font-poppins whitespace-nowrap">
            Assign Permissions
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto ml-auto">
          <div className="w-full sm:w-[280px]">
             <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-10 bg-muted/50 border-transparent hover:border-primary/50 transition-all rounded-lg">
                  <SelectValue placeholder="Select target user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[300px] w-full items-center justify-center bg-card/50 rounded-xl border border-dashed border-border text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-sm font-medium">Loading configuration...</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Sub-Header */}
          <div className="p-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                 <h3 className="font-bold text-sm">Available Permissions</h3>
                 <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Configure system access</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto h-8 rounded-lg text-xs font-semibold gap-2 border-border"
                onClick={handleToggleAll}
                disabled={!selectedUserId}
              >
                {isAllGlobalSelected ? <X size={12} /> : <CheckSquare size={12} />}
                {isAllGlobalSelected ? "Deselect All" : "Select Global All"}
              </Button>
              <div className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md whitespace-nowrap border border-primary/20">
                {selectedPermissions.length} / {allPermissions.length} SELECTED
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                const groupNames = perms.map(p => p.name);
                const allInGroupSelected = groupNames.every(name => selectedPermissions.includes(name));

                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h4 className="font-bold text-sm tracking-tight text-foreground uppercase">{category}</h4>
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground border border-border">
                          {perms.length} Permissions
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleGroup(perms)}
                        disabled={!selectedUserId}
                        className={`
                          text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded transition-all
                          ${allInGroupSelected 
                            ? "text-primary bg-primary/10 border border-primary/30" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"}
                        `}
                      >
                        {allInGroupSelected ? "Deselect Group" : "Select Group All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xxl:grid-cols-6 gap-x-6 gap-y-1">
                      {perms.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.name);
                        return (
                          <div
                            key={permission.id}
                            className={`
                              flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-colors select-none group
                              ${!selectedUserId ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/30"}
                            `}
                            onClick={() => selectedUserId && handleTogglePermission(permission.name)}
                          >
                            <div className={`
                              flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200
                              ${isSelected 
                                ? "bg-primary border-primary" 
                                : "border-muted-foreground/30 group-hover:border-primary/50"}
                            `}>
                              {isSelected && <Check size={11} className="text-white stroke-[3.5px]" />}
                            </div>
                            <span className={`text-[13px] truncate transition-colors ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                              {permission.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {allPermissions.length === 0 && !loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center bg-muted/5 rounded-2xl border border-dashed border-border/60">
                  <LockKeyhole className="h-8 w-8 text-muted-foreground/30 mb-4" />
                  <h3 className="font-bold text-sm">No permissions found</h3>
                </div>
              )}
            </div>
          </div>

          {/* Footer Save Section */}
          <div className="p-3 border-t border-border bg-muted/5 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!selectedUserId || saving}
              className="h-9 px-6 rounded-lg font-bold gap-2 shadow-sm hover:shadow-md transition-all text-xs"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
