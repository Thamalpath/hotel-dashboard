"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Permission = {
  id: number;
  name: string;
  guard_name: string;
};

export default function PermissionsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/permissions");
      const resData = response.data.data || response.data;
      setPermissions(resData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch permissions",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchPermissions();
      fetched.current = true;
    }
  }, [fetchPermissions]);

  const handleCreate = () => {
    setEditingPermission(null);
    setPermissionName("");
    setIsSheetOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionName(permission.name);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/admin/permissions/${deleteId}`);
      toast({ title: "Success", description: "Permission deleted successfully", type: "success" });
      fetchPermissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete permission",
        type: "error",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPermission) {
        await api.put(`/admin/permissions/${editingPermission.id}`, { name: permissionName });
        toast({ title: "Success", description: "Permission updated successfully", type: "success" });
      } else {
        await api.post("/admin/permissions", { name: permissionName });
        toast({ title: "Success", description: "Permission created successfully", type: "success" });
      }
      setIsSheetOpen(false);
      fetchPermissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save permission",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Permission Name",
    },
    {
      accessorKey: "guard_name",
      header: "Guard Name",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Pencil size={14} className="text-blue-500 cursor-pointer" onClick={() => handleEdit(row.original)}/>
          <Trash2 size={14} className="text-red-500 cursor-pointer" onClick={() => handleDeleteClick(row.original.id)}/>          
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage your system permissions.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Permission
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading permissions...</span>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={permissions} searchable="name" />
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingPermission ? "Edit Permission" : "Create Permission"}</SheetTitle>
            <SheetDescription>
              {editingPermission ? "Update permission details below." : "Enter the details for the new permission."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="permissionName">Permission Name</Label>
              <Input
                id="permissionName"
                placeholder="e.g. view-users"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingPermission ? "Update Permission" : "Create Permission"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Permission"
        description="Are you sure you want to delete this permission? This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
