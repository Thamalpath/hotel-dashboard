"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Loader2, Building2, Phone, Globe, Layout, User as UserIcon, Mail } from "lucide-react";

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

export default function LayoutManagementPage() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const router = useRouter();

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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Layout Management</h1>
          <p className="text-muted-foreground text-sm">Manage website layouts for hotel merchants.</p>
        </div>
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
    </div>
  );
}