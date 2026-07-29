"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

const TRACKS = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "devops", label: "DevOps", icon: "cloud_sync" },
  { id: "app-dev", label: "App Development", icon: "phone_android" },
  { id: "web-dev", label: "Web Development", icon: "code" },
];

const DEPARTMENTS = [
  "CS / IT / SE",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Business Administration",
  "Mathematics",
  "Physics",
  "Commerce",
  "Other Department",
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface FormData {
  fullName: string;
  fatherName: string;
  cnic: string;
  age: string;
  whatsapp: string;
  gmail: string;
  universityName: string;
  department: string;
  semester: string;
  tracks: string[];
  referenceCode: string;
  createAccount: boolean;
  password?: string;
  confirmPassword?: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) errors.fullName = "Full name is required.";
  else if (data.fullName.trim().length < 3) errors.fullName = "Must be at least 3 characters.";

  if (!data.fatherName.trim()) errors.fatherName = "Father's name is required.";
  else if (data.fatherName.trim().length < 3) errors.fatherName = "Must be at least 3 characters.";

  const cnicClean = data.cnic.replace(/[-\s]/g, "");
  if (!data.cnic.trim()) errors.cnic = "CNIC number is required.";
  else if (!/^\d{13}$/.test(cnicClean)) errors.cnic = "Enter a valid 13-digit CNIC.";

  if (!data.age.trim()) errors.age = "Age is required.";
  else if (isNaN(Number(data.age)) || Number(data.age) < 16 || Number(data.age) > 40)
    errors.age = "Age must be between 16 and 40.";

  const waNum = data.whatsapp.replace(/[\s+\-()]/g, "");
  if (!data.whatsapp.trim()) errors.whatsapp = "WhatsApp number is required.";
  else if (!/^\d{10,14}$/.test(waNum)) errors.whatsapp = "Enter a valid WhatsApp number.";

  if (!data.gmail.trim()) errors.gmail = "Gmail address is required.";
  else if (!/^[\w.+-]+@(gmail\.com)$/i.test(data.gmail.trim()))
    errors.gmail = "Enter a valid @gmail.com address.";

  if (!data.universityName.trim()) errors.universityName = "University name is required.";
  if (!data.department) errors.department = "Please select your department.";
  if (!data.semester) errors.semester = "Please select your current semester.";

  if (data.tracks.length === 0) errors.tracks = "Please select at least one track.";
  else if (data.tracks.length > 3) errors.tracks = "You can select up to 3 tracks only.";

  if (data.createAccount) {
    if (!data.password || !data.password.trim()) {
      errors.password = "Password is required.";
    } else if (data.password.trim().length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!data.confirmPassword || !data.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (data.confirmPassword.trim() !== data.password?.trim()) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    fatherName: "",
    cnic: "",
    age: "",
    whatsapp: "",
    gmail: "",
    universityName: "",
    department: "",
    semester: "",
    tracks: [],
    referenceCode: "",
    createAccount: true,
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const newErrors = validate(form);
      const filteredErrors: FormErrors = {};
      (Object.keys(touched) as (keyof FormErrors)[]).forEach((key) => {
        if (touched[key] && newErrors[key]) {
          filteredErrors[key] = newErrors[key];
        }
      });
      setErrors(filteredErrors);
    }
  }, [form, touched]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleTrackToggle = (trackId: string) => {
    setTouched((prev) => ({ ...prev, tracks: true }));
    setForm((prev) => {
      const already = prev.tracks.includes(trackId);
      if (already) {
        return { ...prev, tracks: prev.tracks.filter((t) => t !== trackId) };
      }
      if (prev.tracks.length >= 3) return prev;
      return { ...prev, tracks: [...prev.tracks, trackId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      [
        "fullName", "fatherName", "cnic", "age", "whatsapp",
        "gmail", "universityName", "department", "semester", "tracks",
        "password", "confirmPassword",
      ].map((k) => [k, true])
    );
    setTouched(allTouched);

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = document.querySelector('.border-red-500');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiClient(`/api/training-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          fatherName: form.fatherName.trim(),
          cnic: form.cnic.replace(/[-\s]/g, ""),
          age: Number(form.age),
          whatsapp: form.whatsapp.trim(),
          gmail: form.gmail.trim().toLowerCase(),
          universityName: form.universityName.trim(),
          department: form.department,
          semester: Number(form.semester),
          tracks: form.tracks,
          referenceCode: form.referenceCode.trim() || null,
          createAccount: form.createAccount,
          password: form.createAccount ? form.password?.trim() : "",
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        setSubmitError(resJson.error || "Something went wrong while submitting. Please try again.");
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-lg text-center shadow-xl border-0">
          <CardContent className="p-10">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Thank you, <strong className="text-gray-900">{form.fullName}</strong>! Your registration for Falcon Swift Training &amp; Internships has been received. Our team will contact you on WhatsApp within 2–3 business days.
            </p>
            <Button onClick={() => window.location.href = "/"} size="lg" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Training &amp; Internships Registration
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Please fill out this form carefully. All information provided will be used for your official record and cannot be changed later.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto shadow-md border border-gray-200">
        <CardContent className="p-6 sm:p-10">
          {submitError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
              <p className="text-red-800 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Full Name (As per CNIC)</Label>
                  <Input name="fullName" value={form.fullName} onChange={handleChange} onBlur={() => handleBlur("fullName")} error={errors.fullName} />
                </div>
                <div>
                  <Label>Father's Name</Label>
                  <Input name="fatherName" value={form.fatherName} onChange={handleChange} onBlur={() => handleBlur("fatherName")} error={errors.fatherName} />
                </div>
                <div>
                  <Label>CNIC Number</Label>
                  <Input name="cnic" placeholder="e.g. 3610012345678" value={form.cnic} onChange={handleChange} onBlur={() => handleBlur("cnic")} error={errors.cnic} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input name="age" type="number" min="16" max="40" value={form.age} onChange={handleChange} onBlur={() => handleBlur("age")} error={errors.age} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input name="whatsapp" placeholder="e.g. 03001234567" value={form.whatsapp} onChange={handleChange} onBlur={() => handleBlur("whatsapp")} error={errors.whatsapp} />
                </div>
                <div>
                  <Label>Gmail Address</Label>
                  <Input name="gmail" type="email" placeholder="example@gmail.com" value={form.gmail} onChange={handleChange} onBlur={() => handleBlur("gmail")} error={errors.gmail} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>University Name</Label>
                  <Input name="universityName" value={form.universityName} onChange={handleChange} onBlur={() => handleBlur("universityName")} error={errors.universityName} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select name="department" value={form.department} onChange={handleChange} onBlur={() => handleBlur("department")} error={errors.department}>
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Current Semester</Label>
                  <Select name="semester" value={form.semester} onChange={handleChange} onBlur={() => handleBlur("semester")} error={errors.semester}>
                    <option value="" disabled>Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Track Selection</h2>
              <p className="text-sm text-gray-500 mb-4">Select up to 3 tracks you are interested in.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRACKS.map(track => {
                  const selected = form.tracks.includes(track.id);
                  return (
                    <div 
                      key={track.id} 
                      onClick={() => handleTrackToggle(track.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                        {selected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                      </div>
                      <span className="material-symbols-outlined text-gray-500">{track.icon}</span>
                      <span className={`font-medium ${selected ? 'text-gray-900' : 'text-gray-700'}`}>{track.label}</span>
                    </div>
                  );
                })}
              </div>
              {errors.tracks && <p className="mt-2 text-xs text-red-500">{errors.tracks}</p>}
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Account Setup</h2>
              <div className="space-y-6">
                <div>
                  <Label>Reference Code (Optional)</Label>
                  <Input name="referenceCode" placeholder="Enter reference code if any" value={form.referenceCode} onChange={handleChange} />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="createAccount"
                    checked={form.createAccount}
                    onChange={(e) => setForm(p => ({ ...p, createAccount: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="createAccount" className="mb-0 text-base font-semibold">Create LMS Account</Label>
                    <p className="text-xs text-gray-500">You need an account to track your application.</p>
                  </div>
                </div>

                {form.createAccount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gray-200 rounded-xl bg-white">
                    <div>
                      <Label>Password</Label>
                      <Input type="password" name="password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} onBlur={() => handleBlur("password")} error={errors.password} />
                    </div>
                    <div>
                      <Label>Confirm Password</Label>
                      <Input type="password" name="confirmPassword" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} onBlur={() => handleBlur("confirmPassword")} error={errors.confirmPassword} />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="pt-6 border-t border-gray-200">
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Submit Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
