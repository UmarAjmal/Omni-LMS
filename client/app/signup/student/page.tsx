"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function StudentSignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        program: formData.get("department"),
        academic_background: formData.get("university"),
        course_interest: formData.get("interest"),
      };

      const response = await apiClient(`/api/applicants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to submit application");

      toast.success("Application Submitted! Your profile has been received.");
      router.push("/");
    } catch (err) {
      toast.error("An error occurred while submitting your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    preventDefaults(e);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileName(`Selected: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(`Selected: ${e.target.files[0].name}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Student Application
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Submit your details to register and explore opportunities. Our program connects top academic talent with industry-leading education.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto shadow-md border border-gray-200">
        <CardContent className="p-6 sm:p-10">
          <form className="space-y-8" id="internshipForm" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>First Name *</Label>
                  <Input name="firstName" placeholder="John" required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input name="lastName" placeholder="Doe" required />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input name="email" type="email" placeholder="john.doe@example.com" required />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input name="phone" placeholder="+92 300 0000000" required />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Academic Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>University *</Label>
                  <Input name="university" placeholder="Current University" required />
                </div>
                <div>
                  <Label>Department/Program *</Label>
                  <Input name="department" placeholder="e.g. Computer Science" required />
                </div>
                <div className="md:col-span-2">
                  <Label>Area of Interest *</Label>
                  <Input name="interest" placeholder="e.g. AI, Web Development, Cloud" required />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Resume / CV (Optional)</h2>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <span className="material-symbols-outlined text-gray-500 text-xl">upload_file</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PDF, DOC, or DOCX (max. 5MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("resume")?.click()}
                  className="mx-auto"
                >
                  Browse Files
                </Button>
                {fileName && (
                  <p className="text-sm text-blue-600 mt-4 font-medium">{fileName}</p>
                )}
              </div>
            </section>

            <div className="pt-6 border-t border-gray-200 flex gap-4">
              <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Submit Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}