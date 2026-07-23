"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="System Settings" 
        description="Configure your LMS platform." 
        icon="settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "mail", label: "Email Configuration", desc: "Configure SMTP for automated emails", status: "Active" },
          { icon: "lock", label: "Security Settings", desc: "Manage JWT, passwords, and sessions", status: "Secure" },
          { icon: "notifications", label: "Notification Settings", desc: "Control email and in-app notifications", status: "Enabled" },
          { icon: "palette", label: "Branding", desc: "Logo, colors, and platform name", status: "Default" },
          { icon: "storage", label: "Database", desc: "PostgreSQL connection and migrations", status: "Connected" },
          { icon: "backup", label: "Backup & Export", desc: "Export data in CSV or JSON format", status: "Manual" },
        ].map((item) => (
          <Card key={item.label} className="group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-blue-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <Badge variant="success" className="text-[10px] uppercase tracking-wider">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-start">
        <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Configuration Note</h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            Settings panel is configurable. Edit environment variables in <code className="bg-white/60 px-1.5 py-0.5 rounded-md text-blue-900 font-mono text-xs shadow-sm border border-blue-200">.env</code> to update SMTP, JWT secret, and database credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
