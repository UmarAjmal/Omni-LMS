"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

interface Submission {
  assignment_id: number;
  task_name: string;
  course_label: string;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  email: string;
  avatar_url: string | null;
  status: "completed" | "marked";
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  submitted_at: string | null;
  github_url: string | null;
  live_url: string | null;
  submission_desc: string | null;
  submission_notes: string | null;
  due_date: string | null;
  image_urls?: string[];
  additional_links?: { title: string; url: string }[];
}

export default function SubmittedTasksPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filtered, setFiltered] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "marked">("all");

  // Review Modal State
  const [activeReview, setActiveReview] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const handleOpenReview = (sub: Submission) => {
    setActiveReview(sub);
    setGradeScore(sub.score ? String(sub.score) : "");
    setGradeFeedback(sub.feedback || "");
  };

  const closeReview = () => {
    setActiveReview(null);
    setGradeScore("");
    setGradeFeedback("");
  };

  const submitGrade = async () => {
    if (!activeReview) return;
    const scoreNum = Number(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Please enter a valid score (0-100).");
      return;
    }
    setIsGrading(true);
    try {
      const res = await apiClient(`/api/tasks/assignments/${activeReview.assignment_id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scoreNum,
          feedback: gradeFeedback,
          grade: scoreNum >= 80 ? "A" : scoreNum >= 70 ? "B" : scoreNum >= 60 ? "C" : "F",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to submit grade.");
      } else {
        toast.success("✅ Evaluation saved successfully!");
        closeReview();
        fetchSubmissions();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsGrading(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/tasks/submitted`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data || []);
        setFiltered(json.data || []);
      }
    } catch {
      toast.error("Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchSubmissions();
  }, [fetchSubmissions, router]);

  useEffect(() => {
    let data = [...submissions];
    if (statusFilter !== "all") data = data.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.task_name.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [search, statusFilter, submissions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Submitted Tasks" 
        description="Review student submissions and provide feedback" 
        icon="inbox"
      />

      {/* Filters */}
      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400 text-[20px]">search</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student or task…"
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              {(["all", "completed", "marked"] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "primary" : "outline"}
                  onClick={() => setStatusFilter(s)}
                  className="uppercase tracking-wider text-xs whitespace-nowrap"
                >
                  {s === "all" ? "All" : s === "completed" ? "Pending" : "Reviewed"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", count: submissions.length, color: "text-gray-900" },
          { label: "Pending Review", count: submissions.filter(s => s.status === "completed").length, color: "text-amber-600" },
          { label: "Reviewed", count: submissions.filter(s => s.status === "marked").length, color: "text-emerald-600" },
        ].map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black ${item.color}`}>{item.count}</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1 font-bold">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">inbox</span>
            </div>
            <p className="text-gray-500 font-medium">No submissions found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <span>Student</span>
            <span>Task</span>
            <span>Course</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((sub) => (
              <div key={sub.assignment_id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-5 hover:bg-blue-50/30 transition-colors items-center group">
                {/* Student */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden shadow-sm">
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <span className="text-gray-500 font-bold text-lg">{(sub.first_name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{sub.first_name} {sub.last_name}</p>
                    <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">{sub.enrollment_id || sub.email}</p>
                  </div>
                </div>
                {/* Task */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{sub.task_name}</p>
                  {sub.github_url && (
                    <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 mt-1 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      GitHub
                    </a>
                  )}
                </div>
                {/* Course */}
                <span className="text-xs font-medium text-gray-600">{sub.course_label || "—"}</span>
                {/* Submitted */}
                <span className="text-xs font-medium text-gray-500">
                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "—"}
                </span>
                {/* Status */}
                <div>
                  <Badge variant={sub.status === "marked" ? "success" : "warning"} className="uppercase tracking-wider text-[10px]">
                    {sub.status === "marked" ? "Reviewed" : "Pending Review"}
                  </Badge>
                </div>
                {/* Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReview(sub)}
                >
                  <span className="material-symbols-outlined mr-2 text-[16px]">rate_review</span>
                  {sub.status === "marked" ? "Re-review" : "Review"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inline Review Modal Overlay */}
      {activeReview && (
        <Dialog open={!!activeReview} onOpenChange={(open) => !open && closeReview()}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            
            {/* Modal Header */}
            <DialogHeader className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <DialogTitle className="text-lg">Review Submission: {activeReview.task_name}</DialogTitle>
              <DialogDescription>
                Student: <span className="font-bold text-gray-700">{activeReview.first_name} {activeReview.last_name}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              {/* Submission Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Student Notes</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                  {activeReview.submission_desc || "No description provided."}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Links</h4>
                <div className="flex flex-wrap gap-3">
                  {activeReview.github_url && (
                    <a href={activeReview.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm text-sm font-semibold text-gray-700 transition-all group">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-blue-500">code</span>
                      GitHub Repo
                    </a>
                  )}
                  {activeReview.live_url && (
                    <a href={activeReview.live_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-sm font-semibold text-blue-700 transition-all">
                      <span className="material-symbols-outlined text-[18px]">public</span>
                      Live Preview
                    </a>
                  )}
                  {activeReview.additional_links?.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm text-sm font-semibold text-gray-700 transition-all group">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-blue-500">link</span>
                      {link.title}
                    </a>
                  ))}
                  {(!activeReview.github_url && !activeReview.live_url && (!activeReview.additional_links || activeReview.additional_links.length === 0)) && (
                    <span className="text-gray-500 text-sm font-medium bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">No links provided.</span>
                  )}
                </div>
              </div>

              {/* Screenshots */}
              {activeReview.image_urls && activeReview.image_urls.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Screenshots</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activeReview.image_urls.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="block aspect-video rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all">
                        <img src={img} alt="Screenshot" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />

              {/* Grading Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  Evaluation & Grading
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                  {/* Score */}
                  <div className="col-span-1">
                    <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Score (0-100)<span className="text-red-500 ml-1">*</span></Label>
                    <Input 
                      type="number"
                      min="0" max="100"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      placeholder="e.g. 95"
                      className="text-xl font-bold h-14"
                    />
                  </div>
                  
                  {/* Feedback */}
                  <div className="col-span-1 md:col-span-3">
                    <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Feedback Notes</Label>
                    <textarea 
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Great job on the UI. The responsive design looks solid..."
                      rows={3}
                      className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 sm:justify-end gap-3">
              <Button 
                variant="outline"
                onClick={closeReview}
                disabled={isGrading}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitGrade}
                disabled={isGrading}
                isLoading={isGrading}
              >
                {!isGrading && <span className="material-symbols-outlined mr-2">publish</span>}
                Save Evaluation
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
