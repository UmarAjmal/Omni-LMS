"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface Student {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url?: string;
  email: string;
  phone?: string;
  created_at: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApplicantsCount, setPendingApplicantsCount] = useState(0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Fetch registered students & available courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsRes = await apiClient(`/api/students`);
        const studentsJson = await studentsRes.json();
        if (studentsJson.success) {
          setStudents(studentsJson.data);
          setFilteredStudents(studentsJson.data);
        }

        const coursesRes = await apiClient(`/api/courses`);
        const coursesJson = await coursesRes.json();
        if (coursesJson.success) {
          setAvailableCourses(coursesJson.data);
        }

        const appsRes = await apiClient(`/api/training-applications/count`);
        const appsJson = await appsRes.json();
        if (appsJson.success) {
          setPendingApplicantsCount(appsJson.count);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(() => {
      apiClient(`/api/training-applications/count`)
        .then(r => r.json())
        .then(d => { if (d.success) setPendingApplicantsCount(d.count); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStudentPaymentStatus = (id: number) => {
    const statuses = ["Paid", "Partial", "Unpaid"];
    return statuses[id % statuses.length];
  };

  const getStudentPerformance = (id: number) => {
    const percentage = 50 + (id % 47) + (id % 3 === 0 ? 4 : 0);
    const label = percentage >= 90 ? "Top 5%" : percentage >= 75 ? "Improving" : "At Risk";
    return { percentage, label };
  };

  const getStudentAvatar = (index: number) => {
    const avatars = [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqg6lDqFufGA9x0LwbeSh0Mr3Uc1oXYQlvy_j5H_g9nVnr3W4x8WlfILXtJiBevVZ3_c1aeHNxmCv1LaKbUQNP1E2vI50qJ3TeZ6oUTlm18EGEdmv13wUbgXPk-DYCBIci6nKiOKu2dRfiZ-mPZyFdZ2sVldoSx9CvvMZlXMnfiAJQZKll-Sj53cFwyDU3xbjLh6BzNfsQZCg4p_DQZ6UxBJSRsRMIbvzS2jmxrUioshSTCpE-QH3iJ84-txlAB-KbdxYt992qMT4R",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa0Oqlh4FijmMIUgyEIAjtq6L6al5O1wWksfJDlypBQ5Gt4Y1VIpXxaKypW9f5gx3vUpGRas-T4EQOnI_tOccnQDyQ_cOWzVseRuRM1w7cajgYlskkYBQEXfi-SZDPaeFmVAGA31V1NJhtsXBwWFl_DNVzN1TwWecR7rnowkpkQnXZQ-IYLTpUJeMqmZwIjY-ZPSjolb8f5mu4P_hMT5zIShEnUuP1Z_C9ypdGiQ5iWsmBSvLcHFsDc9ceoCrpe_GPzxEAGXCRbeJZ"
    ];
    return avatars[index % avatars.length];
  };

  useEffect(() => {
    let result = [...students];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.first_name.toLowerCase().includes(q) || 
             s.last_name.toLowerCase().includes(q) || 
             s.email.toLowerCase().includes(q) || 
             s.enrollment_id.toLowerCase().includes(q)
      );
    }

    if (courseFilter) {
      result = result.filter((s) => s.program?.toLowerCase() === courseFilter.toLowerCase());
    }

    if (paymentFilter) {
      result = result.filter((s) => getStudentPaymentStatus(s.id).toLowerCase() === paymentFilter.toLowerCase());
    }

    setFilteredStudents(result);
  }, [searchQuery, courseFilter, paymentFilter, students]);

  const totalCount = students.length;
  const paidCount = students.filter((s) => getStudentPaymentStatus(s.id) === "Paid").length;
  const paidPercentage = students.length ? Math.round((paidCount / students.length) * 100) : 0;

  const handleWhatsAppRedirect = (e: React.MouseEvent, phone: string | undefined) => {
    e.stopPropagation();
    
    if (!phone) {
      toast.warning("No contact number associated with this student.");
      return;
    }

    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "92" + cleanPhone.slice(1);
    if (!cleanPhone.startsWith("92") && cleanPhone.length === 10) cleanPhone = "92" + cleanPhone;

    const deepLink = `whatsapp://send?phone=${cleanPhone}`;
    const webLink = `https://web.whatsapp.com/send?phone=${cleanPhone}`;

    toast.info("Connecting to WhatsApp...", { autoClose: 2000 });

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    setTimeout(() => document.body.removeChild(iframe), 300);

    const start = Date.now();
    const timer = setTimeout(() => {
      if (document.hasFocus() && Date.now() - start < 2000) {
        window.open(webLink, "_blank");
      }
    }, 1500);

    const handleBlur = () => {
      clearTimeout(timer);
      window.removeEventListener("blur", handleBlur);
    };
    window.addEventListener("blur", handleBlur);
  };

  const handleExcelExport = async () => {
    if (filteredStudents.length === 0) {
      toast.warning("No student records available to export.");
      return;
    }

    toast.info("Preparing Excel export...", { autoClose: 1500 });

    try {
      const loadSheetJS = () => {
        return new Promise<void>((resolve, reject) => {
          if ((window as any).XLSX) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load exporter"));
          document.head.appendChild(script);
        });
      };

      await loadSheetJS();
      const XLSX = (window as any).XLSX;

      const worksheetData = filteredStudents.map((s) => ({
        "Enrollment ID": s.enrollment_id,
        "Student Name": `${s.first_name} ${s.last_name}`,
        "Email Address": s.email,
        "Contact Number": s.phone || "N/A",
        "Registered Course / Department": s.program || "General Education",
        "Payment Status": getStudentPaymentStatus(s.id),
        "Performance Grade": `${getStudentPerformance(s.id).percentage}%`,
        "Enrollment Date": new Date(s.created_at).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LMS Enrolled Students");

      const maxColWidths = Object.keys(worksheetData[0]).map((key) => {
        let maxLen = key.length;
        worksheetData.forEach((row: any) => {
          const val = String(row[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 3 };
      });
      worksheet["!cols"] = maxColWidths;

      XLSX.writeFile(workbook, "OmniLearn_Registered_Students.xlsx");
      toast.success("Spreadsheet downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Spreadsheet compilation failed.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Registered Students" 
          description="Manage enrollments and monitor academic progression across the institution." 
        />
        <Button onClick={() => router.push("/students/applicants")} className="shrink-0 relative">
          <span className="material-symbols-outlined mr-2">person_add</span>
          New Applicants
          {pendingApplicantsCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {pendingApplicantsCount > 99 ? "99+" : pendingApplicantsCount}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : totalCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid Status</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : `${paidPercentage}%`}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Grade</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : "A- (3.85)"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[24px]">award_star</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Performers</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : Math.floor(totalCount * 0.05).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full md:w-48 bg-white"
            >
              <option value="">All Programs</option>
              {availableCourses.map((c: any) => (
                <option key={c.id} value={c.title}>{c.title}</option>
              ))}
            </Select>
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full md:w-48 bg-white"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partial Payment</option>
              <option value="Unpaid">Unpaid / Arrears</option>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExcelExport} className="w-full md:w-auto shrink-0 bg-white">
            <span className="material-symbols-outlined mr-2">download</span>
            Export CSV
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <span className="text-gray-500 font-medium">Loading records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-[24px]">search_off</span>
                    </div>
                    <span className="text-gray-500 font-medium">No students found matching your criteria.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, i) => {
                const pStatus = getStudentPaymentStatus(student.id);
                const perf = getStudentPerformance(student.id);
                const avatar = student.avatar_url || getStudentAvatar(i);

                return (
                  <TableRow key={student.id} className="cursor-pointer group hover:bg-gray-50" onClick={() => router.push(`/students/${student.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{student.enrollment_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
                          {student.email}
                        </span>
                        {student.phone && (
                          <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-gray-400">call</span>
                            {student.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{student.program || "General Edu"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={pStatus === "Paid" ? "success" : pStatus === "Partial" ? "warning" : "danger"}
                      >
                        {pStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{perf.percentage}%</span>
                          <span className="text-gray-500">{perf.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${perf.percentage >= 90 ? 'bg-emerald-500' : perf.percentage >= 75 ? 'bg-blue-500' : 'bg-red-500'}`}
                            style={{ width: `${perf.percentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleWhatsAppRedirect(e, student.phone)}
                          className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        </button>
                        <button
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          title="View Profile"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}