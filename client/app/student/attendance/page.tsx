"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AttendanceRecord {
  id: number;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  notes: string | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendancePercent: number;
}

const STATUS_CONFIG = {
  present: { color: "text-green-600", bg: "bg-green-100", icon: "check_circle", label: "Present" },
  absent: { color: "text-red-600", bg: "bg-red-100", icon: "cancel", label: "Absent" },
  late: { color: "text-orange-600", bg: "bg-orange-100", icon: "schedule", label: "Late" },
  leave: { color: "text-blue-600", bg: "bg-blue-100", icon: "event_busy", label: "Leave" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StudentAttendancePage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const fetchAttendance = useCallback(async (id: number, month: number, year: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/attendance/student/${id}?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setStats(json.stats || null);
      }
    } catch { toast.error("Failed to load attendance."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined") { router.push("/"); return; }
    try {
      const student = JSON.parse(infoStr);
      setStudentId(student.id);
      fetchAttendance(student.id, selectedMonth, selectedYear);
    } catch { router.push("/"); }
  }, [router, fetchAttendance, selectedMonth, selectedYear]);

  // Build calendar grid
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const recordMap = Object.fromEntries(records.map((r) => [new Date(r.date).getDate(), r]));

  const AttendanceStat = ({ label, count, pct, status }: { label: string; count: number; pct?: number; status: keyof typeof STATUS_CONFIG }) => (
    <Card>
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${STATUS_CONFIG[status].bg}`}>
          <span className={`material-symbols-outlined text-[24px] ${STATUS_CONFIG[status].color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{STATUS_CONFIG[status].icon}</span>
        </div>
        <p className={`text-3xl font-black ${STATUS_CONFIG[status].color} mb-1`}>{pct != null ? `${pct}%` : count}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        {pct != null && <p className="text-[11px] font-medium text-gray-400 mt-1">{count} days</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <PageHeader 
        title="My Attendance" 
        description="Track your attendance history and stats"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <AttendanceStat label="Attendance Rate" count={stats?.present ?? 0} pct={stats?.attendancePercent} status="present" />
        <AttendanceStat label="Present" count={stats?.present ?? 0} status="present" />
        <AttendanceStat label="Absent" count={stats?.absent ?? 0} status="absent" />
        <AttendanceStat label="Late" count={stats?.late ?? 0} status="late" />
      </div>

      {/* Month Picker */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => {
            if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
            else setSelectedMonth(m => m - 1);
          }}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </Button>
        <p className="text-base font-bold text-gray-900 min-w-[140px] text-center">
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => {
            if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
            else setSelectedMonth(m => m + 1);
          }}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const record = recordMap[day];
                const isToday = day === today.getDate() && selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
                return (
                  <div
                    key={day}
                    title={record ? STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]?.label : "No record"}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all relative ${
                      record
                        ? record.status === "present" ? "bg-green-50 text-green-700"
                        : record.status === "absent" ? "bg-red-50 text-red-700"
                        : record.status === "late" ? "bg-orange-50 text-orange-700"
                        : "bg-blue-50 text-blue-700"
                        : isToday ? "bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                        : "text-gray-500 hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-6 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
            <span className="text-sm font-medium text-gray-600">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* History Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Attendance History</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-300 text-4xl">event_available</span>
            </div>
            <p className="text-gray-500 font-medium">No attendance records for this month</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...records].reverse().map((record) => {
              const cfg = STATUS_CONFIG[record.status];
              return (
                <div key={record.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} shrink-0`}>
                    <span className={`material-symbols-outlined text-[20px] ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {record.notes && <p className="text-[12px] font-medium text-gray-500 mt-0.5">{record.notes}</p>}
                  </div>
                  <Badge variant={
                    record.status === 'present' ? 'success' : 
                    record.status === 'absent' ? 'danger' : 
                    record.status === 'late' ? 'warning' : 'primary'
                  }>
                    {cfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
