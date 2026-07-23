"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Password changed successfully! Redirecting...");
        localStorage.removeItem("lms_must_change_password");
        const role = localStorage.getItem("lms_user_role");
        setTimeout(() => {
          if (role === "student") router.push("/student/dashboard");
          else if (role === "trainer") router.push("/trainer/dashboard");
          else router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className={`w-full max-w-md shadow-xl border-0 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <CardContent className="p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Change Required</h1>
            <p className="text-gray-500 text-sm">
              For your security, please update your temporary password before accessing the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="e.g. Password@123"
              />
            </div>

            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
