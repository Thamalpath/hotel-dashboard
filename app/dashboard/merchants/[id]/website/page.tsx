"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    content: string | null;
    order: number;
    is_visible: boolean;
};

export default function WebsiteManagementPage() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [merchant, setMerchant] = useState<any>(null);
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [sections, setSections] = useState<PageSection[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [merchRes, navRes, secRes] = await Promise.all([
                api.get(`/admin/merchants/${id}`),
                api.get(`/admin/merchants/${id}/navigation`),
                api.get(`/admin/merchants/${id}/sections`)
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
    }, [id, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveNavigation = async () => {
        try {
            setSaving(true);
            await api.post(`/admin/merchants/${id}/navigation`, { items: navItems });
            toast({ title: "Success", description: "Navigation updated successfully", type: "success" });
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
            await api.post(`/admin/merchants/${id}/sections`, { sections: sections });
            toast({ title: "Success", description: "Page sections updated successfully", type: "success" });
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

    const removeNavItem = (index: number) => {
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
                        <CardContent className="space-y-4">
                            {navItems.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No navigation items found. Click "Add Link" to start.
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
                                                    onClick={() => updateNavItem(index, 'is_active', !item.is_active)}
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
                        <CardHeader>
                            <CardTitle>Page Sections</CardTitle>
                            <CardDescription>Edit the titles and descriptions of the website sections.</CardDescription>
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
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing" size={16} />
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                {section.section_name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Order: {section.order}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs mr-1">Visible</Label>
                                            <Button 
                                                variant={section.is_visible ? "default" : "outline"} 
                                                size="icon" 
                                                className="h-7 w-7"
                                                onClick={() => updateSection(index, 'is_visible', !section.is_visible)}
                                            >
                                                {section.is_visible ? <Check size={12} /> : <X size={12} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input 
                                                value={section.title || ""} 
                                                onChange={(e) => updateSection(index, 'title', e.target.value)}
                                                placeholder={`Enter title for ${section.section_name} section`}
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
