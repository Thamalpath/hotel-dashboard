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
    fields?: Record<string, string>;
};

const SECTION_TEMPLATES: Record<string, { label: string, fields: { key: string, label: string, type: 'text' | 'textarea' }[], media: string[] }> = {
    hero: {
        label: 'Hero Header (Large)',
        fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
            { key: 'button_text', label: 'Button Text', type: 'text' },
            { key: 'button_link', label: 'Button Link', type: 'text' },
        ],
        media: ['banner', 'background']
    },
    experience: {
        label: 'Experience / About Us',
        fields: [
            { key: 'title', label: 'Section Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
            { key: 'content', label: 'Detailed Content', type: 'textarea' },
        ],
        media: ['image', 'video']
    },
    featured_rooms: {
        label: 'Rooms Showcase',
        fields: [
            { key: 'title', label: 'Section Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
        ],
        media: []
    },
    dining: {
        label: 'Dining / Menu',
        fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
            { key: 'content', label: 'Description', type: 'textarea' },
            { key: 'menu_link', label: 'Menu PDF Link', type: 'text' },
        ],
        media: ['image']
    },
    testimonials: {
        label: 'Testimonials Bar',
        fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
        ],
        media: []
    },
    booking_banner: {
        label: 'Booking / CTA Banner',
        fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
            { key: 'button_text', label: 'Button Text', type: 'text' },
            { key: 'button_link', label: 'Button Link', type: 'text' },
        ],
        media: ['background']
    },
    gallery: {
        label: 'Photo Gallery',
        fields: [
            { key: 'title', label: 'Gallery Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
        ],
        media: ['image']
    },
    standard: {
        label: 'Standard Content (Generic)',
        fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'sub_title', label: 'Sub-title', type: 'text' },
            { key: 'content', label: 'Content', type: 'textarea' },
        ],
        media: ['image', 'background']
    }
};

const ALL_AVAILABLE_FIELDS = [
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'sub_title', label: 'Sub-title', type: 'text' },
    { key: 'content', label: 'Detailed Content', type: 'textarea' },
    { key: 'button_text', label: 'Button Text', type: 'text' },
    { key: 'button_link', label: 'Button Link', type: 'text' },
    { key: 'menu_link', label: 'Menu PDF Link', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' }
] as const;

const ALL_AVAILABLE_MEDIA = ['image', 'banner', 'video', 'background', 'poster'];

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
    const [customizingSectionId, setCustomizingSectionId] = useState<string | null>(null);

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
                                fields: contentMap,
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
                        ...(section.fields || {}),
                        // Fallbacks just in case
                        title: section.title || section.fields?.title || "",
                        sub_title: section.sub_title || section.fields?.sub_title || "",
                        content: section.content || section.fields?.content || ""
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

    const updateSectionField = (frontendId: string, fieldKey: string, value: any) => {
        setSections(prev => prev.map(s => {
            if (s._frontendId === frontendId) {
                return {
                    ...s,
                    fields: { ...(s.fields || {}), [fieldKey]: value }
                };
            }
            return s;
        }));
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
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs">Meta Title</Label>
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-[10px] font-medium transition-colors",
                                                                    (item.seo?.meta_title?.length || 0) > 60 ? "text-red-500" :
                                                                    (item.seo?.meta_title?.length || 0) > 50 ? "text-amber-500" :
                                                                    (item.seo?.meta_title?.length || 0) > 0 ? "text-emerald-500" :
                                                                    "text-muted-foreground"
                                                                )}>
                                                                    {item.seo?.meta_title?.length || 0} / 60
                                                                </span>
                                                                <div className="flex gap-0.5 h-1.5 w-12 rounded-full overflow-hidden bg-muted">
                                                                    <div className={cn(
                                                                        "h-full transition-all duration-300",
                                                                        (item.seo?.meta_title?.length || 0) > 60 ? "bg-red-500 w-full" :
                                                                        (item.seo?.meta_title?.length || 0) > 50 ? "bg-amber-500 w-[85%]" :
                                                                        (item.seo?.meta_title?.length || 0) > 0 ? "bg-emerald-500 w-[50%]" :
                                                                        "bg-transparent w-0"
                                                                    )} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Input 
                                                            value={item.seo?.meta_title || ""} 
                                                            onChange={(e) => updateNavSeo(index, 'meta_title', e.target.value)} 
                                                            placeholder="Max 60 chars" 
                                                            className={cn(
                                                                (item.seo?.meta_title?.length || 0) > 60 && "border-red-500/50 focus-visible:ring-red-500"
                                                            )}
                                                        />
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
                                                        onValueChange={(val) => {
                                                            const newTemplate = SECTION_TEMPLATES[val] || SECTION_TEMPLATES.standard;
                                                            // Wipe custom settings when changing types to load new defaults
                                                            setSections(prev => prev.map(s => {
                                                                if (s._frontendId === section._frontendId) {
                                                                    const newSettings = { ...(s.settings || {}) };
                                                                    delete newSettings.enabled_fields;
                                                                    delete newSettings.enabled_media;
                                                                    return { ...s, section_name: val, settings: newSettings };
                                                                }
                                                                return s;
                                                            }));
                                                        }}
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs px-2 mr-2"
                                                onClick={() => setCustomizingSectionId(customizingSectionId === section._frontendId ? null : section._frontendId)}
                                                disabled={section.data_source === 'rooms'}
                                            >
                                                <Settings size={12} className="mr-1" />
                                                {customizingSectionId === section._frontendId ? "Done" : "Customize Fields"}
                                            </Button>
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
                                    {(() => {
                                        const templateParams = SECTION_TEMPLATES[section.section_name] || SECTION_TEMPLATES.standard;
                                        const isDynamic = section.data_source === 'rooms';
                                        const isCustomizing = customizingSectionId === section._frontendId;
                                        
                                        const enabledTextFieldKeys: string[] = Array.isArray(section.settings?.enabled_fields) 
                                            ? section.settings!.enabled_fields 
                                            : templateParams.fields.map(f => f.key);
                                            
                                        const enabledMediaKeys: string[] = Array.isArray(section.settings?.enabled_media) 
                                            ? section.settings!.enabled_media 
                                            : templateParams.media;

                                        if (isCustomizing) {
                                            return (
                                                <div className="p-4 border border-primary/20 bg-primary/5 rounded-md mt-4 space-y-4">
                                                    <h4 className="font-semibold text-sm">Select Fields for this Section</h4>
                                                    <p className="text-xs text-muted-foreground">Check the specific text and media inputs you want to enable when filling out data for this section.</p>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Text Fields</h5>
                                                            <div className="space-y-2">
                                                                {ALL_AVAILABLE_FIELDS.map(f => (
                                                                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background p-1.5 rounded">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={enabledTextFieldKeys.includes(f.key)}
                                                                            onChange={(e) => {
                                                                                const newKeys = e.target.checked 
                                                                                    ? [...enabledTextFieldKeys, f.key] 
                                                                                    : enabledTextFieldKeys.filter(k => k !== f.key);
                                                                                updateSection(section._frontendId, 'settings', { ...(section.settings || {}), enabled_fields: newKeys, enabled_media: enabledMediaKeys });
                                                                            }}
                                                                        />
                                                                        {f.label}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Media Slots</h5>
                                                            <div className="space-y-2">
                                                                {ALL_AVAILABLE_MEDIA.map(m => (
                                                                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background p-1.5 rounded">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={enabledMediaKeys.includes(m)}
                                                                            onChange={(e) => {
                                                                                const newKeys = e.target.checked 
                                                                                    ? [...enabledMediaKeys, m] 
                                                                                    : enabledMediaKeys.filter(k => k !== m);
                                                                                updateSection(section._frontendId, 'settings', { ...(section.settings || {}), enabled_fields: enabledTextFieldKeys, enabled_media: newKeys });
                                                                            }}
                                                                        />
                                                                        <span className="capitalize">{m}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <Button size="sm" onClick={() => setCustomizingSectionId(null)}>Done Customizing</Button>
                                                </div>
                                            );
                                        }

                                        const activeTextFields = ALL_AVAILABLE_FIELDS.filter(f => enabledTextFieldKeys.includes(f.key));
                                        const activeMediaKeys = ALL_AVAILABLE_MEDIA.filter(m => enabledMediaKeys.includes(m));

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/50 mt-2">
                                                {/* Left Column: Text Fields */}
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                                        <FileText size={16} /> Content Fields
                                                    </h4>
                                                    
                                                    {isDynamic ? (
                                                        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center h-[200px]">
                                                            <Database className="h-8 w-8 text-primary/50 mb-2" />
                                                            <p className="font-semibold text-sm">Dynamic Data Source</p>
                                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                                                Data for this section is pulled automatically from your hotel's database (rooms, availability, etc.).
                                                            </p>
                                                        </div>
                                                    ) : activeTextFields.length === 0 ? (
                                                        <div className="p-4 text-xs text-muted-foreground italic bg-muted/20 rounded-md">
                                                            No text configuration needed for this section template.
                                                        </div>
                                                    ) : (
                                                        activeTextFields.map((field) => (
                                                            <div key={field.key} className="space-y-1">
                                                                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                                                                {field.type === 'textarea' ? (
                                                                    <Textarea 
                                                                        rows={4}
                                                                        value={section.fields?.[field.key] || section[field.key as keyof PageSection] as string || ""} 
                                                                        onChange={(e) => updateSectionField(section._frontendId, field.key, e.target.value)}
                                                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                        className="text-sm"
                                                                    />
                                                                ) : (
                                                                    <Input 
                                                                        value={section.fields?.[field.key] || section[field.key as keyof PageSection] as string || ""} 
                                                                        onChange={(e) => updateSectionField(section._frontendId, field.key, e.target.value)}
                                                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                        className="h-9 text-sm"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Right Column: Media Fields */}
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                                        <Settings size={16} /> Media configuration
                                                    </h4>
                                                    {activeMediaKeys.length === 0 ? (
                                                        <div className="p-4 text-xs text-muted-foreground italic bg-muted/20 rounded-md">
                                                            No media configuration supported for this section template.
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {activeMediaKeys.map((key) => {
                                                                const backendUrl = section.media_urls?.[`${key}_url`];
                                                                const pendingUrl = section.previewUrls?.[key];
                                                                const currentMediaUrl = pendingUrl || backendUrl || null;
                                                                
                                                                return (
                                                                    <div key={key} className="space-y-2 border border-border p-3 rounded-md relative flex flex-col items-center justify-center min-h-[120px] bg-card hover:border-primary/50 transition-colors">
                                                                        <div className="capitalize text-[10px] uppercase tracking-wider font-semibold text-muted-foreground w-full text-center mb-1">{key}</div>
                                                                        {currentMediaUrl ? (
                                                                            <div className="relative group w-full h-24 flex items-center justify-center overflow-hidden rounded border border-border">
                                                                                {key === 'video' ? (
                                                                                    <video src={currentMediaUrl} className="object-cover w-full h-full" muted loop playsInline />
                                                                                ) : (
                                                                                    <img src={currentMediaUrl} alt={key} className="object-cover w-full h-full" />
                                                                                )}
                                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
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
                                                                            <label className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-md hover:bg-muted/50 transition-colors border-2 border-dashed border-muted-foreground/20 w-full h-24">
                                                                                <Plus size={16} className="text-muted-foreground mb-1" />
                                                                                <span className="text-[10px] text-muted-foreground">Upload File</span>
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
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
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
