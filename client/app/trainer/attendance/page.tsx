"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";


interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url: string | null;
}

type AttendanceStatus = "present" | "absent" | "late" | "leave";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: string }> = {
  present: { label: "Present", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", icon: "check_circle" },
  absent: { label: "Absent", color: "text-red-600", bg: "bg-red-50 border-red-200 hover:bg-red-100", icon: "cancel" },
  late: { label: "Late", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 hover:bg-amber-100", icon: "schedule" },
  leave: { label: "Leave", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100", icon: "event_busy" },
};

export default function TrainerAttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState<Record<number, AttendanceStatus>>({});

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
        // Default all to present
        const defaults: Record<number, AttendanceStatus> = {};
        (json.data || []).forEach((s: Student) => { defaults[s.id] = "present"; });
        setAttendance(defaults);
      }
    } catch {
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExistingAttendance = useCallback(async (date: string) => {
    try {
      const res = await apiClient(`/api/attendance/date/${date}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const map: Record<number, AttendanceStatus> = {};
        json.data.forEach((r: any) => { map[r.student_id] = r.status; });
        setExistingRecords(map);
        setAttendance((prev) => ({ ...prev, ...map }));
      } else {
        setExistingRecords({});
      }
    } catch {}
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchStudents();
  }, [fetchStudents, router]);

  useEffect(() => {
    if (selectedDate) fetchExistingAttendance(selectedDate);
  }, [selectedDate, fetchExistingAttendance]);

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!selectedDate) { toast.error("Please select a date."); return; }
    setIsSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendance[s.id] || "present",
      }));
      const res = await apiClient(`/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date: selectedDate }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Attendance saved for ${records.length} students!`);
        fetchExistingAttendance(selectedDate);
      } else {
        toast.error(json.error || "Failed to save.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount = Object.values(attendance).filter((v) => v === "absent").length;
  const lateCount = Object.values(attendance).filter((v) => v === "late").length;
  const leaveCount = Object.values(attendance).filter((v) => v === "leave").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Mark Attendance" 
        description="Select a date and mark attendance for each student." 
        icon="event_available"
      />

      {/* Date + bulk actions */}
      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm flex-1 md:flex-none">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">calendar_today</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-gray-900 text-sm font-semibold focus:outline-none w-full"
              />
              {Object.keys(existingRecords).length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-sm font-bold uppercase tracking-widest shrink-0">Saved</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap flex-1 md:flex-none justify-end">
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => setAllStatus(s)}
                  className={`${STATUS_CONFIG[s].color} hover:${STATUS_CONFIG[s].bg}`}
                >
                  Mark All {STATUS_CONFIG[s].label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", count: presentCount, color: "text-emerald-600" },
          { label: "Absent", count: absentCount, color: "text-red-600" },
          { label: "Late", count: lateCount, color: "text-amber-600" },
          { label: "Leave", count: leaveCount, color: "text-blue-600" },
        ].map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black ${item.color}`}>{item.count}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">group_off</span>
            </div>
            <p className="text-gray-500 font-medium">No students found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {students.map((student) => {
              const status = attendance[student.id] || "present";
              return (
                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden shadow-sm">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-gray-500 font-bold text-lg">{(student.first_name || "?")[0]}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">{student.enrollment_id || student.program}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    {/* Status buttons */}
                    <div className="flex gap-2">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: s }))}
                          title={STATUS_CONFIG[s].label}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                            status === s
                              ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} shadow-inner`
                              : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 bg-white"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={status === s ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {STATUS_CONFIG[s].icon}
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* Current label */}
                    <Badge 
                      className={`hidden md:inline-flex w-24 justify-center uppercase tracking-wider text-[10px] ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}
                      variant="outline"
                    >
                      {STATUS_CONFIG[status].label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Save button */}
      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSaving || students.length === 0}
          isLoading={isSaving}
          size="lg"
          className="w-full sm:w-auto"
        >
          {!isSaving && <span className="material-symbols-outlined mr-2">save</span>}
          {isSaving ? "Saving…" : `Save Attendance for ${new Date(selectedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`}
        </Button>
      </div>
    </div>
  );
}
