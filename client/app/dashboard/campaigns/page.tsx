"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Campaign {
  id: number;
  title: string;
  description: string;
  platforms: string[];
  priority: string;
  status: string;
  start_date: string;
  deadline: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await apiClient("/api/campaigns");
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      } else {
        toast.error(json.error || "Failed to fetch campaigns");
      }
    } catch {
      toast.error("An error occurred while fetching campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityVariant = (p?: string | null): "primary" | "danger" | "warning" | "success" | "secondary" => {
    if (!p) return "secondary";
    switch (p.toLowerCase()) {
      case 'urgent': return "danger";
      case 'high': return "warning";
      case 'medium': return "primary"; // blueish
      case 'low': return "secondary";
      default: return "secondary";
    }
  };

  const getStatusVariant = (s?: string | null): "primary" | "danger" | "warning" | "success" | "secondary" => {
    if (!s) return "secondary";
    switch (s.toLowerCase()) {
      case 'active': return "success";
      case 'completed': return "primary";
      case 'expired': return "danger";
      case 'draft': return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Lead Campaigns" 
          description="Manage business development campaigns and target leads." 
        />
        <Link href="/dashboard/campaigns/create">
          <Button>
            <span className="material-symbols-outlined mr-2">add</span>
            Create Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
            <span className="material-symbols-outlined text-[32px]">radar</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Campaigns Found</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md">Get started by creating your first business development or lead generation campaign.</p>
          <Link href="/dashboard/campaigns/create">
            <Button variant="outline">Create First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {campaigns.map((camp) => (
            <Link 
              key={camp.id} 
              href={`/dashboard/campaigns/${camp.id}`}
              className="block group h-full"
            >
              <Card className="h-full hover:border-gray-300 hover:shadow-md transition-all">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={getStatusVariant(camp.status)} className="uppercase text-[10px] tracking-wider">
                      {camp.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(camp.priority)} className="uppercase text-[10px] tracking-wider">
                      {camp.priority}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {camp.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {camp.description || "No description provided."}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {(camp.platforms || []).slice(0, 3).map((p: string) => (
                      <span key={p} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                        {p}
                      </span>
                    ))}
                    {(camp.platforms || []).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                        +{camp.platforms.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      {new Date(camp.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                      View Details
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
