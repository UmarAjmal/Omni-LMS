"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/Card";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gray-50">
      <Card className={`w-full max-w-5xl grid lg:grid-cols-2 shadow-xl border-0 overflow-hidden transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        
        {/* Left Side: Branding */}
        <div className="bg-gray-900 p-10 md:p-16 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gray-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-gray-900 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="font-bold text-lg tracking-tight">Falcon LMS</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Enterprise grade<br/>education management.
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              Secure, intelligent, and modern platform for students, trainers, and administrators.
            </p>
          </div>

          <div className="relative z-10 mt-20 grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="block text-gray-300 font-medium mb-1">Infrastructure</span>
              <span className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 99.99% Uptime
              </span>
            </div>
            <div>
              <span className="block text-gray-300 font-medium mb-1">Architecture</span>
              <span className="text-white font-semibold">Secure Cloud</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Options */}
        <div className="bg-white p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Access your learning dashboard securely.</p>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/login/student")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-gray-700" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Student Portal</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Access courses and tasks</p>
                </div>
              </button>

              <button
                onClick={() => router.push("/login/staff")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-gray-700" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Staff Portal</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Admin & trainer access</p>
                </div>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center flex flex-col gap-2">
              <p className="text-sm text-gray-500">
                Are you a new student?{" "}
                <button
                  onClick={() => router.push("/apply")}
                  className="font-medium text-gray-900 hover:underline"
                >
                  Apply now
                </button>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
