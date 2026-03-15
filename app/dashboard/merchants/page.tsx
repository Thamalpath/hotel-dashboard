"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
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
import { Plus, Pencil, Trash2, Mail, User as UserIcon, Building2, Phone, Globe, Loader2, Layout, Check, X, GripVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<MerchantData | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    hotel_name: "",
    domain: "",
    phone: "",
    navigation_items: [] as any[],
    page_sections: [] as any[],
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
      navigation_items: [
        { label: 'Home', url: '/', order: 1 },
        { label: 'Rooms', url: '/rooms', order: 2 },
        { label: 'About', url: '/about', order: 3 },
      ],
      page_sections: [
        { section_name: 'Hero', title: '', content: '', order: 1 },
        { section_name: 'About', title: '', content: '', order: 2 },
      ],
    });
    setIsSheetOpen(true);
  };

  const handleEdit = async (merchant: MerchantData) => {
    setEditingMerchant(merchant);
    
    // Fetch current structure for editing
    try {
        const [navRes, secRes] = await Promise.all([
            api.get(`/admin/merchants/${merchant.id}/navigation`),
            api.get(`/admin/merchants/${merchant.id}/sections`)
        ]);

        setFormData({
            name: merchant.name,
            email: merchant.email,
            password: "",
            hotel_name: merchant.hotel?.hotel_name || "",
            domain: merchant.hotel?.domain || "",
            phone: merchant.hotel?.phone || "",
            navigation_items: navRes.data.data,
            page_sections: secRes.data.data,
        });
    } catch (error) {
        setFormData({
            name: merchant.name,
            email: merchant.email,
            password: "",
            hotel_name: merchant.hotel?.hotel_name || "",
            domain: merchant.hotel?.domain || "",
            phone: merchant.hotel?.phone || "",
            navigation_items: [],
            page_sections: [],
        });
    }
    
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
          <div className="flex gap-3">
          <Layout 
            size={15} 
            className="text-emerald-500 cursor-pointer hover:scale-110 transition-transform" 
            onClick={() => router.push(`/dashboard/merchants/${row.original.id}/website`)}
          />
          <Pencil size={15} className="text-blue-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleEdit(row.original)}/>
          <Trash2 size={15} className="text-red-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleDeleteClick(row.original.id)}/>          
        </div>
      ),
    },
  ];

  const updateNavItem = (index: number, field: string, value: any) => {
    const updated = [...formData.navigation_items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, navigation_items: updated }));
  };

  const addNavItem = () => {
    const newOrder = formData.navigation_items.length + 1;
    setFormData(prev => ({ 
        ...prev, 
        navigation_items: [...prev.navigation_items, { label: "New Item", url: "/", order: newOrder, is_active: true }] 
    }));
  };

  const removeNavItem = (index: number) => {
    setFormData(prev => ({ 
        ...prev, 
        navigation_items: prev.navigation_items.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index: number, field: string, value: any) => {
    const updated = [...formData.page_sections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, page_sections: updated }));
  };

  const handleNavDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleNavDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...formData.navigation_items];
    const item = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, item);
    
    setFormData(prev => ({ ...prev, navigation_items: updated }));
    setDraggedIndex(index);
  };

  const handleNavDrop = () => {
    // Update orders based on final positions
    const reordered = formData.navigation_items.map((item, idx) => ({
        ...item,
        order: idx + 1
    }));
    setFormData(prev => ({ ...prev, navigation_items: reordered }));
    setDraggedIndex(null);
  };

  const handleSectionDragStart = (index: number) => {
    setDraggedSectionIndex(index);
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
    
    const updated = [...formData.page_sections];
    const item = updated[draggedSectionIndex];
    updated.splice(draggedSectionIndex, 1);
    updated.splice(index, 0, item);
    
    setFormData(prev => ({ ...prev, page_sections: updated }));
    setDraggedSectionIndex(index);
  };

  const handleSectionDrop = () => {
    const reordered = formData.page_sections.map((section, idx) => ({
        ...section,
        order: idx + 1
    }));
    setFormData(prev => ({ ...prev, page_sections: reordered }));
    setDraggedSectionIndex(null);
  };

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
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="hotel">Hotel</TabsTrigger>
                    <TabsTrigger value="navigation">Navbar</TabsTrigger>
                    <TabsTrigger value="sections">Sections</TabsTrigger>
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

                {/* Navigation Items */}
                <TabsContent value="navigation" className="space-y-4 py-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-primary">Navbar Links</Label>
                        <Button type="button" size="sm" variant="outline" onClick={addNavItem} className="h-7 px-2 text-[10px]">
                            <Plus className="h-3 w-3 mr-1" /> Add Link
                        </Button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {formData.navigation_items.map((item, index) => (
                            <div 
                                key={index} 
                                draggable
                                onDragStart={() => handleNavDragStart(index)}
                                onDragOver={(e) => handleNavDragOver(e, index)}
                                onDrop={handleNavDrop}
                                className={cn(
                                    "flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border group relative transition-all duration-200",
                                    draggedIndex === index && "opacity-50 border-primary border-dashed scale-[0.98]"
                                )}
                            >
                                <GripVertical size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing" />
                                <div className="grid grid-cols-4 gap-2 flex-1">
                                    <Input 
                                        className="col-span-2 h-8 text-xs" 
                                        value={item.label} 
                                        placeholder="Label"
                                        onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                                    />
                                    <Input 
                                        className="h-8 text-xs" 
                                        value={item.url} 
                                        placeholder="URL"
                                        onChange={(e) => updateNavItem(index, 'url', e.target.value)}
                                    />
                                    <div className="flex items-center gap-1 justify-end">
                                        <Button 
                                            type="button"
                                            variant={item.is_active ? "default" : "outline"} 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => updateNavItem(index, 'is_active', !item.is_active)}
                                        >
                                            {item.is_active ? <Check size={12} /> : <X size={12} />}
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-red-500"
                                            onClick={() => removeNavItem(index)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Page Sections */}
                <TabsContent value="sections" className="space-y-4 py-2">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        <Label className="text-[10px] font-bold uppercase text-primary mb-2 block">Available Sections</Label>
                        {formData.page_sections.map((section, index) => (
                            <div 
                                key={section.section_name} 
                                draggable
                                onDragStart={() => handleSectionDragStart(index)}
                                onDragOver={(e) => handleSectionDragOver(e, index)}
                                onDrop={handleSectionDrop}
                                className={cn(
                                    "flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border hover:bg-muted/40 transition-all duration-200",
                                    draggedSectionIndex === index && "opacity-50 border-primary border-dashed scale-[0.98]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <GripVertical size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{section.section_name}</span>
                                        <span className="text-[10px] text-muted-foreground">Order position: {section.order}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-[10px] mr-1">{section.is_visible ? "Enabled" : "Disabled"}</Label>
                                    <Button 
                                        type="button"
                                        variant={section.is_visible ? "default" : "outline"} 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => updateSection(index, 'is_visible', !section.is_visible)}
                                    >
                                        {section.is_visible ? <Check size={14} /> : <X size={14} />}
                                    </Button>
                                </div>
                            </div>
                        ))}
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
