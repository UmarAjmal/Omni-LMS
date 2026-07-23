"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface Campaign {
  id: number;
  title: string;
  description: string;
  platforms: string[];
  priority: string;
  status: string;
  deadline: string;
}

export default function StudentCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyCampaigns();
  }, []);

  const fetchMyCampaigns = async () => {
    try {
      // First get student ID
      const infoStr = localStorage.getItem("lms_student_info");
      let studentId = null;
      if (infoStr && infoStr !== "undefined" && infoStr !== "null") {
        const studentObj = JSON.parse(infoStr);
        studentId = studentObj.id;
      }
      
      if (!studentId) {
        toast.error("Could not find student profile");
        setIsLoading(false);
        return;
      }
      
      const res = await apiClient(`/api/student/${studentId}/campaigns`);
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Error fetching campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityVariant = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="My Assigned Campaigns" 
        description="Select a campaign to view details and start hunting leads." 
        icon="radar"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 bg-gray-50/50">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
                <span className="material-symbols-outlined text-[32px]">radar</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Campaigns</h3>
              <p className="text-gray-500">You have no active campaigns assigned at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map(camp => (
            <Link 
              key={camp.id} 
              href={`/student/campaigns/${camp.id}`}
              className="block outline-none"
            >
              <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer flex flex-col relative overflow-hidden">
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <Badge variant={getPriorityVariant(camp.priority) as any} className="uppercase tracking-wider text-[10px]">
                      {camp.priority || 'Normal'}
                    </Badge>
                    {camp.status === 'active' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{camp.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{camp.description || "No description provided."}</p>
                  
                  <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      {new Date(camp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                      Start Hunting <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
