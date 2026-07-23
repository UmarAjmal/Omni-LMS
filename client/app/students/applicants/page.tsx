"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";

const TRACK_LABELS: Record<string, string> = {
  "fullstack-ai": "Full Stack AI Engineer",
  "devops": "DevOps",
  "app-dev": "App Development",
  "web-dev": "Web Development",
};

const TRACK_ICONS: Record<string, string> = {
  "fullstack-ai": "smart_toy",
  "devops": "cloud_sync",
  "app-dev": "phone_android",
  "web-dev": "code",
};

interface TrainingApplication {
  id: string;
  full_name: string;
  father_name: string;
  cnic: string;
  age: number;
  whatsapp: string;
  gmail: string;
  university_name: string;
  department: string;
  semester: number;
  tracks: string[];
  reference_code: string | null;
  status: string;
  created_at: string;
}

function ApproveWithNoteModal({
  applicant,
  onClose,
  onConfirm,
}: {
  applicant: TrainingApplication;
  onClose: () => void;
  onConfirm: (note: string, totalFee: number) => void;
}) {
  const [note, setNote] = useState("");
  const [totalFee, setTotalFee] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm(note, Number(totalFee) || 0);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Approve with Note</h3>
              <p className="text-sm text-gray-500 mt-1">For: <span className="font-semibold text-gray-700">{applicant.full_name}</span></p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <Label>Total Course Fee (Rs.)</Label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Approval Note (Optional)</Label>
              <textarea
                placeholder="e.g. Please bring your original documents on Day 1..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all resize-y text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              <span className="material-symbols-outlined mr-2 text-[18px]">send</span>
              Approve & Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicantCard({
  applicant,
  onApprove,
  onApproveWithNote,
  onReject,
}: {
  applicant: TrainingApplication;
  onApprove: (id: string) => void;
  onApproveWithNote: (app: TrainingApplication) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    await onApprove(applicant.id);
    setActionLoading(null);
  };

  const handleReject = async () => {
    setActionLoading("reject");
    await onReject(applicant.id);
    setActionLoading(null);
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${expanded ? 'ring-2 ring-gray-900 shadow-md' : 'hover:border-gray-300'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-gray-400 text-3xl">person</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{applicant.full_name}</h3>
                <Badge variant="warning">Pending</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {applicant.university_name} · {applicant.department} · Sem {applicant.semester}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {applicant.tracks.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                    <span className="material-symbols-outlined text-[14px]">{TRACK_ICONS[t] || "code"}</span>
                    {TRACK_LABELS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-4 shrink-0">
            <span className="text-xs font-medium text-gray-400">{timeAgo(applicant.created_at)}</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className={`material-symbols-outlined transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Father's Name", value: applicant.father_name, icon: "family_restroom" },
                { label: "CNIC", value: applicant.cnic, icon: "badge" },
                { label: "Age", value: `${applicant.age} years`, icon: "cake" },
                { label: "WhatsApp", value: applicant.whatsapp, icon: "smartphone" },
                { label: "Gmail", value: applicant.gmail, icon: "mail" },
                { label: "Reference Code", value: applicant.reference_code || "None", icon: "confirmation_number" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={!!actionLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {actionLoading === "reject" ? (
                  <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined mr-2 text-[18px]">cancel</span>
                )}
                Reject
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onApproveWithNote(applicant)}
                disabled={!!actionLoading}
              >
                <span className="material-symbols-outlined mr-2 text-[18px]">edit_note</span>
                Approve with Note
              </Button>

              <Button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading === "approve" ? (
                  <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined mr-2 text-[18px]">check_circle</span>
                )}
                Approve
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrainingApplicantsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteModalApp, setNoteModalApp] = useState<TrainingApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await apiClient(`/api/training-applications`);
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch (err) {
      console.error("Failed to fetch training applications:", err);
      toast.error("Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const handleApprove = async (id: string, note?: string, totalFee?: number) => {
    try {
      const res = await apiClient(`/api/training-applications/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || "", totalFee: totalFee || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application approved! Confirmation email sent.");
        setApplications((prev) => prev.filter((a) => a.id !== id));
        setNoteModalApp(null);
      } else {
        toast.error("Failed to approve: " + data.error);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await apiClient(`/api/training-applications/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Application rejected. Rejection email sent.");
        setApplications((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to reject: " + data.error);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/students")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Students
          </button>
          <PageHeader 
            title="Training Applications" 
            description="Review FalconSwift Training & Internship applications — approve or reject with email notification." 
          />
        </div>
        <Card className="shrink-0 mt-8 md:mt-0">
          <CardContent className="px-6 py-4 flex items-center gap-4">
            <span className="text-4xl font-bold tracking-tight">{applications.length}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending<br />Reviews
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-sm">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <span className="material-symbols-outlined text-[32px]">inbox</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Pending Applications</h3>
            <p className="text-gray-500 text-sm">All caught up! New applications will appear here automatically.</p>
          </div>
        ) : (
          applications.map((app) => (
            <ApplicantCard
              key={app.id}
              applicant={app}
              onApprove={handleApprove}
              onApproveWithNote={setNoteModalApp}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {noteModalApp && (
        <ApproveWithNoteModal
          applicant={noteModalApp}
          onClose={() => setNoteModalApp(null)}
          onConfirm={(note, fee) => handleApprove(noteModalApp.id, note, fee)}
        />
      )}
    </div>
  );
}