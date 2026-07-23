"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DragDropUploader from "@/components/DragDropUploader";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const TRACKS = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer" },
  { id: "devops", label: "DevOps" },
  { id: "app-dev", label: "App Development" },
  { id: "web-dev", label: "Web Development" }
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  
  // Compulsory Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnic, setCnic] = useState("");
  const [university, setUniversity] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [program, setProgram] = useState("fullstack-ai");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Computer Science Social Handles
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const [enrollmentId, setEnrollmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/profile?userId=${uid}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFirstName(d.first_name || "");
        setLastName(d.last_name || "");
        setWhatsapp(d.whatsapp || "");
        setCnic(d.cnic || "");
        setUniversity(d.university || "");
        setSemester(d.semester ? String(d.semester) : "");
        setProgram(d.program || "fullstack-ai");
        setAvatarUrl(d.avatar_url || "");
        setLinkedinUrl(d.linkedin_url || "");
        setGithubUrl(d.github_url || "");
        setPortfolioUrl(d.portfolio_url || "");
        setResumeUrl(d.resume_url || "");
        setEnrollmentId(d.enrollment_id || "");

        // Synchronize local storage to resolve warning banners immediately
        localStorage.setItem("lms_student_info", JSON.stringify(d));
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      toast.error("Could not fetch profile from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem("lms_user_id");
    const handleLogout = () => {
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_auth");
      localStorage.removeItem("lms_user_role");
      localStorage.removeItem("lms_user_id");
      localStorage.removeItem("lms_student_info");
      router.push("/");
    };

    if (!uid) {
      toast.error("User session details missing. Please re-login.");
      handleLogout();
      return;
    }
    setUserId(uid);
    fetchProfile(uid);
  }, [router, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !whatsapp.trim() || !cnic.trim() || !university.trim() || !semester) {
      toast.error("All compulsory profile fields (*) must be provided.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient(`/api/students/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          whatsapp: whatsapp.trim(),
          cnic: cnic.trim(),
          university: university.trim(),
          semester: Number(semester),
          avatarUrl: avatarUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          githubUrl: githubUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
          resumeUrl: resumeUrl.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update profile.");
      } else {
        toast.success("🎉 Profile completed and updated successfully!");
        localStorage.setItem("lms_student_info", JSON.stringify(json.data));
        // Force reload page to update warning banner in Navigation
        window.location.reload();
      }
    } catch {
      toast.error("Network error during update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiClient(`/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to change password.");
      } else {
        toast.success("🔑 Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Network error during password change.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      
      <PageHeader 
        title="Onboarding Profile Builder" 
        description="Provide your compulsory verification details and professional links to register your student profile." 
        icon="manage_accounts"
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm font-medium">Loading profile parameters...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Enrollment info (read only) */}
              {enrollmentId && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Assigned Enrollment ID</p>
                    <p className="text-xl font-extrabold text-blue-900 mt-1">{enrollmentId}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-[28px]">verified</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider">Verification details</h3>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Muhammad"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="e.g. Umar"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp & CNIC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">WhatsApp Number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="e.g. 03001234567"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">CNIC (National ID) <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={cnic}
                      onChange={e => setCnic(e.target.value)}
                      placeholder="e.g. 3610212345678"
                      required
                    />
                  </div>
                </div>

                {/* University / Semester */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-2">
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">University / Academic Institution <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      placeholder="e.g. FAST NUCES, Lahore"
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Current Semester <span className="text-red-500">*</span></Label>
                    <select
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="flex h-11 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                      required
                    >
                      <option value="" disabled>Select...</option>
                      {SEMESTERS.map(s => (
                        <option key={s} value={s}>{s} Semester</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider">Professional Handles</h3>
                </div>

                {/* LinkedIn & GitHub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">LinkedIn Profile URL</Label>
                    <Input
                      type="url"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">GitHub Profile URL</Label>
                    <Input
                      type="url"
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                {/* Portfolio & Resume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Portfolio Website URL</Label>
                    <Input
                      type="url"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                      placeholder="https://username.dev"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Resume / CV Link</Label>
                    <Input
                      type="url"
                      value={resumeUrl}
                      onChange={e => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                {/* Enrolled Program (Read Only) & DP Image URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs tracking-widest uppercase text-gray-500">Enrolled Program Track</Label>
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-sm">Admin Locked</span>
                    </div>
                    <select
                      value={program}
                      disabled
                      className="flex h-11 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 shadow-sm disabled:cursor-not-allowed"
                    >
                      {TRACKS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      * Program track transfers can only be processed by LMS Administrators.
                    </p>
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Display Picture (DP) Image</Label>
                    {avatarUrl ? (
                      <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
                        <img src={avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Avatar Uploaded</p>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl("")}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold mt-1 block transition-colors"
                          >
                            Remove &amp; Upload Different
                          </button>
                        </div>
                      </div>
                    ) : (
                      <DragDropUploader
                        onUploadSuccess={(url) => setAvatarUrl(url)}
                        label="Drag &amp; Drop DP or Click to Browse"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="w-full text-base py-6"
                >
                  {!isSubmitting && <span className="material-symbols-outlined mr-2">save</span>}
                  Save &amp; Complete Onboarding Profile
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Change Section */}
      {!isLoading && (
        <Card className="border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-8 py-5 border-b border-amber-100">
            <h3 className="text-base font-extrabold text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined">lock</span>
              Account Security
            </h3>
            <p className="text-amber-700 font-medium mt-1 text-sm">
              If you logged in with a temporary password, please change it immediately.
            </p>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Current Password <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">New Password <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">Confirm New Password <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  isLoading={isChangingPassword}
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  {!isChangingPassword && <span className="material-symbols-outlined mr-2">key</span>}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
