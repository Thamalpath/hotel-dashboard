"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  total_users: number;
  total_bookings: number;
  revenue: string;
  occupancy_rate: string;
};

export default function DashboardHome() {
  const { toast } = useToast();
  const fetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get("/admin/dashboard");
        setStats(response.data.data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (!fetched.current) {
      fetchStats();
      fetched.current = true;
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statItems = [
    { label: "Total Users", value: stats?.total_users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Bookings", value: stats?.total_bookings, icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Revenue", value: stats?.revenue, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Occupancy Rate", value: stats?.occupancy_rate, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-6 text-white shadow-2xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome to Hotel Web Management</h1>
          <p className="text-white/70 max-w-xl">Manage your hotel website operations from a single secure portal.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow group bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features/Quick Links placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic bg-muted/20 rounded-xl m-4 mt-0">
             Quick analytics view coming soon...
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border">
                <p className="text-sm font-medium">User Audit Logs</p>
                <p className="text-xs text-muted-foreground">View recent system access</p>
             </div>
             <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border">
                <p className="text-sm font-medium">Role Configuration</p>
                <p className="text-xs text-muted-foreground">Update permissions</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
