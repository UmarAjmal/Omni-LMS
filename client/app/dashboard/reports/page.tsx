"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminReportsPage() {
  const router = useRouter();
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [studentReport, setStudentReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "attendance">("students");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, studRes] = await Promise.all([
        apiClient(`/api/attendance/summary`),
        apiClient(`/api/students/full-report`),
      ]);
      const attJson = await attRes.json();
      const studJson = await studRes.json();
      if (attJson.success) setAttendanceSummary(attJson.data || []);
      else console.error("Attendance summary error:", attJson.error);
      if (studJson.success) setStudentReport(studJson.data || []);
      else console.error("Student full-report error:", studJson.error);
    } catch (err) {
      console.error("fetchReports error:", err);
      toast.error("Failed to load reports.");
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchReports();
  }, [fetchReports, router]);

  const getGradeColor = (score?: number) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-red-600";
  };

  const getAttPct = (row: any) => {
    const total = parseInt(row.total_days) || 0;
    const present = parseInt(row.present_count) + parseInt(row.late_count || 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <PageHeader 
        title="Reports" 
        description="Analytics and performance reports"
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "students", label: "Student Performance", icon: "trending_up" },
          { key: "attendance", label: "Attendance Report", icon: "event_available" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <span className="material-symbols-outlined mr-2">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        </Card>
      ) : activeTab === "students" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead className="w-[150px]">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">No data yet</TableCell>
                </TableRow>
              ) : (
                studentReport.map((s) => {
                  const attPct = s.total_attendance > 0 ? Math.round((s.present_days / s.total_attendance) * 100) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                            {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-gray-500 font-bold text-sm">{(s.first_name || "?")[0]}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                            <p className="text-[11px] font-medium text-gray-500 truncate">{s.enrollment_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-blue-600 font-semibold">{s.program || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-600"><span className="font-bold text-gray-900">{s.graded_tasks ?? 0}</span> / {s.total_tasks ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-black ${getGradeColor(parseFloat(s.avg_score))}`}>{s.avg_score != null ? `${s.avg_score}%` : "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${attPct >= 75 ? "bg-green-500" : attPct >= 50 ? "bg-blue-600" : "bg-red-500"}`} style={{ width: `${attPct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-8 text-right">{attPct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Leave</TableHead>
                <TableHead className="w-[150px]">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">No attendance data yet</TableCell>
                </TableRow>
              ) : (
                attendanceSummary.map((row) => {
                  const pct = getAttPct(row);
                  return (
                    <TableRow key={row.student_id}>
                      <TableCell>
                        <p className="text-sm font-bold text-gray-900">{row.first_name} {row.last_name}</p>
                        <p className="text-[11px] font-medium text-gray-500">{row.enrollment_id}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-green-600">{row.present_count ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-red-600">{row.absent_count ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-orange-600">{row.late_count ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-blue-600">{row.leave_count ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-blue-600" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
