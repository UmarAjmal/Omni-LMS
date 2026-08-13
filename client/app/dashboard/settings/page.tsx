"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    pushEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
    categories: {
      assignment: true,
      announcement: true,
      lead: true,
      system: true
    },
    smtp: { host: "", port: "", user: "", pass: "" },
    firebase: { apiKey: "", projectId: "" }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setSettings((prev: any) => ({ ...prev, ...json.data }));
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiClient("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ settings })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings: " + json.error);
      }
    } catch (err) {
      toast.error("An error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryToggle = (cat: string) => {
    setSettings((prev: any) => ({
      ...prev,
      categories: { ...prev.categories, [cat]: !prev.categories[cat] }
    }));
  };

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({
      ...prev,
      smtp: { ...prev.smtp, [name]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Notification Settings" 
          description="Manage global notification channels, SMTP configuration, and category preferences." 
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Channels</CardTitle>
            <CardDescription>Enable or disable notification channels globally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'inAppEnabled', label: 'In-App Notifications', desc: 'Show notifications in the web dashboard bell menu.' },
              { id: 'emailEnabled', label: 'Email Notifications', desc: 'Send emails via the background SMTP queue.' },
              { id: 'pushEnabled', label: 'Push Notifications', desc: 'Send native FCM push notifications to devices.' },
            ].map(channel => (
              <div key={channel.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-bold text-gray-900">{channel.label}</p>
                  <p className="text-xs text-gray-500">{channel.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings[channel.id]} onChange={() => handleToggle(channel.id)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Categories</CardTitle>
            <CardDescription>Select which events trigger notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(settings.categories).map((cat) => (
              <div key={cat} className="flex items-center gap-3 p-2">
                <input
                  type="checkbox"
                  id={`cat-${cat}`}
                  checked={settings.categories[cat]}
                  onChange={() => handleCategoryToggle(cat)}
                  className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor={`cat-${cat}`} className="text-sm font-medium text-gray-700 capitalize cursor-pointer">
                  {cat.replace('_', ' ')} Notifications
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>
              Fallback SMTP configuration. Environment variables in the server \`.env\` file will take precedence over these settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Host</label>
                <input
                  type="text"
                  name="host"
                  value={settings.smtp?.host || ""}
                  onChange={handleSmtpChange}
                  placeholder="smtp.gmail.com"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Port</label>
                <input
                  type="text"
                  name="port"
                  value={settings.smtp?.port || ""}
                  onChange={handleSmtpChange}
                  placeholder="587"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Username</label>
                <input
                  type="text"
                  name="user"
                  value={settings.smtp?.user || ""}
                  onChange={handleSmtpChange}
                  placeholder="you@gmail.com"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Password</label>
                <input
                  type="password"
                  name="pass"
                  value={settings.smtp?.pass || ""}
                  onChange={handleSmtpChange}
                  placeholder="App Password"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
