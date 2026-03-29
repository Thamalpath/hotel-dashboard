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
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Trash2, Save, GripVertical, Check, X, ExternalLink, ChevronUp, ChevronDown, Layout, FileText, Database, Settings } from "lucide-react";

type NavItem = {
    _frontendId: string;
    id?: number;
    label: string;
    url: string;
    order: number;
    is_active: boolean;
    seo?: {
        meta_title?: string;
        meta_description?: string;
        meta_keywords?: string;
        og_title?: string;
        og_description?: string;
        og_image?: string | null;
        canonical_url?: string;
        is_indexable?: boolean;
    };
    pendingOgImage?: File;
    previewOgImage?: string;
};

type PageSection = {
    _frontendId: string;
    id?: number;
    navigation_item_id: number | null;
    section_name: string;
    title: string | null;
    sub_title?: string | null;
    content: string | null;
    order: number;
    is_visible: boolean;
    data_source: string;
    section_key?: string;
    settings?: Record<string, any>;
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
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [expandedNavIndex, setExpandedNavIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>("navigation");
    const [selectedNavItemId, setSelectedNavItemId] = useState<number | null>(null);

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
                const navData = (navRes.data.data || []).map((item: any) => ({
                    ...item,
                    _frontendId: item.id ? `nav-${item.id}` : Math.random().toString(36).substring(7)
                }));
                setNavItems(navData);
                
                const sectionsData = secRes.data.data;
                const sectionsWithContents = await Promise.all(
                    sectionsData.map(async (sec: any) => {
                        try {
                            const contentRes = await api.get(`/admin/sections/${sec.id}/contents`);
                            const contents = contentRes.data.data;
                            const contentMap: Record<string, any> = {};
                            const mediaUrls: Record<string, string> = {};
                            
                            contents.forEach((c: any) => {
                                if (c.type === 'image' || c.type === 'video') {
                                    mediaUrls[`${c.field_key}_url`] = c.url;
                                } else {
                                    contentMap[c.field_key] = c.field_value;
                                }
                            });

                            return {
                                ...sec,
                                _frontendId: Math.random().toString(36).substring(7),
                                data_source: sec.data_source || 'static',
                                title: contentMap.title || "",
                                sub_title: contentMap.sub_title || "",
                                content: contentMap.content || "",
                                media_urls: mediaUrls
                            };
                        } catch (err) {
                            return sec;
                        }
                    })
                );
                
                setSections(sectionsWithContents);
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
                let savedId = item.id;
                const payload = {
                    label: item.label,
                    url: item.url,
                    order: item.order,
                    is_active: item.is_active,
                    meta_title: item.seo?.meta_title,
                    meta_description: item.seo?.meta_description,
                    meta_keywords: item.seo?.meta_keywords,
                    og_title: item.seo?.og_title,
                    og_description: item.seo?.og_description,
                    canonical_url: item.seo?.canonical_url,
                    is_indexable: item.seo?.is_indexable !== undefined ? item.seo.is_indexable : true
                };

                if (item.id) {
                    await api.put(`/admin/navigation/${item.id}`, payload);
                } else {
                    const res = await api.post(`/admin/merchants/${merchantId}/navigation`, payload);
                    savedId = res.data.data.id;
                }
                
                reorderItems.push({ id: savedId!, order: item.order });

                if (item.pendingOgImage && savedId) {
                    const formData = new FormData();
                    formData.append('og_image', item.pendingOgImage);
                    await api.post(`/admin/navigation/${savedId}/og-image`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
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
            const displaySections = sections.filter(s => s.navigation_item_id === selectedNavItemId);
            const reorderItems = [];

            for (const section of displaySections) {
                let savedId = section.id;
                
                // 1. Save or Update Section basic info
                if (section.id) {
                    await api.put(`/admin/sections/${section.id}`, {
                        section_name: section.section_name,
                        data_source: section.data_source,
                        order: section.order,
                        is_visible: section.is_visible,
                        navigation_item_id: section.navigation_item_id,
                        settings: section.settings
                    });
                } else {
                    const res = await api.post(`/admin/merchants/${merchantId}/sections`, {
                        section_name: section.section_name,
                        data_source: section.data_source,
                        order: section.order,
                        is_visible: section.is_visible,
                        navigation_item_id: section.navigation_item_id,
                        settings: section.settings
                    });
                    savedId = res.data.data.id;
                }
                
                // 2. Update Contents
                await api.put(`/admin/sections/${savedId}/contents`, {
                    fields: {
                        title: section.title || "",
                        sub_title: section.sub_title || "",
                        content: section.content || ""
                    }
                });

                // 3. Upload Pending Files
                if (section.pendingFiles && Object.keys(section.pendingFiles).length > 0) {
                    for (const [key, file] of Object.entries(section.pendingFiles)) {
                        const formData = new FormData();
                        formData.append('key', key);
                        formData.append('file', file);
                        await api.post(`/admin/sections/${savedId}/contents/media`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                }
                
                reorderItems.push({ id: savedId!, order: section.order });
            }

            if (reorderItems.length > 0) {
                await api.patch(`/admin/merchants/${merchantId}/sections/reorder`, { items: reorderItems });
            }

            toast({ title: "Success", description: "Page sections saved successfully", type: "success" });
            fetched.current = false;
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
        setNavItems([
            ...navItems, 
            { 
                _frontendId: Math.random().toString(36).substring(7),
                label: "New Item", 
                url: "/", 
                order: newOrder, 
                is_active: true 
            }
        ]);
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

    const updateNavSeo = (index: number, field: string, value: any) => {
        const updated = [...navItems];
        if (!updated[index].seo) updated[index].seo = {};
        updated[index].seo![field as keyof NonNullable<NavItem['seo']>] = value;
        setNavItems(updated);
    };

    const handleNavOgUpload = (index: number, file: File) => {
        // Validation: OG Images max 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Image too large",
                description: "OG image must be smaller than 5MB.",
                type: "error"
            });
            return;
        }

        const localUrl = URL.createObjectURL(file);
        const updated = [...navItems];
        updated[index].pendingOgImage = file;
        updated[index].previewOgImage = localUrl;
        setNavItems(updated);
    };

    const handleNavOgDelete = async (index: number) => {
        const item = navItems[index];
        if (item.pendingOgImage) {
            const updated = [...navItems];
            delete updated[index].pendingOgImage;
            delete updated[index].previewOgImage;
            setNavItems(updated);
            return;
        }

        if (item.id && item.seo?.og_image) {
            try {
                await api.delete(`/admin/navigation/${item.id}/og-image`);
                toast({ title: "Success", description: "OG image deleted.", type: "success" });
                const updated = [...navItems];
                updated[index].seo!.og_image = null;
                setNavItems(updated);
            } catch (error: any) {
                toast({ title: "Error", description: "Failed to delete OG image.", type: "error" });
            }
        }
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

    const updateSection = (frontendId: string, field: keyof PageSection, value: any) => {
        setSections(prev => prev.map(s => s._frontendId === frontendId ? { ...s, [field]: value } : s));
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

    const toggleSectionVisibility = async (frontendId: string) => {
        const section = sections.find(s => s._frontendId === frontendId);
        if (!section) return;
        const newStatus = !section.is_visible;
        updateSection(frontendId, 'is_visible', newStatus);

        if (section.id) {
            try {
                await api.patch(`/admin/sections/${section.id}/visibility`);
            } catch (error: any) {
                updateSection(frontendId, 'is_visible', !newStatus);
                toast({ title: "Error", description: "Failed to toggle section visibility.", type: "error" });
            }
        }
    };

    const removeSection = async (frontendId: string) => {
        const section = sections.find(s => s._frontendId === frontendId);
        if (!section) return;
        if (section.id) {
            try {
                await api.delete(`/admin/sections/${section.id}`);
            } catch (error: any) {
                toast({ title: "Error", description: "Failed to delete section.", type: "error" });
                return;
            }
        }
        setSections(prev => prev.filter(s => s._frontendId !== frontendId));
    };

    const addSection = (navItemId: number) => {
        const displaySections = sections.filter(s => s.navigation_item_id === navItemId);
        const newOrder = displaySections.length > 0 ? Math.max(...displaySections.map(s => s.order)) + 1 : 1;
        setSections([...sections, { 
            _frontendId: Math.random().toString(36).substring(7),
            navigation_item_id: navItemId,
            section_name: `hero`, 
            data_source: 'static',
            title: "New Section", 
            content: "", 
            order: newOrder, 
            is_visible: true 
        }]);
    };

    const handleMediaUpload = (frontendId: string, key: string, file: File) => {
        // Validation: Images max 5MB, Videos max 10MB
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        
        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: `${isVideo ? 'Video' : 'Image'} must be smaller than ${isVideo ? '10MB' : '5MB'}.`,
                type: "error"
            });
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setSections(prev => prev.map(section => {
            if (section._frontendId === frontendId) {
                return {
                    ...section,
                    pendingFiles: { ...(section.pendingFiles || {}), [key]: file },
                    previewUrls: { ...(section.previewUrls || {}), [key]: localUrl }
                };
            }
            return section;
        }));
    };

    const handleMediaDelete = async (frontendId: string, key: string) => {
        const section = sections.find(s => s._frontendId === frontendId);
        if (!section) return;

        if (section.pendingFiles?.[key]) {
            setSections(prev => prev.map(s => {
                if (s._frontendId === frontendId) {
                    const pFiles = { ...s.pendingFiles };
                    delete pFiles[key];
                    const pUrls = { ...s.previewUrls };
                    delete pUrls[key];
                    return { ...s, pendingFiles: pFiles, previewUrls: pUrls };
                }
                return s;
            }));
            return;
        }

        if (!section.id) return;

        try {
            await api.delete(`/admin/sections/${section.id}/contents/media/${key}`);
            toast({ title: "Success", description: "Media deleted successfully.", type: "success" });
            
            setSections(prev => prev.map(s => {
                if (s._frontendId === frontendId) {
                    const newMediaUrls = { ...s.media_urls };
                    delete newMediaUrls[`${key}_url`];
                    return { ...s, media_urls: newMediaUrls };
                }
                return s;
            }));
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
        // We only move if the index is actually different to avoid rapid flickering
        setNavItems(prev => {
            const updated = [...prev];
            const item = updated[draggedIndex];
            updated.splice(draggedIndex, 1);
            updated.splice(index, 0, item);
            return updated;
        });
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

    const handleSectionDragStart = (frontendId: string) => {
        setDraggedSectionId(frontendId);
    };

    const handleSectionDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedSectionId || draggedSectionId === targetId) return;
        
        const filtered = sections.filter(s => s.navigation_item_id === selectedNavItemId);
        const dragIndex = filtered.findIndex(s => s._frontendId === draggedSectionId);
        const dropIndex = filtered.findIndex(s => s._frontendId === targetId);
        
        if (dragIndex === -1 || dropIndex === -1) return;
        
        const item = filtered[dragIndex];
        filtered.splice(dragIndex, 1);
        filtered.splice(dropIndex, 0, item);
        
        setSections(prev => {
            const others = prev.filter(s => s.navigation_item_id !== selectedNavItemId);
            return [...others, ...filtered];
        });
    };

    const handleSectionDrop = () => {
        setSections(prev => {
            const filtered = prev.filter(s => s.navigation_item_id === selectedNavItemId);
            const others = prev.filter(s => s.navigation_item_id !== selectedNavItemId);
            const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
            return [...others, ...reordered];
        });
        setDraggedSectionId(null);
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                        <div key={item._frontendId} className="space-y-2">
                                            <div 
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
                                                    className="h-6 w-6"
                                                    onClick={() => setExpandedNavIndex(expandedNavIndex === index ? null : index)}
                                                    title="SEO Settings"
                                                >
                                                    <ChevronDown className={cn("transition-transform duration-200", expandedNavIndex === index ? "rotate-180" : "")} size={14} />
                                                </Button>
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
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="ml-2 h-8 w-8"
                                                    title="Manage Page Content"
                                                    onClick={() => {
                                                        if (!item.id) {
                                                            toast({ title: "Save Required", description: "Please save the navigation menu first to edit its page content.", type: "warning" });
                                                            return;
                                                        }
                                                        setSelectedNavItemId(item.id);
                                                        setActiveTab('sections');
                                                    }}
                                                >
                                                    <Layout size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {expandedNavIndex === index && (
                                            <div className="bg-muted/30 p-4 rounded-lg border border-border mt-[-8px] mb-4 space-y-4">
                                                <h4 className="text-sm font-semibold border-b pb-2">SEO & Social Sharing</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Meta Title</Label>
                                                        <Input value={item.seo?.meta_title || ""} onChange={(e) => updateNavSeo(index, 'meta_title', e.target.value)} placeholder="Max 60 chars" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">OG Title</Label>
                                                        <Input value={item.seo?.og_title || ""} onChange={(e) => updateNavSeo(index, 'og_title', e.target.value)} placeholder="Title for social preview" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Meta Description</Label>
                                                        <Textarea className="h-20" value={item.seo?.meta_description || ""} onChange={(e) => updateNavSeo(index, 'meta_description', e.target.value)} placeholder="Max 160 chars" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">OG Description</Label>
                                                        <Textarea className="h-20" value={item.seo?.og_description || ""} onChange={(e) => updateNavSeo(index, 'og_description', e.target.value)} placeholder="Desc for social preview" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Meta Keywords</Label>
                                                        <Input value={item.seo?.meta_keywords || ""} onChange={(e) => updateNavSeo(index, 'meta_keywords', e.target.value)} placeholder="e.g. hotel, luxury, rooms" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Canonical URL</Label>
                                                        <Input value={item.seo?.canonical_url || ""} onChange={(e) => updateNavSeo(index, 'canonical_url', e.target.value)} placeholder="https://..." />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">OG Image (1200x627px recommended)</Label>
                                                    <div className="flex items-center gap-4">
                                                        {(item.previewOgImage || item.seo?.og_image) ? (
                                                            <div className="relative group w-32 h-20 rounded border overflow-hidden">
                                                                <img src={item.previewOgImage || item.seo?.og_image || ""} alt="OG Preview" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleNavOgDelete(index)}>
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                                                <Plus size={20} className="text-muted-foreground mb-1" />
                                                                <span className="text-xs text-muted-foreground">Upload</span>
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) handleNavOgUpload(index, e.target.files[0]);
                                                                }} />
                                                            </label>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Indexable by Search Engines?</Label>
                                                            <Button variant={item.seo?.is_indexable !== false ? "default" : "outline"} size="icon" className="h-6 w-6" onClick={() => updateNavSeo(index, 'is_indexable', item.seo?.is_indexable === false)}>
                                                                {item.seo?.is_indexable !== false ? <Check size={12} /> : <X size={12} />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                    {!selectedNavItemId ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center min-h-[300px] py-10">
                                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-xl font-bold">Select a Navigation Link</h3>
                                <p className="text-muted-foreground text-sm text-center max-w-md mt-2">
                                    Page content is organized by Navigation Links. Please go to the Navigation Menu tab, select a link, and click &quot;Page Content&quot; to manage its sections.
                                </p>
                                <Button className="mt-6" variant="default" onClick={() => setActiveTab('navigation')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Navigation Menu
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setActiveTab('navigation')}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <CardTitle>Page Content</CardTitle>
                                    </div>
                                    <CardDescription className="ml-10">
                                        Managing sections for: <span className="font-bold text-foreground underline decoration-primary/30 underline-offset-4">{navItems.find(n => n.id === selectedNavItemId)?.label || "Selected Page"}</span> 
                                        <span className="text-muted-foreground ml-2">(slug: /{navItems.find(n => n.id === selectedNavItemId)?.url?.replace(/^\//, '') || "home"})</span>
                                    </CardDescription>
                                </div>
                                <Button size="sm" onClick={() => addSection(selectedNavItemId)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Section
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {sections.filter(s => s.navigation_item_id === selectedNavItemId).map((section, index) => (
                                    <div 
                                        key={section._frontendId} 
                                        draggable
                                        onDragStart={() => handleSectionDragStart(section._frontendId)}
                                        onDragOver={(e) => handleSectionDragOver(e, section._frontendId)}
                                        onDrop={handleSectionDrop}
                                        className={cn(
                                            "space-y-4 p-4 rounded-xl border border-border bg-muted/30 transition-all duration-200",
                                            draggedSectionId === section._frontendId && "opacity-50 border-primary border-dashed scale-[0.98] rotate-1"
                                        )}
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                            <div className="flex flex-row items-center gap-2 whitespace-nowrap">
                                                <GripVertical
                                                    className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
                                                    size={16}
                                                />
                                                
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Section Type</Label>
                                                    <Select 
                                                        value={section.section_name} 
                                                        onValueChange={(val) => updateSection(section._frontendId, 'section_name', val)}
                                                    >
                                                        <SelectTrigger className="w-48 h-8 text-sm bg-transparent border-dashed shrink-0">
                                                            <SelectValue placeholder="Pick Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="hero">Hero Header (Large)</SelectItem>
                                                            <SelectItem value="experience">Experience / About Us</SelectItem>
                                                            <SelectItem value="featured_rooms">Rooms Showcase</SelectItem>
                                                            <SelectItem value="dining">Dining / Menu</SelectItem>
                                                            <SelectItem value="testimonials">Testimonials Bar</SelectItem>
                                                            <SelectItem value="booking_banner">Booking / CTA Banner</SelectItem>
                                                            <SelectItem value="gallery">Photo Gallery</SelectItem>
                                                            <SelectItem value="standard">Standard Content (Generic)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Data Source</Label>
                                                    <Select 
                                                        value={section.data_source} 
                                                        onValueChange={(val) => {
                                                            updateSection(section._frontendId, 'data_source', val);
                                                            if (val === 'rooms') {
                                                                updateSection(section._frontendId, 'section_name', 'featured_rooms');
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-32 h-8 text-sm bg-transparent border-dashed shrink-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="static">Static Text/Media</SelectItem>
                                                            <SelectItem value="rooms">Dynamic: Rooms</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                            <span className="text-xs text-muted-foreground shrink-0 mt-4">
                                                Order: {section.order}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs mr-1">Visible</Label>
                                            <Button 
                                                variant={section.is_visible ? "default" : "outline"} 
                                                size="icon" 
                                                className="h-7 w-7"
                                                onClick={() => toggleSectionVisibility(section._frontendId)}
                                            >
                                                {section.is_visible ? <Check size={12} /> : <X size={12} />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeSection(section._frontendId)}
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
                                                onChange={(e) => updateSection(section._frontendId, 'title', e.target.value)}
                                                placeholder={`Enter title for ${section.section_name} section`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Sub-title</Label>
                                            <Input 
                                                value={section.sub_title || ""} 
                                                onChange={(e) => updateSection(section._frontendId, 'sub_title', e.target.value)}
                                                placeholder={`Enter sub-title for ${section.section_name} section`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Section Content / Description</Label>
                                            <Textarea 
                                                rows={4}
                                                value={section.content || ""} 
                                                onChange={(e) => updateSection(section._frontendId, 'content', e.target.value)}
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
                                                                            onClick={() => handleMediaDelete(section._frontendId, key)}
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
                                                                                handleMediaUpload(section._frontendId, key, e.target.files[0]);
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
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
