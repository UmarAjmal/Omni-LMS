"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "web-dev",      label: "Web Development",       icon: "code" },
  { id: "app-dev",      label: "App Development",       icon: "phone_android" },
  { id: "devops",       label: "DevOps",                icon: "cloud_sync" },
];

interface Assignment {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  graded_at: string | null;
  assigned_at: string;
  task_name: string;
  task_description: string;
  course_id: string;
  course_label: string;
  points: number;
  due_date: string | null;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  email: string;
}

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "primary" | "success" | "warning" | "danger" | "secondary" }> = {
    pending:   { label: "In Progress", variant: "warning" },
    completed: { label: "Submitted",   variant: "primary" }, // blue
    marked:    { label: "Graded",      variant: "success" },
  };
  const s = map[status] || { label: status, variant: "secondary" };
  return (
    <Badge variant={s.variant} className="uppercase text-[10px] tracking-wider">
      {s.label}
    </Badge>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center py-12">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-[24px]">inbox</span>
          </div>
          <span className="text-gray-500 font-medium">{message}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CompletedTasksPage() {
  const [selectedCourse, setSelectedCourse] = useState("fullstack-ai");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/tasks/assignments/by-course/${courseId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load task assignments.");
        setAssignments([]);
      } else {
        setAssignments(json.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Could not reach the server.");
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments(selectedCourse);
  }, [selectedCourse, fetchAssignments]);

  const handleOpenReview = (assignmentId: number) => {
    window.open(`/trainer/submitted-tasks`, "_blank", "noopener,noreferrer");
  };

  const submittedList = assignments.filter(a => a.status === "completed");
  const pendingList   = assignments.filter(a => a.status === "pending");
  const markedList    = assignments.filter(a => a.status === "marked");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Complete Tasks Audit" 
        description="Review student task completions, grade deliverables, and monitor learning progress." 
      />

      <Card>
        <CardContent className="p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Filter by Course Department
          </label>
          <div className="flex flex-wrap gap-3">
            {COURSES.map(course => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourse(course.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCourse === course.id
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{course.icon}</span>
                {course.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-600">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchAssignments(selectedCourse)} className="text-red-700 border-red-200 hover:bg-red-100">
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-500">Loading assignments for this course...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <CardTitle>Completions Submitted</CardTitle>
                <CardDescription>Tasks uploaded by students awaiting evaluation.</CardDescription>
              </div>
              <Badge variant="primary" className="bg-blue-100 text-blue-700">
                {submittedList.length} Awaiting
              </Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedList.length === 0 ? (
                  <EmptyRow cols={5} message="No submissions awaiting review for this course." />
                ) : submittedList.map(a => (
                  <TableRow key={a.assignment_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={DEFAULT_AVATAR} alt="" className="w-8 h-8 rounded-full border border-gray-200 shrink-0" />
                        <span className="font-semibold text-gray-900">{a.first_name} {a.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-md">{a.course_label}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[220px] block" title={a.task_name}>{a.task_name}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(a.assignment_id)}>
                        Review <span className="material-symbols-outlined ml-2 text-[16px]">arrow_forward</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <CardTitle>Pending Assignments</CardTitle>
                <CardDescription>Tasks currently in-progress by students.</CardDescription>
              </div>
              <Badge variant="warning">
                {pendingList.length} Active
              </Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingList.length === 0 ? (
                  <EmptyRow cols={5} message="No pending assignments for this course." />
                ) : pendingList.map(a => (
                  <TableRow key={a.assignment_id} className="opacity-70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={DEFAULT_AVATAR} alt="" className="w-8 h-8 rounded-full border border-gray-200 shrink-0 grayscale" />
                        <span className="font-semibold text-gray-700">{a.first_name} {a.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">{a.course_label}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-600 truncate max-w-[220px] block" title={a.task_name}>{a.task_name}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <button disabled className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed ml-auto" title="Submission not yet uploaded">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <CardTitle>Graded Deliverables</CardTitle>
                <CardDescription>Tasks reviewed, scored, and officially marked by the evaluator.</CardDescription>
              </div>
              <Badge variant="success">
                {markedList.length} Graded
              </Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markedList.length === 0 ? (
                  <EmptyRow cols={5} message="No graded deliverables for this course yet." />
                ) : markedList.map(a => (
                  <TableRow key={a.assignment_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={DEFAULT_AVATAR} alt="" className="w-8 h-8 rounded-full border border-gray-200 shrink-0" />
                        <span className="font-semibold text-gray-900">{a.first_name} {a.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-md">{a.course_label}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[220px] block" title={a.task_name}>{a.task_name}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <span className={`text-base font-extrabold ${
                        (a.score ?? 0) >= 80 ? "text-emerald-600" :
                        (a.score ?? 0) >= 60 ? "text-amber-500" : "text-red-600"
                      }`}>
                        {a.score ?? "—"}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
