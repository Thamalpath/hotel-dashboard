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
  X,
  User as UserIcon,
  Users as UsersIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";

type TargetType = 'role' | 'user';

type Target = {
  id: number;
  name: string;
};

type Permission = {
  id: number;
  name: string;
};

// Helper to group permissions into categories
const groupPermissions = (permissions: Permission[]) => {
  const groups: { [key: string]: Permission[] } = {
    "Dashboard permissions": [],
    "User management": [],
    "Merchant management": [],
    "System": []
  };
  
  permissions.forEach(permission => {
    const name = permission.name.toLowerCase();
    
    if (name.includes('user') || name.includes('role') || name.includes('permission')) {
      groups["User management"].push(permission);
    } else if (name.includes('merchant') || name.includes('hotel')) {
      groups["Merchant management"].push(permission);
    } else if (name.includes('dashboard') || name.includes('view') || name.includes('show')) {
      groups["Dashboard permissions"].push(permission);
    } else {
      groups["System"].push(permission);
    }
  });
  
  return Object.fromEntries(Object.entries(groups).filter(([_, perms]) => perms.length > 0));
};

export default function AssignPermissionsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [targetType, setTargetType] = useState<TargetType>('role');
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [roles, setRoles] = useState<Target[]>([]);
  const [users, setUsers] = useState<Target[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes, permissionsRes] = await Promise.all([
        api.get("/admin/roles"),
        api.get("/admin/users"),
        api.get("/admin/all-permissions"),
      ]);
      setRoles(rolesRes.data.data || rolesRes.data);
      setUsers(usersRes.data.data || usersRes.data);
      setAllPermissions(permissionsRes.data.data || permissionsRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch base data",
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

  // Handle Fetching Current Permissions for Selected Target
  useEffect(() => {
    if (selectedTargetId) {
      const endpoint = targetType === 'role' 
        ? `/admin/roles/${selectedTargetId}` 
        : `/admin/users/${selectedTargetId}`;

      api.get(endpoint)
        .then((res) => {
          const data = res.data.data || res.data;
          
          if (targetType === 'role') {
            // For roles, permissions is an array of objects
            setSelectedPermissions(data.permissions?.map((p: any) => p.name) || []);
          } else {
            // For users, it's the structured object, we want 'direct'
            setSelectedPermissions(data.permissions?.direct || []);
          }
        })
        .catch((error) => {
          console.error(error);
          toast({
            title: "Error",
            description: `Failed to load ${targetType} permissions`,
            type: "error",
          });
          setSelectedPermissions([]);
        });
    } else {
      setSelectedPermissions([]);
    }
  }, [selectedTargetId, targetType, toast]);

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
    if (!selectedTargetId) return;
    setSaving(true);
    try {
      const endpoint = targetType === 'role'
        ? `/admin/roles/${selectedTargetId}/assign-permissions`
        : `/admin/roles/assign-permissions-to-user/${selectedTargetId}`;

      await api.post(endpoint, {
        permissions: selectedPermissions,
      });

      toast({
        title: "Success",
        description: `Permissions assigned to ${targetType} successfully`,
        type: "success",
      });
      
      // Clear page state
      setSelectedTargetId("");
      setSelectedPermissions([]);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || "An error occurred during save",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = groupPermissions(allPermissions);
  const isAllGlobalSelected = allPermissions.length > 0 && selectedPermissions.length === allPermissions.length;
  const currentTargets = targetType === 'role' ? roles : users;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LockKeyhole className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-poppins">Permissions Hub</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Manage Role Defaults & User Overrides
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Target Type Toggle */}
          <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => { setTargetType('role'); setSelectedTargetId(""); }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all w-full sm:w-auto",
                targetType === 'role' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UsersIcon size={16} />
              Roles
            </button>
            <button
              onClick={() => { setTargetType('user'); setSelectedTargetId(""); }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all w-full sm:w-auto",
                targetType === 'user' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserIcon size={16} />
              Users
            </button>
          </div>

          <div className="w-full sm:w-[280px]">
             <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                <SelectTrigger className="h-11 bg-muted/50 border-transparent hover:border-primary/50 transition-all rounded-xl">
                  <SelectValue placeholder={`Select target ${targetType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {currentTargets.map((target) => (
                    <SelectItem key={target.id} value={target.id.toString()}>
                      <div className="flex items-center gap-2">
                        {targetType === 'role' ? <ShieldCheck size={14} className="text-primary" /> : <UserIcon size={14} className="text-primary" />}
                        <span className="font-medium text-sm">{target.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[400px] w-full flex-col items-center justify-center bg-card/50 rounded-2xl border border-dashed border-border text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Hydrating permissions matrix...</span>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Action Bar */}
          <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                 <h3 className="font-bold text-sm">Target Permissions</h3>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    {targetType === 'role' ? 'Define common role access' : 'Apply specific user overrides'}
                 </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto h-9 rounded-xl text-xs font-bold gap-2 border-border"
                onClick={handleToggleAll}
                disabled={!selectedTargetId}
              >
                {isAllGlobalSelected ? <X size={14} /> : <CheckSquare size={14} />}
                {isAllGlobalSelected ? "Deselect All" : "Select Global All"}
              </Button>
              <div className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg whitespace-nowrap border border-primary/20">
                {selectedPermissions.length} / {allPermissions.length} ACTIVE
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-10">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                const groupNames = perms.map(p => p.name);
                const allInGroupSelected = groupNames.every(name => selectedPermissions.includes(name));

                return (
                  <div key={category} className="space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-5 bg-primary rounded-full" />
                        <h4 className="font-extrabold text-sm tracking-tight text-foreground uppercase">{category}</h4>
                        <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-black text-muted-foreground border border-border">
                          {perms.length} AVAILABLE
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleGroup(perms)}
                        disabled={!selectedTargetId}
                        className={cn(
                          "text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg transition-all border",
                          allInGroupSelected 
                            ? "text-primary bg-primary/10 border-primary/30" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                        )}
                      >
                        {allInGroupSelected ? "Deselect Group" : "Select Group"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4">
                      {perms.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.name);
                        return (
                          <div
                            key={permission.id}
                            className={cn(
                              "flex items-center gap-3 py-3 px-4 rounded-xl transition-all select-none group border",
                              !selectedTargetId 
                                ? "opacity-40 cursor-not-allowed border-transparent" 
                                : isSelected 
                                  ? "bg-primary/5 border-primary/20 cursor-pointer shadow-sm" 
                                  : "bg-background border-border hover:border-primary/40 cursor-pointer"
                            )}
                            onClick={() => selectedTargetId && handleTogglePermission(permission.name)}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300",
                              isSelected 
                                ? "bg-primary border-primary rotate-0 scale-100" 
                                : "border-muted-foreground/30 group-hover:border-primary/50 rotate-[-15deg] scale-95"
                            )}>
                              {isSelected && <Check size={12} className="text-white stroke-[4px]" />}
                            </div>
                            <span className={cn(
                              "text-sm transition-colors truncate",
                              isSelected ? "font-bold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
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
                <div className="py-20 flex flex-col items-center justify-center text-center bg-muted/5 rounded-3xl border border-dashed border-border/60">
                  <div className="p-4 bg-muted/10 rounded-full mb-4">
                    <LockKeyhole className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-bold text-lg">No permissions cataloged</h3>
                  <p className="text-sm text-muted-foreground">Verify the database seeders are running properly.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Save Section */}
          <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium italic">
              {targetType === 'user' && "* Setting user permissions acts as an override or extension to their role default."}
            </p>
            <Button 
              onClick={handleSave} 
              disabled={!selectedTargetId || saving}
              className="h-11 px-8 rounded-xl font-black gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "SAVING CHANGES..." : "SYNC PERMISSIONS"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
