"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  gradedTasks: number;
  pendingTasks: number;
  averageScore: number;
}

interface StudentInfo {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  whatsapp?: string;
  cnic?: string;
  university?: string;
  semester?: number;
  avatar_url?: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (studentId: number) => {
    try {
      const res = await apiClient(`/api/students/${studentId}/dashboard-stats`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined" || infoStr === "null") {
      toast.error("Student session details missing. Please re-login.");
      router.push("/");
      return;
    }
    try {
      const studentObj = JSON.parse(infoStr);
      if (studentObj && studentObj.id) {
        setStudent(studentObj);
        fetchStats(studentObj.id).finally(() => setIsLoading(false));
      } else {
        toast.error("Student profile details missing. Please re-login.");
        router.push("/");
      }
    } catch {
      toast.error("Failed to parse student session.");
      router.push("/");
    }
  }, [router, fetchStats]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Loading dashboard stats...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: "Total Milestones", value: stats?.totalTasks ?? 0, icon: "assignment", color: "from-blue-50 to-white", border: "border-blue-100", iconColor: "text-blue-500", iconBg: "bg-blue-100" },
    { label: "Pending Objectives", value: stats?.pendingTasks ?? 0, icon: "hourglass_empty", color: "from-amber-50 to-white", border: "border-amber-100", iconColor: "text-amber-500", iconBg: "bg-amber-100" },
    { label: "Uploaded Proofs", value: stats?.completedTasks ?? 0, icon: "cloud_upload", color: "from-purple-50 to-white", border: "border-purple-100", iconColor: "text-purple-500", iconBg: "bg-purple-100" },
    { label: "Graded Milestones", value: stats?.gradedTasks ?? 0, icon: "task_alt", color: "from-emerald-50 to-white", border: "border-emerald-100", iconColor: "text-emerald-500", iconBg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-0 overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <CardContent className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Badge variant="primary" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
              Student Executive Workspace
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {student?.first_name} {student?.last_name}!
            </h2>
            <p className="text-blue-200 text-sm max-w-2xl leading-relaxed">
              Monitor your assigned track parameters, review upcoming deadlines, and submit your completion deliverables.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-inner">
            <div className="text-right">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Enrollment ID</p>
              <p className="text-lg font-extrabold text-white mt-0.5">{student?.enrollment_id || "—"}</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1">{student?.program || "N/A"}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400 text-2xl font-light">workspace_premium</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => (
          <Card key={card.label} className={`bg-gradient-to-br ${card.color} border ${card.border} hover:shadow-md transition-shadow`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${card.iconColor} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Course Progress Chart/Ring */}
        <Card className="lg:col-span-4 flex flex-col justify-center">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest self-start">Average Scoring Performance</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG circle */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#2563eb" strokeWidth="8"
                  strokeDasharray="263.89" strokeDashoffset={263.89 - ((stats?.averageScore ?? 0) / 100) * 263.89} strokeLinecap="round"
                  transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1.5s ease-in-out" }} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-gray-900">{stats?.averageScore ?? 0}%</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Average Grade</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              Your performance index aggregates scores from evaluated tasks. Keep it above 75% for optimal batch rank.
            </p>
          </CardContent>
        </Card>

        {/* Quick Launchpad */}
        <Card className="lg:col-span-8">
          <CardContent className="p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Portal Launchpad</h3>
              <p className="text-sm text-gray-500">Quickly navigate to critical actions to continue your training deliverables.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { title: "Upload Task Proofs", desc: "Submit completion details, github repository code and screens.", route: "/student/submit-task", icon: "upload", button: "Go to Submission", color: "blue" },
                { title: "View Milestones", desc: "Review all your active, pending and graded course track tasks.", route: "/student/tasks", icon: "assignment_late", button: "Check Tasks", color: "emerald" },
                { title: "Complete Profile", desc: "Update your CNIC, university, semester and onboarding details.", route: "/student/profile", icon: "manage_accounts", button: "Modify Profile", color: "purple" }
              ].map((card) => (
                <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col h-full group hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="mb-6 flex-1">
                    <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 text-${card.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">{card.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(card.route)}
                  >
                    {card.button}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
