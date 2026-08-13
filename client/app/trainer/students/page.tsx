"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";


interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  total_tasks?: number;
  graded_tasks?: number;
  avg_score?: number;
}

const PROGRAM_LABELS: Record<string, string> = {
  "fullstack-ai": "Full Stack AI",
  "devops": "DevOps",
  "app-dev": "App Dev",
  "web-dev": "Web Dev",
};

export default function TrainerStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/full-report`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
        setFiltered(json.data || []);
      } else {
        // Fallback to basic list
        const fallback = await apiClient(`/api/students`);
        const fj = await fallback.json();
        if (fj.success) { setStudents(fj.data || []); setFiltered(fj.data || []); }
      }
    } catch {
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchStudents();
  }, [fetchStudents, router]);

  useEffect(() => {
    let data = [...students];
    if (programFilter !== "all") data = data.filter((s) => s.program === programFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.enrollment_id || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [search, programFilter, students]);

  const programs = Array.from(new Set(students.map((s) => s.program).filter(Boolean)));

  const getGradeColor = (score?: number) => {
    if (!score) return "text-gray-400 font-medium";
    if (score >= 80) return "text-emerald-600 font-black";
    if (score >= 60) return "text-blue-600 font-bold";
    return "text-red-500 font-bold";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Students" 
        description={`${students.length} enrolled students`} 
        icon="groups"
      />

      {/* Filters */}
      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400 text-[20px]">search</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or email…"
                className="pl-10"
              />
            </div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="flex h-11 w-full sm:w-64 items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>{PROGRAM_LABELS[p] || p}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading students...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">group_off</span>
            </div>
            <p className="text-gray-500 font-medium">No students found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <span>Student</span>
            <span>Program</span>
            <span>Tasks</span>
            <span>Avg Score</span>
            <span>Contact</span>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((student) => (
              <div key={student.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-5 hover:bg-blue-50/30 transition-colors items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <span className="text-gray-500 font-bold text-lg">{(student.first_name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{student.first_name} {student.last_name}</p>
                    <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">{student.enrollment_id}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider text-[10px]">
                    {PROGRAM_LABELS[student.program] || student.program || "—"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{student.graded_tasks ?? "—"}</span>
                  {student.total_tasks != null && <span className="text-gray-400 font-medium"> / {student.total_tasks}</span>}
                </div>
                <div>
                  <span className={`text-sm ${getGradeColor(student.avg_score)}`}>
                    {student.avg_score != null ? `${student.avg_score}%` : "—"}
                  </span>
                </div>
                <div>
                  {student.email && (
                    <a href={`mailto:${student.email}`} className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      <span className="truncate max-w-[150px] font-medium">{student.email}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
