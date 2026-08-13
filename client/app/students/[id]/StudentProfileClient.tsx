"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";

export default function StudentProfileClient() {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
          <span className="material-symbols-outlined mr-2">arrow_back</span>
          Back to Students
        </Button>
      </div>

      {/* Hero Profile Section */}
      <Card className="p-8">
        <div className="flex flex-col xl:flex-row items-center gap-10">
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-blue-50 p-1">
              <img alt="Student Avatar" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8kqc_CY9rBUUIOXmsech18JwO9Yp8GNJXEnWYx4jEN6s5Rfu5NACBcBmvklVQXyqz8s6Z4HPWtlSgc5Yuuuw05_soFmu2hwf6tGUIFjxvmAy5kJ-Ih5kHXftBWJXZXtMkxoQeaSg_N84KtrFPFEbfTxy2wKq0A9KzDs-x3lrFYWoO5WsPS5wE-kL9HkAjd8v7aoWJjB2BcbXRHAaiOOUjSuUJCtAvzBSsTwrEeKDxelczkAlxAmXknQ396D4d_EOlo-i5nSisdjiN" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          
          <div className="flex-1 text-center xl:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Adrian Sterling</h2>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center xl:justify-start gap-4 items-center">
              <span className="text-gray-500 font-semibold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                ID: LMN-2024-0891
              </span>
              <span className="h-4 w-[1px] bg-gray-200 hidden sm:block"></span>
              <span className="text-gray-500 font-semibold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                a.sterling@lumina.edu
              </span>
              <Badge variant="primary" className="uppercase tracking-widest text-xs">
                Postgraduate
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto mt-6 xl:mt-0">
            <Button className="w-full sm:w-auto" variant="primary">
              Edit Profile
            </Button>
            <Button className="w-full sm:w-auto" variant="outline">
              <span className="material-symbols-outlined">more_vert</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Financial Overview (8 Columns) */}
        <Card className="lg:col-span-8 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">payments</span>
              Financial Overview
            </h3>
            <Button variant="ghost" size="sm" className="text-blue-600 font-semibold hover:bg-blue-50">
              Download Ledger <span className="material-symbols-outlined ml-2 text-[18px]">download</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Total Fee</p>
              <p className="text-3xl font-bold text-gray-900">$12,450.00</p>
            </div>
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <p className="text-blue-700 font-bold text-xs uppercase tracking-widest mb-2">Paid Amount</p>
              <p className="text-3xl font-bold text-blue-600">$8,200.00</p>
            </div>
            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
              <p className="text-red-700 font-bold text-xs uppercase tracking-widest mb-2">Remaining Balance</p>
              <p className="text-3xl font-bold text-red-600">$4,250.00</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">March 2024</TableCell>
                  <TableCell className="text-gray-500">#INV-882190</TableCell>
                  <TableCell>
                    <Badge variant="success">PAID</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">$2,050.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">February 2024</TableCell>
                  <TableCell className="text-gray-500">#INV-881023</TableCell>
                  <TableCell>
                    <Badge variant="success">PAID</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">$2,050.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">January 2024</TableCell>
                  <TableCell className="text-gray-500">#INV-879812</TableCell>
                  <TableCell>
                    <Badge variant="danger">OVERDUE</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">$2,050.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
        
        {/* Performance Metrics (4 Columns) */}
        <Card className="lg:col-span-4 p-8 flex flex-col items-center text-center">
          <h3 className="font-bold text-xl text-gray-900 mb-8 w-full text-left">Performance</h3>
          
          {/* Radial Attendance Chart */}
          <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-gray-100" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12"></circle>
              <circle className="text-blue-600" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="439.8" strokeDashoffset="43.98" strokeLinecap="round" strokeWidth="12"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-gray-900">90%</p>
              <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mt-1">Attendance</p>
            </div>
          </div>
          
          <div className="w-full space-y-6">
            <div>
              <div className="flex justify-between mb-2 text-xs">
                <span className="font-bold tracking-widest uppercase text-gray-500">Assignment Average</span>
                <span className="font-bold tracking-widest uppercase text-blue-600">88/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-xs">
                <span className="font-bold tracking-widest uppercase text-gray-500">Quiz Score</span>
                <span className="font-bold tracking-widest uppercase text-blue-600">94/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 text-left">
              <p className="font-bold tracking-widest text-[10px] uppercase text-gray-500 mb-1">Overall Progress</p>
              <p className="text-xl font-bold text-blue-600">Advanced Standing</p>
            </div>
          </div>
        </Card>

        {/* Registered Courses (7 Columns) */}
        <Card className="lg:col-span-7 p-6">
          <h3 className="font-bold text-xl text-gray-900 mb-6">Registered Courses</h3>
          <div className="space-y-4">
            {/* Course Card 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors bg-white">
              <div className="w-full sm:w-24 h-32 sm:h-20 rounded-lg overflow-hidden shrink-0">
                <img alt="Course Thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD037haOGu0hcqJQdyxU35wBpjUqrAnxhHCDKXU866GZvwqj1wXFKZr4gJljWui_ezzeFgZF1-JAUkCkUJUSpnz3zR2X_X-2rogfAirmntPfty4pHJU2gzGn7BHiPnDectbj2GWOPLZavfu-onwfiVv8BeWrZgnPOxx2z7So5TEKThn9EyF11telbJKd1YRKO5mrIew0xTlECCbOaOSjPGj-bzNkkieGjK6RisIS_mP9XwIpX4YyIMr3ssaTctRVYm8O_AY09zITQN4" />
              </div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-base text-gray-900 mb-1">Cybersecurity Architectures</h4>
                <p className="text-gray-500 text-xs mb-3">Instructor: Dr. Elias Vance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '75%' }}></div>
                  </div>
                  <span className="font-bold tracking-widest text-[10px] uppercase text-gray-500">75% Complete</span>
                </div>
              </div>
              <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
              </button>
            </div>

            {/* Course Card 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors bg-white">
              <div className="w-full sm:w-24 h-32 sm:h-20 rounded-lg overflow-hidden shrink-0">
                <img alt="Course Thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNZ8hnwOvFbT537kL3RQOL32hBHz97A5HUS4aarhiAWWnNnM80Lnjv0djDSFR8WuwH_bdZfmo5E6fLNgEeN2aeTNX_IsmdW8FEkC2WUVo-9qSDGlCqnv76HI3ve4lkxKQM3cYatiioaE0KrVRS9qFaSQsHcYEGOtFTPOolhZ6eb2BmLpmUJmAeePDdThK-FCxz0bqfOz0WLbv8-1SQl2EJoOmrnEL3HFdVU346KQzf7LzPspXOz7LnETI8UiF5dx5ZVdrtfc8851XG" />
              </div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-base text-gray-900 mb-1">Data Science &amp; Ethics</h4>
                <p className="text-gray-500 text-xs mb-3">Instructor: Prof. Sarah Chen</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '42%' }}></div>
                  </div>
                  <span className="font-bold tracking-widest text-[10px] uppercase text-gray-500">42% Complete</span>
                </div>
              </div>
              <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Personal Information (5 Columns) */}
        <Card className="lg:col-span-5 p-6">
          <h3 className="font-bold text-xl text-gray-900 mb-6">Personal Information</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-1">Full Name</p>
                <p className="text-gray-900 text-sm font-medium">Adrian Sterling</p>
              </div>
              <div>
                <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-1">Date of Birth</p>
                <p className="text-gray-900 text-sm font-medium">Oct 24, 1998</p>
              </div>
            </div>
            <div>
              <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-1">Address</p>
              <p className="text-gray-900 text-sm font-medium leading-relaxed">4221 Kensington Court, West Avenue,<br/>London, SW1W 9TQ, United Kingdom</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-1">Emergency Contact</p>
                <p className="text-gray-900 text-sm font-medium">Elena Sterling (Mother)</p>
              </div>
              <div>
                <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-1">Contact No.</p>
                <p className="text-gray-900 text-sm font-medium">+44 7700 900 121</p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <p className="font-bold tracking-widest text-gray-400 uppercase text-[10px] mb-4">Academic Counselor</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0">
                  <img alt="Counselor" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlvzm5SlM_CMPmrbU6shkje_lhvCFRB4cVHeoTS8kPzZqVGTMS8j09Law8CeO_lnP-NJ7OX0vjKoYAC5Q7nIji9lmZWPV-jVSW_g83Q5lZJLG5DFKptvMgU524WCtJSexDt35j0V65eNRl7KwDdCW2nSYpyfwW-ZmnxamBl3aWRsdhVOtLuKobALUKDkb1tP3EHsa-V3w38Wdbh5fDa3cAGSYlGt4P_T-Ev9bULhlzMSeshiDYpjF750z6doB55c50nIcQRPGcS8yW" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm mb-1">Dr. Linda Hamilton</p>
                  <button className="text-[11px] text-blue-600 font-bold tracking-widest uppercase hover:underline">Schedule a Meeting</button>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
      </div>
    </div>
  );
}
