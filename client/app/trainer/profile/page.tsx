"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function TrainerProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/trainers/profile?userId=${uid}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFirstName(d.first_name || "");
        setLastName(d.last_name || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setDepartment(d.department || "");
        setEmployeeId(d.employee_id || "");
        setAvatarUrl(d.avatar_url || "");
      }
    } catch { toast.error("Failed to load profile."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    const uid = localStorage.getItem("lms_user_id");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    if (uid) { setUserId(uid); fetchProfile(uid); }
  }, [fetchProfile, router]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const res = await apiClient(`/api/trainers/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone, avatarUrl }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(json.error || "Update failed.");
      }
    } catch { toast.error("Network error."); }
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields."); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match."); return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters."); return;
    }
    setIsChangingPassword(true);
    try {
      const res = await apiClient(`/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast.error(json.error || "Password change failed.");
      }
    } catch { toast.error("Network error."); }
    finally { setIsChangingPassword(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="My Profile" 
        description="Manage your trainer account information"
        icon="person"
      />

      {/* Avatar + basic info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="material-symbols-outlined text-blue-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{firstName} {lastName}</p>
              <p className="text-sm text-gray-500">{email}</p>
              <Badge variant="primary" className="mt-2 text-[10px]">TRAINER</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Employee ID</Label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">{employeeId || "—"}</div>
            </div>
            <div>
              <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Department</Label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">{department || "—"}</div>
            </div>
          </div>
          
          {/* Editable fields */}
          <div>
            <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 0000000"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">Avatar URL</Label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
            >
              {!isSaving && <span className="material-symbols-outlined mr-2">save</span>}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
            { label: "New Password", value: newPassword, setter: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <Label className="mb-1 block text-xs tracking-widest text-gray-400 uppercase">{label}</Label>
              <Input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
              />
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              isLoading={isChangingPassword}
            >
              {!isChangingPassword && <span className="material-symbols-outlined mr-2">lock</span>}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
