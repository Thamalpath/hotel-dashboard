"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { decodeId } from "@/utils/hashid";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Trash2, Save, GripVertical, Check, X, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";

type NavItem = {
    id?: number;
    label: string;
    url: string;
    order: number;
    is_active: boolean;
};

type PageSection = {
    id?: number;
    section_name: string;
    title: string | null;
    sub_title?: string | null;
    content: string | null;
    order: number;
    is_visible: boolean;
    image_url?: string | null;
    video_url?: string | null;
    banner_url?: string | null;
    poster_url?: string | null;
    background_url?: string | null;
    media_urls?: Record<string, string>;
    pendingFiles?: Record<string, File>;
    previewUrls?: Record<string, string>;
};

export default function WebsiteManagementPage() {
    const { id: rawId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const fetched = useRef(false);
    
    const merchantId = decodeId(rawId as string);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [merchant, setMerchant] = useState<any>(null);
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [sections, setSections] = useState<PageSection[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!fetched.current) {
            fetched.current = true;

            try {
                setLoading(true);
                const [merchRes, navRes, secRes] = await Promise.all([
                    api.get(`/admin/merchants/${merchantId}`),
                    api.get(`/admin/merchants/${merchantId}/navigation`),
                    api.get(`/admin/merchants/${merchantId}/sections`)
                ]);

                setMerchant(merchRes.data.data);
                setNavItems(navRes.data.data);
                setSections(secRes.data.data);
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to fetch website data",
                    type: "error"
                });
            } finally {
                setLoading(false);
            }            
        }
    }, [merchantId, toast]);

    useEffect(() => {
        if (!merchantId) {
            toast({ title: "Error", description: "Invalid Merchant URL", type: "error" });
            router.push('/dashboard/merchants');
            return;
        }
        fetchData();
    }, [fetchData, merchantId, router, toast]);

    const handleSaveNavigation = async () => {
        try {
            setSaving(true);
            
            const reorderItems = [];
            for (const item of navItems) {
                if (item.id) {
                    await api.put(`/admin/navigation/${item.id}`, {
                        label: item.label,
                        url: item.url,
                        order: item.order,
                        is_active: item.is_active
                    });
                    reorderItems.push({ id: item.id, order: item.order });
                } else {
                    const res = await api.post(`/admin/merchants/${merchantId}/navigation`, {
                        label: item.label,
                        url: item.url,
                        order: item.order,
                        is_active: item.is_active
                    });
                    reorderItems.push({ id: res.data.data.id, order: item.order });
                }
            }

            if (reorderItems.length > 0) {
                await api.patch(`/admin/merchants/${merchantId}/navigation/reorder`, { items: reorderItems });
            }

            toast({ title: "Success", description: "Navigation updated successfully", type: "success" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update navigation",
                type: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSections = async () => {
        try {
            setSaving(true);
            
            const reorderItems = [];
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const isMultipart = section.pendingFiles && Object.keys(section.pendingFiles).length > 0;
                
                if (isMultipart) {
                    const formData = new FormData();
                    formData.append('section_name', section.section_name);
                    if (section.title) formData.append('title', section.title);
                    if (section.sub_title) formData.append('sub_title', section.sub_title);
                    if (section.content) formData.append('content', section.content);
                    formData.append('order', section.order.toString());
                    formData.append('is_visible', section.is_visible ? '1' : '0');
                    
                    Object.entries(section.pendingFiles!).forEach(([k, f]) => {
                        formData.append(`media[${k}]`, f as Blob);
                    });

                    let savedId = section.id;
                    if (section.id) {
                        formData.append('_method', 'PUT');
                        await api.post(`/admin/sections/${section.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    } else {
                        const res = await api.post(`/admin/merchants/${merchantId}/sections`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        savedId = res.data.data.id;
                    }
                    reorderItems.push({ id: savedId!, order: section.order });
                } else {
                    let savedId = section.id;
                    if (section.id) {
                        await api.put(`/admin/sections/${section.id}`, {
                            section_name: section.section_name,
                            title: section.title,
                            sub_title: section.sub_title,
                            content: section.content,
                            order: section.order,
                            is_visible: section.is_visible
                        });
                    } else {
                        const res = await api.post(`/admin/merchants/${merchantId}/sections`, {
                            section_name: section.section_name,
                            title: section.title,
                            sub_title: section.sub_title,
                            content: section.content,
                            order: section.order,
                            is_visible: section.is_visible
                        });
                        savedId = res.data.data.id;
                    }
                    reorderItems.push({ id: savedId!, order: section.order });
                }
            }

            if (reorderItems.length > 0) {
                await api.patch(`/admin/merchants/${merchantId}/sections/reorder`, { items: reorderItems });
            }

            toast({ title: "Success", description: "Page sections updated successfully", type: "success" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update sections",
                type: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const addNavItem = () => {
        const newOrder = navItems.length > 0 ? Math.max(...navItems.map(i => i.order)) + 1 : 1;
        setNavItems([...navItems, { label: "New Item", url: "/", order: newOrder, is_active: true }]);
    };

    const removeNavItem = async (index: number) => {
        const item = navItems[index];
        if (item.id) {
            try {
                await api.delete(`/admin/navigation/${item.id}`);
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to delete item from server",
                    type: "error"
                });
                return;
            }
        }
        setNavItems(navItems.filter((_, i) => i !== index));
    };

    const updateNavItem = (index: number, field: keyof NavItem, value: any) => {
        const updated = [...navItems];
        updated[index] = { ...updated[index], [field]: value };
        setNavItems(updated);
    };

    const moveNavItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === navItems.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...navItems];
        const [removed] = updated.splice(index, 1);
        updated.splice(newIndex, 0, removed);

        // Update orders based on new positions
        const reordered = updated.map((item, idx) => ({
            ...item,
            order: idx + 1
        }));
        
        setNavItems(reordered);
    };

    const updateSection = (index: number, field: keyof PageSection, value: any) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        setSections(updated);
    };

    const toggleNavItemVisibility = async (index: number) => {
        const item = navItems[index];
        const newStatus = !item.is_active;
        updateNavItem(index, 'is_active', newStatus);
        
        if (item.id) {
            try {
                await api.patch(`/admin/navigation/${item.id}/toggle`);
            } catch (error: any) {
                updateNavItem(index, 'is_active', !newStatus);
                toast({ title: "Error", description: "Failed to toggle item visibility.", type: "error" });
            }
        }
    };

    const toggleSectionVisibility = async (index: number) => {
        const section = sections[index];
        const newStatus = !section.is_visible;
        updateSection(index, 'is_visible', newStatus);

        if (section.id) {
            try {
                await api.patch(`/admin/sections/${section.id}/visibility`);
            } catch (error: any) {
                updateSection(index, 'is_visible', !newStatus);
                toast({ title: "Error", description: "Failed to toggle section visibility.", type: "error" });
            }
        }
    };

    const removeSection = async (index: number) => {
        const section = sections[index];
        if (section.id) {
            try {
                await api.delete(`/admin/sections/${section.id}`);
            } catch (error: any) {
                toast({ title: "Error", description: "Failed to delete section.", type: "error" });
                return;
            }
        }
        setSections(sections.filter((_, i) => i !== index));
    };

    const addSection = () => {
        const newOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1;
        setSections([...sections, { section_name: `custom-section-${newOrder}`, title: "New Section", content: "", order: newOrder, is_visible: true }]);
    };

    const handleMediaUpload = (index: number, key: string, file: File) => {
        const localUrl = URL.createObjectURL(file);
        
        const updated = [...sections];
        const section = updated[index];
        
        section.pendingFiles = { ...(section.pendingFiles || {}), [key]: file };
        section.previewUrls = { ...(section.previewUrls || {}), [key]: localUrl };
        
        setSections(updated);
    };

    const handleMediaDelete = async (index: number, key: string) => {
        const section = sections[index];

        if (section.pendingFiles?.[key]) {
            const updated = [...sections];
            
            const pFiles = { ...updated[index].pendingFiles };
            delete pFiles[key];
            updated[index].pendingFiles = pFiles;
            
            const pUrls = { ...updated[index].previewUrls };
            delete pUrls[key];
            updated[index].previewUrls = pUrls;
            
            setSections(updated);
            return;
        }

        if (!section.id) return;

        try {
            await api.delete(`/admin/sections/${section.id}/media/${key}`);
            toast({ title: "Success", description: "Media deleted successfully.", type: "success" });
            
            const newMediaUrls = { ...section.media_urls };
            delete newMediaUrls[`${key}_url`];
            updateSection(index, 'media_urls', newMediaUrls);
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to delete media.", type: "error" });
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        // Dynamic reordering while dragging for better UX
        const updated = [...navItems];
        const item = updated[draggedIndex];
        updated.splice(draggedIndex, 1);
        updated.splice(index, 0, item);
        
        setNavItems(updated);
        setDraggedIndex(index);
    };

    const handleDrop = () => {
        // Finalize orders
        const reordered = navItems.map((item, idx) => ({
            ...item,
            order: idx + 1
        }));
        setNavItems(reordered);
        setDraggedIndex(null);
    };

    const handleSectionDragStart = (index: number) => {
        setDraggedSectionIndex(index);
    };

    const handleSectionDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedSectionIndex === null || draggedSectionIndex === index) return;
        
        const updated = [...sections];
        const item = updated[draggedSectionIndex];
        updated.splice(draggedSectionIndex, 1);
        updated.splice(index, 0, item);
        
        setSections(updated);
        setDraggedSectionIndex(index);
    };

    const handleSectionDrop = () => {
        const reordered = sections.map((section, idx) => ({
            ...section,
            order: idx + 1
        }));
        setSections(reordered);
        setDraggedSectionIndex(null);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Manage Website Structure</h1>
                        <p className="text-muted-foreground text-sm">
                            Editing: <span className="font-bold text-foreground">{merchant?.hotel?.hotel_name}</span> ({merchant?.hotel?.domain || "no domain"})
                        </p>
                    </div>
                </div>
                {merchant?.hotel?.domain && (
                    <Button variant="outline" onClick={() => window.open(`http://${merchant.hotel.domain}`, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" /> View Public Site
                    </Button>
                )}
            </div>

            <Tabs defaultValue="navigation" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="navigation">Navigation Menu</TabsTrigger>
                    <TabsTrigger value="sections">Page Content</TabsTrigger>
                </TabsList>

                {/* Navigation Management */}
                <TabsContent value="navigation" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Configure Navbar</CardTitle>
                                <CardDescription>Manage the main navigation links for the hotel website.</CardDescription>
                            </div>
                            <Button size="sm" onClick={addNavItem}>
                                <Plus className="mr-2 h-4 w-4" /> Add Link
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {navItems.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No navigation items found. Click &quot;Add Link&quot; to start.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {navItems.map((item, index) => (
                                        <div 
                                            key={index} 
                                            draggable 
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={handleDrop}
                                            className={cn(
                                                "flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-sm group transition-all duration-200",
                                                draggedIndex === index && "opacity-50 border-primary border-dashed scale-[0.98] rotate-1"
                                            )}
                                        >
                                            <GripVertical className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing" size={18} />
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Label</Label>
                                                    <Input 
                                                        value={item.label} 
                                                        onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                                                        placeholder="e.g. Home"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">URL / Slug</Label>
                                                    <Input 
                                                        value={item.url} 
                                                        onChange={(e) => updateNavItem(index, 'url', e.target.value)}
                                                        placeholder="e.g. /rooms or https://..."
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Order</Label>
                                                    <Input 
                                                        type="number"
                                                        value={item.order} 
                                                        onChange={(e) => updateNavItem(index, 'order', parseInt(e.target.value))}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 disabled:opacity-30"
                                                    disabled={index === 0}
                                                    onClick={() => moveNavItem(index, 'up')}
                                                >
                                                    <ChevronUp size={14} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 disabled:opacity-30"
                                                    disabled={index === navItems.length - 1}
                                                    onClick={() => moveNavItem(index, 'down')}
                                                >
                                                    <ChevronDown size={14} />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant={item.is_active ? "default" : "outline"} 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={() => toggleNavItemVisibility(index)}
                                                    title={item.is_active ? "Click to deactivate" : "Click to activate"}
                                                >
                                                    {item.is_active ? <Check size={14} /> : <X size={14} />}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeNavItem(index)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveNavigation} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Navigation Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Page Content Management */}
                <TabsContent value="sections" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Page Sections</CardTitle>
                                <CardDescription>Edit the titles and descriptions of the website sections.</CardDescription>
                            </div>
                            <Button size="sm" onClick={addSection}>
                                <Plus className="mr-2 h-4 w-4" /> Add Section
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {sections.map((section, index) => (
                                <div 
                                    key={section.section_name} 
                                    draggable
                                    onDragStart={() => handleSectionDragStart(index)}
                                    onDragOver={(e) => handleSectionDragOver(e, index)}
                                    onDrop={handleSectionDrop}
                                    className={cn(
                                        "space-y-4 p-4 rounded-xl border border-border bg-muted/30 transition-all duration-200",
                                        draggedSectionIndex === index && "opacity-50 border-primary border-dashed scale-[0.98] rotate-1"
                                    )}
                                >
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                        <div className="flex flex-row items-center gap-2 whitespace-nowrap">
                                            <GripVertical
                                                className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
                                                size={16}
                                            />
                                            
                                            <Input 
                                                value={section.section_name} 
                                                onChange={(e) => updateSection(index, 'section_name', e.target.value)}
                                                className="w-48 h-8 text-sm font-mono bg-transparent border-dashed shrink-0"
                                                placeholder="e.g. hero"
                                            />

                                            <span className="text-xs text-muted-foreground shrink-0">
                                                Order: {section.order}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs mr-1">Visible</Label>
                                            <Button 
                                                variant={section.is_visible ? "default" : "outline"} 
                                                size="icon" 
                                                className="h-7 w-7"
                                                onClick={() => toggleSectionVisibility(index)}
                                            >
                                                {section.is_visible ? <Check size={12} /> : <X size={12} />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeSection(index)}
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input 
                                                value={section.title || ""} 
                                                onChange={(e) => updateSection(index, 'title', e.target.value)}
                                                placeholder={`Enter title for ${section.section_name} section`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Sub-title</Label>
                                            <Input 
                                                value={section.sub_title || ""} 
                                                onChange={(e) => updateSection(index, 'sub_title', e.target.value)}
                                                placeholder={`Enter sub-title for ${section.section_name} section`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Content / Description</Label>
                                            <Textarea 
                                                rows={4}
                                                value={section.content || ""} 
                                                onChange={(e) => updateSection(index, 'content', e.target.value)}
                                                placeholder={`Enter content for ${section.section_name} section`}
                                            />
                                        </div>
                                        <div className="space-y-2 border-t border-border/50 pt-2 mt-2">
                                            <Label>Media (Optional)</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {['image', 'banner', 'video', 'background'].map((key) => {
                                                    const backendUrl = section.media_urls?.[`${key}_url`];
                                                    const pendingUrl = section.previewUrls?.[key];
                                                    
                                                    const currentMediaUrl = pendingUrl || backendUrl || null;

                                                    return (
                                                        <div key={key} className="space-y-2 border border-border p-3 rounded-md relative flex flex-col items-center justify-center min-h-[100px] bg-card">
                                                            <div className="capitalize text-xs font-semibold text-muted-foreground w-full text-center">{key}</div>
                                                            {currentMediaUrl ? (
                                                                <div className="relative group w-full h-20 mt-1 flex items-center justify-center overflow-hidden rounded border border-border">
                                                                    {key === 'video' ? (
                                                                        <video src={currentMediaUrl} className="object-cover w-full h-full" muted loop playsInline />
                                                                    ) : (
                                                                        <img src={currentMediaUrl} alt={key} className="object-cover w-full h-full" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <Button 
                                                                            variant="destructive" 
                                                                            size="icon" 
                                                                            className="h-8 w-8 rounded-full shadow-sm"
                                                                            title="Remove Media"
                                                                            onClick={() => handleMediaDelete(index, key)}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <label className="cursor-pointer flex flex-col items-center justify-center p-2 rounded-md hover:bg-muted/50 transition-colors w-full h-full">
                                                                    <Plus size={16} className="text-muted-foreground mb-1" />
                                                                    <span className="text-[10px] text-muted-foreground">Upload</span>
                                                                    <input 
                                                                        type="file" 
                                                                        className="hidden" 
                                                                        accept={key === 'video' ? 'video/mp4,video/webm' : 'image/*'} 
                                                                        onChange={(e) => {
                                                                            if (e.target.files && e.target.files[0]) {
                                                                                handleMediaUpload(index, key, e.target.files[0]);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveSections} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Content Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
