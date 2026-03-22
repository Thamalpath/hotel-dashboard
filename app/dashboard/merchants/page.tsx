"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { encodeId } from "@/utils/hashid";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from "@/components/model/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Mail, User as UserIcon, Building2, Phone, Globe, Loader2, Layout, MoreHorizontal, MoreVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MerchantHotel = {
  id: number;
  hotel_name: string;
  domain: string;
  phone: string;
  email: string;
  status: 'active' | 'suspended';
};

type MerchantData = {
  id: number;
  name: string;
  email: string;
  hotel: MerchantHotel | null;
  roles: string[];
};

export default function MerchantsPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [editingMerchant, setEditingMerchant] = useState<MerchantData | null>(null);
  const router = useRouter();
  
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
      const response = await api.get("/admin/merchants");
      setMerchants(response.data.data);
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
    setEditingMerchant(null);
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

  const handleEdit = async (merchant: MerchantData) => {
    setEditingMerchant(merchant);
    
    setFormData({
        name: merchant.name,
        email: merchant.email,
        password: "",
        hotel_name: merchant.hotel?.hotel_name || "",
        domain: merchant.hotel?.domain || "",
        phone: merchant.hotel?.phone || "",
    });
    
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/admin/merchants/${deleteId}`);
      toast({ title: "Success", description: "Merchant deleted successfully", type: "success" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete merchant",
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
      if (editingMerchant) {
        await api.put(`/admin/merchants/${editingMerchant.id}`, formData);
        toast({ title: "Success", description: "Merchant updated successfully", type: "success" });
      } else {
        await api.post("/admin/merchants", formData);
        toast({ title: "Success", description: "Merchant created successfully", type: "success" });
      }
      setIsSheetOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save merchant",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<MerchantData>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Merchant Details",
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/merchants/${encodeId(row.original.id)}/website`)} className="cursor-pointer">
              <Layout className="mr-2 h-4 w-4 text-emerald-500" />
              Manage Website
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4 text-blue-500" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteClick(row.original.id)} className="cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merchant Management</h1>
          <p className="text-muted-foreground text-sm">Manage hotel administrators and their accounts.</p>
        </div>
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Register Merchant
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Fetching merchants...</span>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={merchants} searchable="name" />
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle>{editingMerchant ? "Edit Merchant" : "Register Merchant"}</SheetTitle>
            <SheetDescription>
              {editingMerchant ? "Update merchant profile and hotel website structure." : "Create a new merchant account and define their initial website structure."}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="mt-6">
            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="hotel">Hotel</TabsTrigger>
                </TabsList>

                {/* Account Details */}
                <TabsContent value="account" className="space-y-6 py-2">
                    <div className="space-y-4">
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
                            <Label htmlFor="password">Password {editingMerchant && "(Leave blank to keep current)"}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                required={!editingMerchant}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Hotel Details */}
                <TabsContent value="hotel" className="space-y-6 py-2">
                    <div className="space-y-4">
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
                            <Label htmlFor="domain">Domain</Label>
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
                </TabsContent>


            </Tabs>

            <div className="flex gap-3 justify-end pt-6 items-center border-t border-border mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : editingMerchant ? "Update Merchant" : "Register Merchant"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Merchant"
        description="Are you sure you want to delete this merchant? This will also remove the linked hotel account. This action cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
