"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";


interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  role: string;
  created_at: string;
}

export default function TrainerAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [authorName, setAuthorName] = useState("Trainer");
  const [authorId, setAuthorId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/announcements`);
      const json = await res.json();
      if (json.success) setAnnouncements(json.data || []);
    } catch {
      toast.error("Failed to load announcements.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    const uid = localStorage.getItem("lms_user_id");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    setAuthorId(uid);
    // Try to get trainer name
    if (uid) {
      apiClient(`/api/trainers/profile?userId=${uid}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) setAuthorName(`${res.data.first_name} ${res.data.last_name}`);
        }).catch(() => {});
    }
    fetchAnnouncements();
  }, [fetchAnnouncements, router]);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setIsPosting(true);
    try {
      const res = await apiClient(`/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorId, authorName, role: "trainer", target: "all", sendEmail }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Announcement published! Students have been notified.");
        setTitle("");
        setContent("");
        setSendEmail(false);
        setShowForm(false);
        fetchAnnouncements();
      } else {
        toast.error(json.error || "Failed to publish.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await apiClient(`/api/announcements/${id}`, { method: "DELETE" });
      toast.success("Announcement deleted.");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader 
          title="Announcements" 
          description="Publish updates to all students instantly" 
          icon="campaign"
        />
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "primary"}
        >
          <span className="material-symbols-outlined mr-2">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "New Announcement"}
        </Button>
      </div>

      {/* Compose form */}
      {showForm && (
        <Card className="border-blue-200 shadow-md">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">edit_square</span>
            <h2 className="text-base font-bold text-blue-900">Compose Announcement</h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Title <span className="text-red-500">*</span></Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Session rescheduled to 3 PM"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Message <span className="text-red-500">*</span></Label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Write your announcement here…"
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <button
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`w-11 h-6 rounded-full border transition-all flex items-center shrink-0 ${sendEmail ? "bg-blue-600 border-blue-600 justify-end pr-0.5" : "bg-gray-200 border-gray-300 justify-start pl-0.5"}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
                <span className="text-sm font-medium text-gray-700">Also send email notification to all students</span>
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  onClick={handlePost}
                  disabled={isPosting}
                  isLoading={isPosting}
                >
                  {!isPosting && <span className="material-symbols-outlined mr-2">campaign</span>}
                  Publish Announcement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">campaign</span>
            </div>
            <p className="text-gray-500 font-medium mb-4">No announcements yet</p>
            {!showForm && (
              <Button variant="outline" onClick={() => setShowForm(true)}>
                Post your first announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann) => (
            <Card key={ann.id} className="hover:-translate-y-1 hover:shadow-md transition-all group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={ann.role === "admin" ? "warning" : "secondary"} className="uppercase tracking-wider text-[10px]">
                        {ann.role}
                      </Badge>
                      <span className="text-xs font-medium text-gray-500">{new Date(ann.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ann.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-2">{ann.content}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-500">{ann.author_name[0]}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-500">{ann.author_name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ann.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
