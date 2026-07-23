"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  role: string;
  created_at: string;
}

export default function StudentAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/announcements`);
      const json = await res.json();
      if (json.success) setAnnouncements(json.data || []);
    } catch { toast.error("Failed to load announcements."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("lms_auth");
    if (!auth) { router.push("/"); return; }
    fetchAnnouncements();
  }, [fetchAnnouncements, router]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Announcements" 
        description="Latest updates from your trainers and admin"
      />

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-300 text-4xl">campaign</span>
            </div>
            <p className="text-gray-900 font-bold text-lg mb-1">No announcements yet</p>
            <p className="text-gray-500 text-sm">Check back later for updates from your trainers</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann, idx) => (
            <Card
              key={ann.id}
              className={`transition-all ${
                idx === 0 ? "border-blue-200 shadow-md" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ann.role === "admin" ? "bg-blue-50" : "bg-indigo-50"}`}>
                    <span
                      className={`material-symbols-outlined text-[24px] ${ann.role === "admin" ? "text-blue-600" : "text-indigo-600"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {ann.role === "admin" ? "admin_panel_settings" : "school"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {idx === 0 && (
                        <Badge variant="primary">Latest</Badge>
                      )}
                      <Badge variant={ann.role === "admin" ? "primary" : "secondary"}>
                        {ann.role === "admin" ? "Admin" : "Trainer"}
                      </Badge>
                      <span className="text-xs font-bold text-gray-400">
                        {new Date(ann.created_at).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{ann.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    <p className="text-xs font-bold text-gray-400 mt-4">— {ann.author_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
