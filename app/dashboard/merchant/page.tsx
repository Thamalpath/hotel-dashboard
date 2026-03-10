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
import { Plus, Pencil, Trash2, Mail, User as UserIcon, Building2, Phone, Globe, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Hotel = {
  id: number;
  hotel_name: string;
  hotel_code: string;
  domain: string;
  phone: string;
  email: string;
  status: 'active' | 'suspended';
};

type HotelAdminData = {
  id: number;
  name: string;
  email: string;
  hotel: Hotel | null;
  roles: string[];
};

export default function HotelAdminsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<HotelAdminData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<HotelAdminData | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    hotel_name: "",
    domain: "",
    phone: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/super-admin/admins");
      setAdmins(response.data.data);
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
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      hotel_name: "",
      domain: "",
      phone: "",
    });
    setIsSheetOpen(true);
  };

  const handleEdit = (admin: HotelAdminData) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      hotel_name: admin.hotel?.hotel_name || "",
      domain: admin.hotel?.domain || "",
      phone: admin.hotel?.phone || "",
    });
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/super-admin/admins/${deleteId}`);
      toast({ title: "Success", description: "Hotel Admin deleted successfully", type: "success" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete admin",
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
      if (editingAdmin) {
        await api.put(`/super-admin/admins/${editingAdmin.id}`, formData);
        toast({ title: "Success", description: "Hotel Admin updated successfully", type: "success" });
      } else {
        await api.post("/super-admin/admins", formData);
        toast({ title: "Success", description: "Hotel Admin created successfully", type: "success" });
      }
      setIsSheetOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save hotel admin",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<HotelAdminData>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Admin Details",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon size={14} />
                </div>
                <span className="font-medium text-sm">{row.original.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-10">
                <Mail size={10} />
                {row.original.email}
            </div>
        </div>
      )
    },
    {
      accessorKey: "hotel",
      header: "Hotel Information",
      cell: ({ row }) => {
        const hotel = row.original.hotel;
        if (!hotel) return <span className="text-muted-foreground text-xs italic">No hotel linked</span>;
        return (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="flex items-center gap-2">
                <Building2 size={14} className="text-blue-500" />
                <span className="font-bold text-sm text-foreground">{hotel.hotel_name}</span>
            </div>
            <div className="grid grid-cols-1 gap-1 ml-6">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Globe size={11} className="text-muted-foreground/60" />
                    {hotel.domain || "N/A"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Phone size={11} className="text-muted-foreground/60" />
                    {hotel.phone}
                </div>
            </div>
          </div>
        );
      }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.hotel?.status || 'suspended';
            return (
                <Badge variant={status === 'active' ? 'default' : 'destructive'} className="text-[10px] uppercase font-bold px-2 py-0">
                    {status}
                </Badge>
            );
        }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-3">
          <Pencil size={15} className="text-blue-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleEdit(row.original)}/>
          <Trash2 size={15} className="text-red-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleDeleteClick(row.original.id)}/>          
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hotel Administration</h1>
          <p className="text-muted-foreground text-sm">Manage hotel administrators and their accounts.</p>
        </div>
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Register Hotel Admin
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Fetching administrators...</span>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={admins} searchable="name" />
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle>{editingAdmin ? "Edit Hotel Admin" : "Register Hotel Admin"}</SheetTitle>
            <SheetDescription>
              {editingAdmin ? "Update administrator and hotel details." : "Create a new administrator account and link them to a hotel."}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Account Details */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-l-2 border-primary pl-2">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="John Doe"
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
                        placeholder="john@example.com"
                    />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password {editingAdmin && "(Leave blank to keep current)"}</Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingAdmin}
                    />
                </div>
            </div>

            {/* Hotel Details */}
            <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-l-2 border-primary pl-2">Hotel Information</h3>
                <div className="space-y-2">
                    <Label htmlFor="hotel_name">Hotel Name</Label>
                    <Input
                        id="hotel_name"
                        value={formData.hotel_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, hotel_name: e.target.value }))}
                        required
                        placeholder="Grand Royal Hotel"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="domain">Domain (Optional)</Label>
                    <Input
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                        placeholder="grandroyal.com"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        placeholder="+1 234 567 890"
                    />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 items-center border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : editingAdmin ? "Update Admin" : "Register Admin"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Hotel Admin"
        description="Are you sure you want to delete this administrator? This will also remove the linked hotel account. This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
