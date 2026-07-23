"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      toast.warning("Please fill in all credential fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiClient(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Invalid student ID or password.");
      } else {
        localStorage.setItem("lms_auth", "true");
        if (json.token) localStorage.setItem("lms_token", json.token);
        localStorage.setItem("lms_user_role", json.user.role);
        localStorage.setItem("lms_user_id", String(json.user.id));

        if (json.user.role === "student") {
          if (json.user.student) {
            localStorage.setItem("lms_student_info", JSON.stringify(json.user.student));
          }
          if (json.user.mustChangePassword) {
            localStorage.setItem("lms_must_change_password", "true");
            toast.error("Please update your default password first.");
            router.push("/change-password");
          } else {
            toast.success("Login successful. Welcome to your Student Portal!");
            router.push("/student/dashboard");
          }
        } else if (json.user.role === "trainer") {
          toast.success("Login successful. Welcome to Trainer Portal!");
          router.push("/trainer/dashboard");
        } else {
          toast.success("Login successful. Welcome back, Administrator!");
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Could not connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className={`w-full max-w-md shadow-xl border-0 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <CardContent className="p-8 md:p-10">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-gray-100 text-gray-900">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Student Portal</h1>
            <p className="text-gray-500 text-sm">Sign in with your student credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <Label htmlFor="student-email">Student ID or Email</Label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                <Input
                  id="student-email"
                  type="text"
                  autoComplete="username"
                  placeholder="student@falconswift.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="student-password" className="mb-0">Password</Label>
                <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                <Input
                  id="student-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Not a student yet?{" "}
              <button
                onClick={() => router.push("/apply")}
                className="font-medium text-gray-900 hover:underline"
              >
                Apply for admission
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
