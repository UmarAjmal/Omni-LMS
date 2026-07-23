"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

// Uses relative /api/* paths → Next.js route handlers proxy to Express backend

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  role: string;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/announcements`);
      const json = await res.json();
      if (json.success) setAnnouncements(json.data || []);
      else toast.error(json.error || "Failed to load announcements.");
    } catch (err) {
      console.error("fetchAnnouncements error:", err);
      toast.error("Failed to load announcements.");
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchAnnouncements();
  }, [fetchAnnouncements, router]);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required."); return; }
    setIsPosting(true);
    try {
      const uid = localStorage.getItem("lms_user_id");
      const res = await apiClient(`/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorId: uid, authorName: "Admin", role: "admin", target: "all", sendEmail }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Announcement published!");
        setTitle(""); setContent(""); setSendEmail(false); setShowForm(false);
        fetchAnnouncements();
      } else toast.error(json.error || "Failed to publish.");
    } catch (err) {
      console.error("handlePost error:", err);
      toast.error("Network error.");
    }
    finally { setIsPosting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await apiClient(`/api/announcements/${id}`, { method: "DELETE" });
      toast.success("Deleted."); fetchAnnouncements();
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Announcements" 
          description="Broadcast updates to all students and trainers" 
          icon="campaign"
        />
        <Button 
          variant={showForm ? "outline" : "primary"} 
          onClick={() => setShowForm(!showForm)} 
          className="shrink-0 mt-8 md:mt-0"
        >
          <span className="material-symbols-outlined mr-2">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "New Announcement"}
        </Button>
      </div>

      {showForm && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Compose Announcement</h2>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Title <span className="text-red-500">*</span></Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. System Maintenance This Weekend" 
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Content <span className="text-red-500">*</span></Label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  rows={6} 
                  placeholder="Write your message here..." 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-y text-sm" 
                />
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center h-5">
                  <input 
                    id="sendEmail" 
                    type="checkbox" 
                    checked={sendEmail} 
                    onChange={(e) => setSendEmail(e.target.checked)} 
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500" 
                  />
                </div>
                <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Also send an email notification to all students
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handlePost} disabled={isPosting} isLoading={isPosting}>
                  {!isPosting && <span className="material-symbols-outlined mr-2">campaign</span>}
                  Publish Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-500">Loading announcements...</p>
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
              <span className="material-symbols-outlined text-[32px]">campaign</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Announcements</h3>
            <p className="text-sm text-gray-500 max-w-sm">Use the New Announcement button to broadcast a message to your users.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className="hover:border-blue-300 hover:shadow-sm transition-all group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={ann.role === "admin" ? "primary" : "secondary"} className="uppercase tracking-wider text-[10px]">
                        {ann.role}
                      </Badge>
                      <span className="text-xs font-medium text-gray-400">
                        {new Date(ann.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{ann.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                      </div>
                      <p className="text-xs font-medium text-gray-500">{ann.author_name}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(ann.id)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Announcement"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
