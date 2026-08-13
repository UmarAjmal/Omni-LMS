"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DragDropUploader from "@/components/DragDropUploader";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface TaskAssignment {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  task_name: string;
  task_description: string;
  points: number;
  due_date: string | null;
  reference_links: { title: string; url: string }[] | string;
}

export default function SubmitTaskPage() {
  const router = useRouter();
  
  const [studentId, setStudentId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editor states (Applied locally/visually in textarea)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch student assigned tasks
  const fetchTasks = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/${id}/tasks`);
      const json = await res.json();
      if (json.success) {
        // Only keep pending ones for submission
        const pending = (json.data || []).filter((t: TaskAssignment) => t.status === "pending");
        setAssignments(pending);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
      toast.error("Failed to fetch assigned tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    const userId = localStorage.getItem("lms_user_id");

    const handleLogout = () => {
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_auth");
      localStorage.removeItem("lms_user_role");
      localStorage.removeItem("lms_user_id");
      localStorage.removeItem("lms_student_info");
      router.push("/");
    };

    if (!infoStr || infoStr === "undefined" || infoStr === "null") {
      if (userId) {
        apiClient(`/api/students/profile?userId=${userId}`)
          .then(r => r.json())
          .then(json => {
            if (json.success && json.data) {
              localStorage.setItem("lms_student_info", JSON.stringify(json.data));
              setStudentId(json.data.id);
              fetchTasks(json.data.id);
            } else {
              toast.error("Session missing. Please re-login.");
              handleLogout();
            }
          })
          .catch(() => {
            toast.error("Network error. Please try again.");
          });
      } else {
        toast.error("Session details missing. Please re-login.");
        handleLogout();
      }
      return;
    }

    try {
      const studentObj = JSON.parse(infoStr);
      if (studentObj && studentObj.id) {
        setStudentId(studentObj.id);
        fetchTasks(studentObj.id);
      } else {
        toast.error("Session details missing. Please re-login.");
        handleLogout();
      }
    } catch {
      toast.error("Failed to parse student session.");
      handleLogout();
    }
  }, [router, fetchTasks]);

  const selectedAssignment = assignments.find(
    (a) => String(a.assignment_id) === selectedAssignmentId
  );

  // Format reference links
  const getReferenceLinks = (): { title: string; url: string }[] => {
    if (!selectedAssignment) return [];
    const r = selectedAssignment.reference_links;
    if (typeof r === "string") {
      try {
        return JSON.parse(r || "[]");
      } catch {
        return [];
      }
    }
    return r || [];
  };

  // Additional link builders
  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.warning("Fill title and URL."); return;
    }
    if (!/^https?:\/\//i.test(newLinkUrl)) {
      toast.warning("URL must start with http:// or https://"); return;
    }
    setLinks(prev => [...prev, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }]);
    setNewLinkTitle(""); setNewLinkUrl("");
  };
  const removeLink = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx));

  // Screenshot builders
  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  // Text formatting
  const wrap = (pre: string, suf = pre) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    const nv = value.slice(0, s) + pre + sel + suf + value.slice(e);
    setDescription(nv);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + pre.length, e + pre.length); }, 0);
  };
  const linePrefix = (pfx: string) => {
    setDescription(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + pfx);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Submit proof
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) {
      toast.error("Please select a milestone to submit."); return;
    }
    if (!description.trim()) {
      toast.error("Please describe your work completion guidelines."); return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient(`/api/tasks/assignments/${selectedAssignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description, githubUrl, liveUrl, videoUrl, notes, additionalLinks: links, imageUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Submission failed.");
      } else {
        toast.success("🎉 Deliverable submitted successfully!");
        // Reset form & reload
        setSelectedAssignmentId("");
        setDescription("");
        setGithubUrl("");
        setLiveUrl("");
        setVideoUrl("");
        setNotes("");
        setLinks([]);
        setImageUrls([]);
        if (studentId) fetchTasks(studentId);
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ToolBtn = ({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) => (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded flex items-center justify-center transition-all ${
        active ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="material-symbols-outlined text-[17px]">{icon}</span>
    </button>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <PageHeader 
        title="Submit Milestone Proof" 
        description="Upload deliverable summaries, source code links and prototype previews for review."
      />

      {isLoading ? (
        <Card className="p-16 text-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading pending milestones...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Submission Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Select Task */}
                  <div>
                    <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Target Milestone / Task *</Label>
                    <Select
                      value={selectedAssignmentId}
                      onChange={(e) => setSelectedAssignmentId(e.target.value)}
                      required
                    >
                      <option value="">-- Select a pending assignment --</option>
                      {assignments.map((a) => (
                        <option key={a.assignment_id} value={a.assignment_id}>
                          {a.task_name} ({a.points} XP)
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Office word style text summary */}
                  <div>
                    <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Completion summary / proof description *</Label>
                    
                    <div className="border border-gray-200 rounded-t-xl bg-gray-50 flex flex-wrap items-center gap-0.5 px-2 py-1.5">
                      <ToolBtn icon="format_bold" label="Bold" active={isBold} onClick={() => { setIsBold(!isBold); wrap("**","**"); }} />
                      <ToolBtn icon="format_italic" label="Italic" active={isItalic} onClick={() => { setIsItalic(!isItalic); wrap("_","_"); }} />
                      <ToolBtn icon="code" label="Code Font" active={isCode} onClick={() => { setIsCode(!isCode); wrap("`","`"); }} />
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <ToolBtn icon="format_list_bulleted" label="Bullet List" onClick={() => linePrefix("- ")} />
                      <ToolBtn icon="format_list_numbered" label="Numbered List" onClick={() => linePrefix("1. ")} />
                      <ToolBtn icon="format_quote" label="Quote Block" onClick={() => linePrefix("> ")} />
                      <ToolBtn icon="code_blocks" label="Block code" onClick={() => wrap("\n```\n","\n```")} />
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <ToolBtn icon="title" label="Heading" onClick={() => linePrefix("## ")} />
                      <ToolBtn icon="horizontal_rule" label="Divider" onClick={() => linePrefix("\n---\n")} />
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      placeholder="Describe how you completed the tasks, key features implemented, technologies used and instructions to test your prototype..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      style={{
                        fontWeight: isBold ? "bold" : "normal",
                        fontStyle: isItalic ? "italic" : "normal",
                        fontFamily: isCode ? "'Fira Code', monospace" : "inherit"
                      }}
                      className="w-full bg-white border border-gray-200 border-t-0 rounded-b-xl p-3.5 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Primary Repo and Prototype Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">GitHub Repository URL</Label>
                      <Input
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Hosted / Live Preview URL</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Demo Video URL */}
                  <div>
                    <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Demo Video URL (Loom / Youtube)</Label>
                    <Input
                      type="url"
                      placeholder="https://loom.com/share/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>

                  {/* Additional Reference Links */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <Label className="block text-xs tracking-widest text-gray-400 uppercase">Other Reference URLs</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="Link title (e.g. API Docs)"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                      />
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addLink}
                        className="shrink-0"
                      >Add Link</Button>
                    </div>
                    {links.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {links.map((l, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                            <div className="truncate flex items-center gap-2">
                              <span className="material-symbols-outlined text-blue-600 text-[18px]">link</span>
                              <span className="font-bold text-gray-900 text-sm">{l.title}</span>
                              <span className="text-gray-500 text-xs">({l.url})</span>
                            </div>
                            <button type="button" onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Screenshot Image Proofs */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <Label className="block text-xs tracking-widest text-gray-400 uppercase">Screenshot / Image Proofs</Label>
                    <div className="bg-gray-50 rounded-xl p-1 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors">
                       <DragDropUploader
                        onUploadSuccess={(url) => setImageUrls(prev => [...prev, url])}
                        label="Drag &amp; Drop Proof Screenshot or Click to Browse"
                      />
                    </div>
                    {imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {imageUrls.map((url, i) => (
                          <div key={url} className="relative group">
                            <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/100x60/f8fafc/64748b?text=Error"; }} />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="pt-4 border-t border-gray-100">
                    <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Evaluator Remarks / Notes</Label>
                    <textarea
                      placeholder="Any comments, doubts, questions or difficulties encountered to share with evaluator..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium resize-none placeholder-gray-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedAssignmentId}
                    isLoading={isSubmitting}
                    className="w-full py-6 text-sm"
                  >
                    {!isSubmitting && <span className="material-symbols-outlined mr-2">send</span>}
                    Submit Completion Proof
                  </Button>

                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Task Guidelines details card */}
          <div className="lg:col-span-4">
            <Card className="h-full sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1 uppercase tracking-wider">Task Guidelines</h3>
                  <p className="text-gray-500 text-xs font-medium">Select a task from dropdown to load instructions.</p>
                </div>
                
                {selectedAssignment ? (
                  <div className="space-y-6">
                    <div className="border-t border-b border-gray-100 py-4 space-y-1">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Title</p>
                      <p className="text-sm font-bold text-gray-900">{selectedAssignment.task_name}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instructions</p>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedAssignment.task_description || "No specific instructions provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Points Reward</p>
                        <p className="text-sm font-black text-blue-600">{selectedAssignment.points} XP</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : "No Limit"}
                        </p>
                      </div>
                    </div>

                    {getReferenceLinks().length > 0 && (
                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Resources</p>
                        {getReferenceLinks().map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-blue-600 text-[18px]">link</span>
                            <span className="truncate flex-1">{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-4xl block mb-3 text-gray-300">quick_reference_all</span>
                    <p className="text-sm max-w-[200px] mx-auto">Select an active milestone task from the left form to inspect guidelines.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
