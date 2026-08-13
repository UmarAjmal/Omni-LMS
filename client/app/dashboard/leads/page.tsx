"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

interface Lead {
  id: number;
  campaign_id: number;
  student_id: number;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  platform: string;
  lead_quality: number;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  campaign_title: string;
}

export default function LeadsReviewPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [points, setPoints] = useState(10);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await apiClient("/api/leads?status=pending");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient(`/api/leads/${selectedLead.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          feedback,
          points_awarded: reviewStatus === 'approved' ? points : 0
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted!");
        setSelectedLead(null);
        fetchLeads(); // refresh
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Lead Review Pipeline" 
        description="Review student submissions, provide feedback, and award points." 
      />

      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-gray-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
              <span className="material-symbols-outlined text-[32px]">fact_check</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Pending Leads</h3>
            <p className="text-sm text-gray-500 max-w-sm">There are currently no lead submissions waiting for your review.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business & Campaign</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-bold text-gray-900 mb-1 tracking-tight">{lead.business_name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{lead.platform}</Badge>
                      <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]" title={lead.campaign_title}>
                        {lead.campaign_title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <span className="font-semibold text-gray-900">{lead.first_name} {lead.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5 text-xs text-gray-600">
                      {lead.email && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span> 
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">call</span> 
                          {lead.phone}
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">language</span> 
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Visit Site</a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`material-symbols-outlined text-[16px] ${star <= lead.lead_quality ? 'text-amber-400' : 'text-gray-200'}`} style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                      Review Lead
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Review Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Review Submission</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium"><span className="text-gray-900 font-semibold">{selectedLead.business_name}</span> submitted by {selectedLead.first_name}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="reviewForm" onSubmit={handleReviewSubmit} className="space-y-8">
                <div>
                  <Label className="mb-3 block text-xs tracking-wider uppercase text-gray-500">Decision</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${reviewStatus === 'approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="status" value="approved" checked={reviewStatus === 'approved'} onChange={() => setReviewStatus('approved')} className="hidden" />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                      <span className="font-bold">Approve</span>
                    </label>
                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${reviewStatus === 'rejected' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="status" value="rejected" checked={reviewStatus === 'rejected'} onChange={() => setReviewStatus('rejected')} className="hidden" />
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reviewStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                      </div>
                      <span className="font-bold">Reject</span>
                    </label>
                  </div>
                </div>

                {reviewStatus === 'approved' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="mb-2 block text-xs tracking-wider uppercase text-gray-500">Points to Award</Label>
                    <Input 
                      type="number" 
                      value={points} 
                      onChange={e => setPoints(Number(e.target.value))} 
                    />
                    <p className="text-xs text-gray-500 mt-2">Points will be added to the student's leaderboard score.</p>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block text-xs tracking-wider uppercase text-gray-500">Feedback (Optional)</Label>
                  <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all min-h-[100px] resize-y text-sm"
                    placeholder={reviewStatus === 'approved' ? "Great job on finding this lead..." : "This lead doesn't meet the criteria because..."}
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="reviewForm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className={reviewStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              >
                Submit Review
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
