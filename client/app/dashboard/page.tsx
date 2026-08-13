"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

interface AdminStats {
  students: number;
  trainers: number;
  campaigns: number;
  activeTasks: number;
  pendingRegistrations: number;
  submissions: number;
  todayAttendance: number;
  admissionsWeekly: { day: string; count: string }[];
  taskCompletion: { pending: string; completed: string; marked: string };
}

interface FinanceStats {
  totalExpected: number;
  totalCollected: number;
  outstandingFees: number;
  pendingStudents: number;
}

function StatCard({ 
  icon, 
  label, 
  value, 
  sub, 
  href,
  colorClass = "text-gray-900 bg-gray-100"
}: { 
  icon: string; 
  label: string; 
  value: string | number; 
  sub?: string; 
  href?: string;
  colorClass?: string;
}) {
  const Inner = (
    <Card className={`h-full hover:shadow-md transition-all ${href ? "cursor-pointer group hover:border-gray-300" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          {href && <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-900 transition-colors">arrow_forward</span>}
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{Inner}</Link> : Inner;
}

// Mini bar chart
function BarChart({ data, label }: { data: { day: string; count: string }[]; label: string }) {
  const max = Math.max(...data.map((d) => parseInt(d.count) || 0), 1);
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">{label}</p>
      <div className="flex items-end gap-2 h-32">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm">No data yet</p>
          </div>
        ) : data.map((d, i) => {
          const height = Math.round(((parseInt(d.count) || 0) / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
              <div className="w-full rounded-t-md bg-gray-200 group-hover:bg-gray-800 transition-all" style={{ height: `${Math.max(height, 8)}%` }} />
              <span className="text-[10px] text-gray-500 font-medium">{new Date(d.day).toLocaleDateString("en", { weekday: "short" })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut chart
function DonutChart({ pending, completed, marked }: { pending: number; completed: number; marked: number }) {
  const total = pending + completed + marked || 1;
  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  
  const slices = [
    { pct: pending / total, color: "#9ca3af", label: "Pending", count: pending }, // gray-400
    { pct: completed / total, color: "#fbbf24", label: "Submitted", count: completed }, // amber-400
    { pct: marked / total, color: "#10b981", label: "Reviewed", count: marked }, // emerald-500
  ];

  return (
    <div className="flex items-center gap-8">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90 drop-shadow-sm">
          {slices.map((slice, i) => {
            const len = slice.pct * circ;
            const el = (
              <circle
                key={i}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900 leading-none">{total}</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase">Tasks</span>
        </div>
      </div>
      <div className="space-y-3">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
            <span className="text-sm font-medium text-gray-600">{s.label}</span>
            <span className="text-sm font-bold text-gray-900 ml-4">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/dashboard/admin-stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
      else console.error("admin-stats error:", json.error);

      const fres = await apiClient(`/api/finance/stats`);
      const fjson = await fres.json();
      if (fjson.success) setFinanceStats(fjson.data);
      else console.error("finance-stats error:", fjson.error);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchStats();
  }, [fetchStats, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const taskPending = parseInt(stats?.taskCompletion?.pending as string) || 0;
  const taskCompleted = parseInt(stats?.taskCompletion?.completed as string) || 0;
  const taskMarked = parseInt(stats?.taskCompletion?.marked as string) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Admin Dashboard" 
        description={`${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — System Overview`} 
      />

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon="school" label="Students" value={stats?.students ?? 0} href="/students" />
        <StatCard icon="badge" label="Trainers" value={stats?.trainers ?? 0} href="/dashboard/trainers" colorClass="bg-blue-50 text-blue-600" />
        <StatCard icon="radar" label="Campaigns" value={stats?.campaigns ?? 0} href="/dashboard/campaigns" colorClass="bg-purple-50 text-purple-600" />
        <StatCard icon="how_to_reg" label="Admissions" value={stats?.pendingRegistrations ?? 0} href="/students/applicants" colorClass="bg-rose-50 text-rose-600" sub="Require review" />
        <StatCard icon="assignment" label="Active Tasks" value={stats?.activeTasks ?? 0} colorClass="bg-amber-50 text-amber-600" />
        <StatCard icon="task_alt" label="Submissions" value={stats?.submissions ?? 0} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard icon="event_available" label="Present Today" value={stats?.todayAttendance ?? 0} sub="Students present" colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard icon="verified" label="System Status" value="Online" sub="All services running" colorClass="bg-teal-50 text-teal-600" />
      </div>

      {/* Finance Stats */}
      <section>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Finance Overview</h2>
          <Link href="/dashboard/fees" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
            Manage Fees <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="account_balance" label="Expected Fees" value={`Rs. ${financeStats?.totalExpected ?? 0}`} colorClass="bg-slate-100 text-slate-700" />
          <StatCard icon="payments" label="Total Collected" value={`Rs. ${financeStats?.totalCollected ?? 0}`} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard icon="money_off" label="Outstanding" value={`Rs. ${financeStats?.outstandingFees ?? 0}`} colorClass="bg-rose-50 text-rose-600" />
          <StatCard icon="group_remove" label="Pending Students" value={financeStats?.pendingStudents ?? 0} colorClass="bg-amber-50 text-amber-600" />
        </div>
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <CardTitle>Weekly Admissions</CardTitle>
              <CardDescription>Applications received over the last 7 days</CardDescription>
            </div>
            <Link href="/students/applicants" className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            <BarChart data={stats?.admissionsWeekly ?? []} label="Admissions" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <CardTitle>Task Completion</CardTitle>
              <CardDescription>Overview of student task submissions</CardDescription>
            </div>
            <Link href="/tasks/completed" className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </Link>
          </CardHeader>
          <CardContent className="pt-6 flex justify-center">
            <DonutChart pending={taskPending} completed={taskCompleted} marked={taskMarked} />
            {(taskPending + taskCompleted + taskMarked) === 0 && (
              <p className="text-gray-400 text-sm text-center mt-4">No task data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/students/applicants", icon: "how_to_reg", label: "Review Admissions", color: "bg-gray-900", text: "text-white" },
              { href: "/dashboard/trainers", icon: "person_add", label: "Add Trainer", color: "bg-white border border-gray-200", text: "text-gray-900" },
              { href: "/tasks/new", icon: "add_task", label: "Assign Task", color: "bg-white border border-gray-200", text: "text-gray-900" },
              { href: "/dashboard/announcements", icon: "campaign", label: "Announce", color: "bg-white border border-gray-200", text: "text-gray-900" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.color} ${action.text} rounded-xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group`}
              >
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
                <span className="text-sm font-semibold">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Campaigns list */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Active Learning Tracks</h2>
            <Link href="/dashboard/campaigns" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
              Manage <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                {[
                  { id: "fullstack-ai", label: "Full Stack AI", icon: "smart_toy", color: "text-purple-600 bg-purple-50" },
                  { id: "web-dev", label: "Web Dev", icon: "code", color: "text-blue-600 bg-blue-50" },
                  { id: "app-dev", label: "App Dev", icon: "phone_android", color: "text-emerald-600 bg-emerald-50" },
                  { id: "devops", label: "DevOps", icon: "cloud_sync", color: "text-amber-600 bg-amber-50" },
                ].map((track) => (
                  <div key={track.id} className="p-6 flex flex-col items-center justify-center text-center group hover:bg-gray-50 transition-colors">
                    <div className={`w-12 h-12 rounded-full ${track.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{track.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{track.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
