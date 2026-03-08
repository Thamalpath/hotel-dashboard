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

type Role = {
  id: number;
  name: string;
  guard_name: string;
  permissions_count?: number;
};

export default function RolesPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);


  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/roles");
      const resData = response.data.data || response.data;
      setRoles(resData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch roles",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!fetched.current) {
      fetchRoles();
      fetched.current = true;
    }
  }, [fetchRoles]);

  const handleCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setIsSheetOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/admin/roles/${deleteId}`);
      toast({ title: "Success", description: "Role deleted successfully", type: "success" });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete role",
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
      if (editingRole) {
        await api.put(`/admin/roles/${editingRole.id}`, { name: roleName });
        toast({ title: "Success", description: "Role updated successfully", type: "success" });
      } else {
        await api.post("/admin/roles", { name: roleName });
        toast({ title: "Success", description: "Role created successfully", type: "success" });
      }
      setIsSheetOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save role",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Role Name",
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
          <h1 className="text-2xl font-bold">Roles Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage your system roles.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading roles...</span>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={roles} searchable="name" />
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingRole ? "Edit Role" : "Create Role"}</SheetTitle>
            <SheetDescription>
              {editingRole ? "Update role details below." : "Enter the details for the new role."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. Moderator"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
