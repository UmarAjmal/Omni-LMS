"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";


interface Stats {
  totalStudents: number;
  pendingReviews: number;
  assignedTasks: number;
  submissions: number;
  totalAssignments: number;
  todayAttendance: number;
  submissionRate: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className={`hover:-translate-y-1 transition-all duration-300 ${accent ? `border-${accent}-200` : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
              accent ? `bg-${accent}-100` : "bg-blue-100"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${accent ? `text-${accent}-600` : 'text-blue-600'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
        </div>
        <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        apiClient(`/api/trainers/dashboard-stats`),
        apiClient(`/api/tasks/submitted`),
      ]);
      const statsJson = await statsRes.json();
      const submissionsJson = await submissionsRes.json();
      if (statsJson.success) setStats(statsJson.data);
      if (submissionsJson.success) setRecentSubmissions(submissionsJson.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load trainer dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  const submissionRate = stats?.submissionRate ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <PageHeader 
        title="Trainer Dashboard" 
        description={new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard icon="group" label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard icon="assignment" label="Tasks Assigned" value={stats?.assignedTasks ?? 0} />
        <StatCard icon="rate_review" label="Pending Reviews" value={stats?.pendingReviews ?? 0} sub="Awaiting feedback" accent="amber" />
        <StatCard icon="task_alt" label="Submissions" value={stats?.submissions ?? 0} />
        <StatCard icon="event_available" label="Today's Attendance" value={stats?.todayAttendance ?? 0} sub="Present today" accent="emerald" />
        <StatCard icon="percent" label="Submission Rate" value={`${submissionRate}%`} sub="Of all assignments" accent={submissionRate >= 70 ? "emerald" : "red"} />
      </div>

      {/* Submission Rate Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Weekly Progress</h2>
            <span className="text-blue-600 font-bold text-sm">{submissionRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${submissionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-gray-500">
            <span>Submission Rate</span>
            <span>{stats?.submissions ?? 0} / {stats?.totalAssignments ?? 0} tasks submitted</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { href: "/tasks/new", icon: "add_task", label: "Assign New Task", color: "from-blue-600 to-indigo-600" },
          { href: "/trainer/submitted-tasks", icon: "inbox", label: "View Submissions", color: "from-sky-500 to-blue-500" },
          { href: "/trainer/attendance", icon: "event_available", label: "Mark Attendance", color: "from-emerald-500 to-teal-500" },
          { href: "/trainer/announcements", icon: "campaign", label: "Post Announcement", color: "from-purple-500 to-fuchsia-500" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl group`}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
            </div>
            <span className="text-sm font-bold text-white">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Submissions */}
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Recent Submissions</h2>
          <Link href="/trainer/submitted-tasks" className="text-blue-600 text-xs font-bold hover:text-blue-700 hover:underline uppercase tracking-wider">View all →</Link>
        </div>
        <CardContent className="p-0">
          {recentSubmissions.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-300 text-[32px]">inbox</span>
              </div>
              <p className="text-gray-500 font-medium">No submissions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSubmissions.map((sub) => (
                <div key={sub.assignment_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">
                        {(sub.first_name || "?")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{sub.first_name} {sub.last_name}</p>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{sub.task_name}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant={sub.status === "marked" ? "success" : "warning"} className="hidden sm:inline-flex uppercase tracking-wider text-[10px]">
                      {sub.status === "marked" ? "Reviewed" : "Pending Review"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/trainer/submitted-tasks`)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
