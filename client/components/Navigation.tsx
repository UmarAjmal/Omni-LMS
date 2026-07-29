"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { NotificationCenter } from "./NotificationCenter";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

// ─────────────────────────────────────────
// Nav link helper
// ─────────────────────────────────────────
function NavLink({
  href,
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group relative ${
        active
          ? "bg-white/10 text-white font-medium"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] transition-all ${
          active ? "text-white" : "text-slate-400 group-hover:text-slate-300"
        }`}
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </p>
  );
}

// ─────────────────────────────────────────
// Main Navigation Component
// ─────────────────────────────────────────
export default function Navigation({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [pendingAdmissions, setPendingAdmissions] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");

  const closeMobile = () => setIsMobileMenuOpen(false);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/training-applications/count`);
      const json = await res.json();
      if (json.success) setPendingAdmissions(json.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("lms_auth") === "true";
    const role = localStorage.getItem("lms_user_role");
    const uid = localStorage.getItem("lms_user_id");

    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/apply") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/change-password");

    if (auth) {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserId(uid);

      if (role === "student") {
        const studentStr = localStorage.getItem("lms_student_info");
        const hasStudentInfo = studentStr && studentStr !== "undefined" && studentStr !== "null";

        const lmsToken = localStorage.getItem("lms_token");
        if (!hasStudentInfo && uid) {
          fetch(`${API_BASE_URL}/api/students/profile?userId=${uid}`, {
            headers: {
              "Authorization": lmsToken ? `Bearer ${lmsToken}` : ""
            }
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.data) {
                localStorage.setItem("lms_student_info", JSON.stringify(res.data));
                window.location.reload();
              } else {
                toast.error("Profile invalid. Re-login.");
                localStorage.clear();
                router.push("/");
              }
            })
            .catch(() => {});
        } else if (hasStudentInfo) {
          try {
            const student = JSON.parse(studentStr);
            setDisplayName(`${student.first_name || ""} ${student.last_name || ""}`.trim());
            setAvatarUrl(student.avatar_url || null);
            const isComplete =
              student.first_name?.trim() &&
              student.last_name?.trim() &&
              student.whatsapp?.trim() &&
              student.cnic?.trim() &&
              student.university?.trim() &&
              student.semester;
            setProfileIncomplete(!isComplete);
          } catch {}
        }

        if (!pathname.startsWith("/student/") && !pathname.startsWith("/dashboard/leaderboard") && !isPublicRoute && pathname !== "/change-password") {
          router.push("/student/dashboard");
          return;
        }
      } else if (role === "trainer") {
        setProfileIncomplete(false);
        const lmsToken = localStorage.getItem("lms_token");
        if (uid) {
          fetch(`${API_BASE_URL}/api/trainers/profile?userId=${uid}`, {
            headers: {
              "Authorization": lmsToken ? `Bearer ${lmsToken}` : ""
            }
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.data) {
                setDisplayName(`${res.data.first_name || ""} ${res.data.last_name || ""}`.trim());
                setAvatarUrl(res.data.avatar_url || null);
              }
            })
            .catch(() => {});
        }
        if (!pathname.startsWith("/trainer/") && !pathname.startsWith("/tasks") && !pathname.startsWith("/dashboard/campaigns") && !pathname.startsWith("/dashboard/leads") && !pathname.startsWith("/dashboard/leaderboard") && !isPublicRoute && pathname !== "/change-password") {
          router.push("/trainer/dashboard");
          return;
        }
      } else {
        setProfileIncomplete(false);
        setDisplayName("Admin");
        if (pathname.startsWith("/student/") || pathname.startsWith("/trainer/")) {
          router.push("/dashboard");
          return;
        }
        fetchPendingCount();
      }

      if (pathname === "/") {
        if (role === "student") router.push("/student/dashboard");
        else if (role === "trainer") router.push("/trainer/dashboard");
        else router.push("/dashboard");
        return;
      }
      setIsCheckingAuth(false);
    } else {
      setProfileIncomplete(false);
      if (!isPublicRoute) {
        toast.error("Please sign in to access the portal.");
        router.push("/");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [pathname, router, fetchPendingCount]);

  useEffect(() => {
    if (!userId || !isAuthenticated) return;
    const interval = setInterval(() => {
      if (userRole === "admin") fetchPendingCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, isAuthenticated, userRole, fetchPendingCount]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.clear();
    toast.success("Logged out successfully.");
    router.push("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-[#FAFAFA] flex flex-col items-center justify-center z-50">
        <div className="relative mb-6">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/change-password");

  if (isPublicRoute) return <>{children}</>;

  const renderSidebar = () => {
    if (userRole === "student") {
      return (
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          <NavSection label="Main" />
          <NavLink href="/student/dashboard" icon="home" label="Overview" active={pathname === "/student/dashboard"} onClick={closeMobile} />
          <NavSection label="Learning" />
          <NavLink href="/student/campaigns" icon="radar" label="Campaigns" active={pathname.startsWith("/student/campaigns")} onClick={closeMobile} />
          <NavLink href="/student/tasks" icon="assignment" label="Tasks" active={pathname === "/student/tasks"} onClick={closeMobile} />
          <NavLink href="/student/submit-task" icon="upload" label="Submit Task" active={pathname === "/student/submit-task"} onClick={closeMobile} />
          <NavLink href="/dashboard/leaderboard" icon="leaderboard" label="Leaderboard" active={pathname === "/dashboard/leaderboard"} onClick={closeMobile} />
          <NavSection label="Account" />
          <NavLink href="/student/attendance" icon="calendar_today" label="Attendance" active={pathname === "/student/attendance"} onClick={closeMobile} />
          <NavLink href="/student/fees" icon="payments" label="Fee Status" active={pathname === "/student/fees"} onClick={closeMobile} />
          <NavLink href="/student/profile" icon="person" label="My Profile" active={pathname === "/student/profile"} onClick={closeMobile} />
          <NavLink href="/student/announcements" icon="campaign" label="Announcements" active={pathname === "/student/announcements"} onClick={closeMobile} />
        </nav>
      );
    }
    if (userRole === "trainer") {
      return (
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          <NavSection label="Overview" />
          <NavLink href="/trainer/dashboard" icon="home" label="Overview" active={pathname === "/trainer/dashboard"} onClick={closeMobile} />
          <NavSection label="Business & Tasks" />
          <NavLink href="/dashboard/campaigns" icon="radar" label="Lead Campaigns" active={pathname.startsWith("/dashboard/campaigns")} onClick={closeMobile} />
          <NavLink href="/dashboard/leads" icon="fact_check" label="Review Leads" active={pathname.startsWith("/dashboard/leads")} onClick={closeMobile} />
          <NavLink href="/dashboard/leaderboard" icon="leaderboard" label="Leaderboard" active={pathname === "/dashboard/leaderboard"} onClick={closeMobile} />
          <NavLink href="/tasks/new" icon="add_task" label="Assign Task" active={pathname === "/tasks/new"} onClick={closeMobile} />
          <NavLink href="/trainer/submitted-tasks" icon="inbox" label="Submitted Tasks" active={pathname === "/trainer/submitted-tasks"} onClick={closeMobile} />
          <NavSection label="Management" />
          <NavLink href="/trainer/students" icon="group" label="Students" active={pathname === "/trainer/students"} onClick={closeMobile} />
          <NavLink href="/trainer/attendance" icon="event_available" label="Mark Attendance" active={pathname === "/trainer/attendance"} onClick={closeMobile} />
          <NavLink href="/trainer/announcements" icon="campaign" label="Announcements" active={pathname === "/trainer/announcements"} onClick={closeMobile} />
          <NavSection label="Account" />
          <NavLink href="/trainer/profile" icon="person" label="My Profile" active={pathname === "/trainer/profile"} onClick={closeMobile} />
        </nav>
      );
    }
    // Admin
    return (
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-4">
        <NavSection label="Overview" />
        <NavLink href="/dashboard" icon="home" label="Overview" active={pathname === "/dashboard"} onClick={closeMobile} />
        <NavSection label="People" />
        <NavLink href="/students" icon="school" label="Students" active={pathname.startsWith("/students") && !pathname.startsWith("/students/applicants")} onClick={closeMobile} />
        <NavLink href="/dashboard/trainers" icon="badge" label="Trainers" active={pathname === "/dashboard/trainers"} onClick={closeMobile} />
        <NavLink href="/students/applicants" icon="how_to_reg" label="Admissions" active={pathname === "/students/applicants"} badge={pendingAdmissions} onClick={closeMobile} />
        <NavSection label="Business & Content" />
        <NavLink href="/dashboard/campaigns" icon="radar" label="Campaigns" active={pathname.startsWith("/dashboard/campaigns")} onClick={closeMobile} />
        <NavLink href="/dashboard/leads" icon="fact_check" label="Leads" active={pathname.startsWith("/dashboard/leads")} onClick={closeMobile} />
        <NavLink href="/dashboard/leaderboard" icon="leaderboard" label="Leaderboard" active={pathname === "/dashboard/leaderboard"} onClick={closeMobile} />
        <NavLink href="/tasks/new" icon="add_task" label="Tasks" active={pathname === "/tasks/new"} onClick={closeMobile} />
        <NavLink href="/tasks/completed" icon="task_alt" label="Submissions" active={pathname === "/tasks/completed"} onClick={closeMobile} />
        <NavSection label="Finance" />
        <NavLink href="/dashboard/fees" icon="account_balance_wallet" label="Fees" active={pathname === "/dashboard/fees"} onClick={closeMobile} />
        <NavSection label="Analytics" />
        <NavLink href="/dashboard/reports" icon="bar_chart" label="Reports" active={pathname === "/dashboard/reports"} onClick={closeMobile} />
        <NavLink href="/dashboard/announcements" icon="campaign" label="Announcements" active={pathname === "/dashboard/announcements"} onClick={closeMobile} />
        <NavSection label="System" />
        <NavLink href="/dashboard/settings" icon="settings" label="Settings" active={pathname === "/dashboard/settings"} onClick={closeMobile} />
      </nav>
    );
  };

  const roleLabel = userRole === "admin" ? "Administrator" : userRole === "trainer" ? "Trainer" : "Student";
  const homePath = userRole === "student" ? "/student/dashboard" : userRole === "trainer" ? "/trainer/dashboard" : "/dashboard";

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-64 z-40 flex justify-between items-center px-4 md:px-6 h-14 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-gray-500 hover:text-gray-900 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          
          <div className="hidden lg:flex relative">
            <span className="material-symbols-outlined absolute left-3 top-1.5 text-gray-400 text-[18px]">search</span>
            <input
              className="bg-gray-100 border border-transparent text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 rounded-lg pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none transition-all"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationCenter />
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</span>
              <span className="text-xs text-gray-500 leading-tight">{roleLabel}</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 md:z-40 transition-transform duration-300 border-r border-slate-800 bg-[#0F172A] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link href={homePath} className="flex items-center gap-2" onClick={closeMobile}>
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">bolt</span>
            </div>
            <span className="text-white font-bold tracking-tight">
              Falcon LMS
            </span>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={closeMobile}>
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="py-4 flex-1 overflow-hidden flex flex-col">
          {renderSidebar()}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="md:ml-64 pt-14 min-h-screen relative z-10 flex flex-col">
        {profileIncomplete && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              <p className="text-sm font-medium text-amber-900">Your profile is incomplete. Please complete it to unlock all features.</p>
            </div>
            <Link
              href="/student/profile"
              className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        )}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </>
  );
}
