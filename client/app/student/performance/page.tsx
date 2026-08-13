"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";

interface PerformanceRecord {
  assignment_id: number;
  task_name: string;
  course_label: string;
  max_points: number;
  score: number;
  grade: string;
  feedback: string | null;
  graded_at: string;
}

interface Summary {
  averageScore: number;
  totalGraded: number;
  highestScore: number;
  lowestScore: number;
}

const getGradeBadge = (grade: string) => {
  if (grade.startsWith('A')) return "success";
  if (grade.startsWith('B')) return "primary";
  if (grade.startsWith('C')) return "warning";
  if (grade.startsWith('F')) return "danger";
  return "secondary";
};

export default function StudentPerformancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  const fetchPerformance = useCallback(async (studentId: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/${studentId}/performance`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setSummary(json.summary || null);
      }
    } catch { toast.error("Failed to load performance."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined") { router.push("/"); return; }
    try {
      const student = JSON.parse(infoStr);
      setStudentName(`${student.first_name} ${student.last_name}`);
      fetchPerformance(student.id);
    } catch { router.push("/"); }
  }, [router, fetchPerformance]);

  // Score bar chart
  const ScoreBar = ({ score, max }: { score: number; max: number }) => (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-blue-600" : "bg-red-500"}`}
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-500 w-12 text-right">{score}/{max}</span>
    </div>
  );

  const overallGrade =
    !summary?.averageScore ? "—"
    : summary.averageScore >= 90 ? "A+"
    : summary.averageScore >= 80 ? "A"
    : summary.averageScore >= 70 ? "B"
    : summary.averageScore >= 60 ? "C"
    : "F";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <PageHeader 
        title="My Performance" 
        description="Track your grades, marks, and trainer feedback"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Average Score", value: `${summary?.averageScore ?? 0}%`, icon: "trending_up", color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Overall Grade", value: overallGrade, icon: "grade", color: "text-green-600", bg: "bg-green-100" },
          { label: "Tasks Graded", value: summary?.totalGraded ?? 0, icon: "task_alt", color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Highest Score", value: `${summary?.highestScore ?? 0}%`, icon: "emoji_events", color: "text-purple-600", bg: "bg-purple-100" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.bg}`}>
                <span className={`material-symbols-outlined text-[24px] ${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual score overview */}
      {records.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-6">Score Timeline</h2>
            <div className="flex items-end gap-3 h-32">
              {records.slice(0, 10).map((r, i) => {
                const h = Math.max(Math.round((r.score / (r.max_points || 100)) * 100), 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2" title={`${r.task_name}: ${r.score}/${r.max_points}`}>
                    <span className="text-[10px] font-bold text-gray-400">{r.score}</span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-md transition-all ${r.score >= 80 ? "bg-gradient-to-t from-green-500 to-emerald-400" : r.score >= 60 ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-gradient-to-t from-red-600 to-red-400"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] font-medium text-gray-500 text-center leading-tight max-w-[40px] truncate">{r.course_label || "—"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Assignment Breakdown</h2>
        </div>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-300 text-[32px]">school</span>
            </div>
            <p className="text-gray-500 font-medium">No graded tasks yet</p>
            <p className="text-gray-400 text-sm mt-1">Submit your tasks to see your performance here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="w-[150px]">Score</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.assignment_id}>
                  <TableCell>
                    <p className="text-sm font-bold text-gray-900">{record.task_name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{record.graded_at ? new Date(record.graded_at).toLocaleDateString() : "—"}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-blue-600 font-semibold">{record.course_label || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getGradeBadge(record.grade) as any}>
                      {record.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={record.score} max={record.max_points || 100} />
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-600 line-clamp-2">{record.feedback || <span className="italic text-gray-400">No feedback provided</span>}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
