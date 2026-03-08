"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
import { Plus, Pencil, Trash2, Mail, User as UserIcon, Loader2 } from "lucide-react";
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
};

type UserData = {
  id: number;
  name: string;
  email: string;
  roles: Role[];
};

export default function UsersPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    selectedRoles: [] as number[],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/roles"),
      ]);
      setUsers(usersRes.data.data || usersRes.data);
      setAvailableRoles(rolesRes.data.data || rolesRes.data);
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

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      selectedRoles: [],
    });
    setIsSheetOpen(true);
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      selectedRoles: user.roles.map(r => r.id),
    });
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/admin/users/${deleteId}`);
      toast({ title: "Success", description: "User deleted successfully", type: "success" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
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
      const payload = {
        ...formData,
        roles: formData.selectedRoles.map(id => {
            const role = availableRoles.find(r => r.id === id);
            return role ? role.name : null;
        }).filter(Boolean),
      };

      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
        toast({ title: "Success", description: "User updated successfully", type: "success" });
      } else {
        await api.post("/admin/users", payload);
        toast({ title: "Success", description: "User created successfully", type: "success" });
      }
      setIsSheetOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save user",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon size={14} />
            </div>
            <span>{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
            <Mail size={12} />
            {row.original.email}
        </div>
      )
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role.id} className="text-[10px]">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
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
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground text-sm">Manage system users and their roles.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading users...</span>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={users} searchable="name" />
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingUser ? "Edit User" : "Create User"}</SheetTitle>
            <SheetDescription>
              {editingUser ? "Update user details below." : "Enter the details for the new user."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editingUser && "(Leave blank to keep current)"}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required={!editingUser}
              />
            </div>
            
            <div className="space-y-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                    {availableRoles.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRole(role.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                formData.selectedRoles.includes(role.id)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-primary border-transparent hover:border-border"
                            }`}
                        >
                            {role.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
