"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LockKeyhole, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = {
  id: number;
  name: string;
  permissions: Permission[];
};

type Permission = {
  id: number;
  name: string;
};

export default function AssignPermissionsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get("/admin/roles"),
        api.get("/admin/all-permissions"),
      ]);
      setRoles(rolesRes.data.data || rolesRes.data);
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
    if (selectedRoleId) {
      const role = roles.find((r) => r.id.toString() === selectedRoleId);
      if (role) {
        setSelectedPermissions(role.permissions.map((p) => p.name));
      }
    } else {
      setSelectedPermissions([]);
    }
  }, [selectedRoleId, roles]);

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await api.post(`/admin/roles/${selectedRoleId}/assign-permissions`, {
        permissions: selectedPermissions,
      });
      toast({
        title: "Success",
        description: "Permissions assigned successfully",
        type: "success",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign permissions",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Permissions Assignment</h1>
          <p className="text-muted-foreground text-sm">Assign permissions to roles.</p>
        </div>
        <Button onClick={handleSave} disabled={!selectedRoleId || saving}>
          <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Assignments"}
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading permissions configuration...</span>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          {/* Role Selection */}
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border h-fit space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRoleId && (
              <div className="pt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-xs text-primary font-medium">Currently modifying:</div>
                  <div className="text-lg font-bold text-primary">{roles.find(r => r.id.toString() === selectedRoleId)?.name}</div>
              </div>
            )}
          </div>

          {/* Permissions list */}
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
               <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Permissions</Label>
               <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{selectedPermissions.length} selected</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                    ${selectedPermissions.includes(permission.name) 
                      ? "border-primary/50 bg-primary/5 shadow-sm" 
                      : "border-transparent hover:bg-muted bg-neutral-50 dark:bg-neutral-900/50"}
                  `}
                  onClick={() => handleTogglePermission(permission.name)}
                >
                  <div className={`
                      w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${selectedPermissions.includes(permission.name) ? "bg-primary border-primary" : "border-neutral-300 dark:border-neutral-700"}
                  `}>
                      {selectedPermissions.includes(permission.name) && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <LockKeyhole size={14} className={selectedPermissions.includes(permission.name) ? "text-primary" : "text-muted-foreground"} />
                    <span className={`text-sm ${selectedPermissions.includes(permission.name) ? "font-medium" : ""}`}>{permission.name}</span>
                  </div>
                </div>
              ))}
              
              {allPermissions.length === 0 && (
                  <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                      No permissions found.
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
