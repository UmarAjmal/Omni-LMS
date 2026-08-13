"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";

interface TaskAssignment {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  graded_at: string | null;
  feedback: string | null;
  assigned_at: string;
  task_name: string;
  task_description: string;
  course_id: string;
  course_label: string;
  points: number;
  due_date: string | null;
  reference_links: { title: string; url: string }[] | string;
}

export default function StudentTasksListPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);

  const fetchTasks = useCallback(async (studentId: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/${studentId}/tasks`);
      const json = await res.json();
      if (json.success) {
        setAssignments(json.data || []);
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

  const activeList = assignments.filter(a => a.status === "pending");
  const submittedList = assignments.filter(a => a.status === "completed");
  const gradedList = assignments.filter(a => a.status === "marked");

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; variant: any }> = {
      pending: { label: "In Progress", variant: "warning" },
      completed: { label: "Submitted", variant: "default" },
      marked: { label: "Graded", variant: "success" },
    };
    const s = map[status] || { label: status, variant: "secondary" };
    return (
      <Badge variant={s.variant} className="uppercase tracking-wider text-[10px]">
        {s.label}
      </Badge>
    );
  };

  const getReferenceLinks = (task: TaskAssignment): { title: string; url: string }[] => {
    const r = task.reference_links;
    if (typeof r === "string") {
      try { return JSON.parse(r || "[]"); } catch { return []; }
    }
    return r || [];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Milestone Objectives Registry" 
        description="Explore and audit your assigned batch milestones, grading criteria, and evaluator feedback logs." 
        icon="fact_check"
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-sm">Loading task registry...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          
          {/* List 1: Active In-Progress Tasks */}
          <Card className="overflow-hidden border-yellow-200 shadow-sm">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-yellow-900">Active Assignments</h3>
                <p className="text-yellow-700 text-sm mt-0.5">Tasks currently awaiting your implementation and summary submissions.</p>
              </div>
              <Badge variant="warning" className="w-fit">{activeList.length} Active</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Details</TableHead>
                  <TableHead>Assigned Track</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>XP Reward</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No active milestones assigned. Great job staying up to date!
                    </TableCell>
                  </TableRow>
                ) : (
                  activeList.map(a => (
                    <TableRow key={a.assignment_id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(a)}
                          className="font-bold text-gray-900 hover:text-blue-600 hover:underline text-left cursor-pointer transition-colors"
                        >
                          {a.task_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600">{a.course_label}</TableCell>
                      <TableCell className="text-gray-900 font-medium">
                        {a.due_date ? new Date(a.due_date).toLocaleDateString() : "No Limit"}
                      </TableCell>
                      <TableCell className="text-blue-600 font-bold">{a.points} XP</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/student/submit-task")}
                        >
                          <span className="material-symbols-outlined mr-2 text-[18px]">upload</span>
                          Submit Proof
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* List 2: Submitted / Awaiting review */}
          <Card className="overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-blue-900">Completions Submitted</h3>
                <p className="text-blue-700 text-sm mt-0.5">Tasks you completed and uploaded. Evaluator reviews are pending.</p>
              </div>
              <Badge variant="primary" className="w-fit">{submittedList.length} Under Review</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Details</TableHead>
                  <TableHead>Assigned Track</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>XP Value</TableHead>
                  <TableHead className="text-right">Audits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No submissions pending review.
                    </TableCell>
                  </TableRow>
                ) : (
                  submittedList.map(a => (
                    <TableRow key={a.assignment_id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(a)}
                          className="font-bold text-gray-900 hover:text-blue-600 hover:underline text-left cursor-pointer transition-colors"
                        >
                          {a.task_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600">{a.course_label}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-gray-900 font-medium">{a.points} XP</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(a)}
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* List 3: Graded Milestones */}
          <Card className="overflow-hidden border-emerald-200 shadow-sm">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-emerald-900">Graded Deliverables</h3>
                <p className="text-emerald-700 text-sm mt-0.5">Tasks completed, marked, and officially evaluated by senior trainers.</p>
              </div>
              <Badge variant="success" className="w-fit">{gradedList.length} Graded</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Details</TableHead>
                  <TableHead>Assigned Track</TableHead>
                  <TableHead>Score Grade</TableHead>
                  <TableHead>Graded Date</TableHead>
                  <TableHead className="text-right">Audits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No graded deliverables logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  gradedList.map(a => (
                    <TableRow key={a.assignment_id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(a)}
                          className="font-bold text-gray-900 hover:text-blue-600 hover:underline text-left cursor-pointer transition-colors"
                        >
                          {a.task_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600">{a.course_label}</TableCell>
                      <TableCell className="text-lg font-extrabold text-blue-600">
                        {a.score}%
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium">
                        {a.graded_at ? new Date(a.graded_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTask(a)}
                        >
                          <span className="material-symbols-outlined mr-2 text-[18px]">speaker_notes</span>
                          Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

        </div>
      )}

      {/* Task Details Dialog Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">info</span>
                Milestone Specifications
              </DialogTitle>
              <DialogDescription>
                Review task specification guidelines and feedback
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Task Name</span>
                <p className="text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedTask.task_name}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description &amp; Guidelines</span>
                <p className="text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px]">
                  {selectedTask.task_description || "No description provided."}
                </p>
              </div>

              {getReferenceLinks(selectedTask).length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Reference Links</span>
                  <div className="space-y-2">
                    {getReferenceLinks(selectedTask).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-lg text-sm text-gray-900 font-medium transition-all group"
                      >
                        <span className="material-symbols-outlined text-blue-500 text-[20px] group-hover:scale-110 transition-transform">link</span>
                        <span className="truncate flex-1">{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Score and feedback if graded */}
              {selectedTask.status === "marked" && (
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Evaluation Score</p>
                      <p className="text-3xl font-black text-emerald-900">{selectedTask.score}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600 text-[28px]">workspace_premium</span>
                    </div>
                  </div>

                  {selectedTask.feedback && (
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Evaluator Feedback</span>
                      <blockquote className="text-sm text-gray-700 border-l-4 border-blue-500 bg-blue-50/50 pl-4 py-3 pr-4 rounded-r-lg italic leading-relaxed">
                        "{selectedTask.feedback}"
                      </blockquote>
                    </div>
                  )}
                </div>
              )}

            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
