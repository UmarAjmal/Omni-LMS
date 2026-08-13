"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

interface NotificationAnalytics {
  id: number;
  type: string;
  title: string;
  priority: string;
  created_at: string;
  total_recipients: string;
  read_count: string;
  unread_count: string;
  read_percentage: string;
}

export default function NotificationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/api/notifications/analytics");
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data || []);
      } else {
        toast.error(json.error || "Failed to load analytics");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Notification Analytics" 
          description="Monitor acknowledgement rates for dispatched notifications" 
          icon="analytics"
        />
        <Button 
          variant="outline"
          onClick={fetchAnalytics}
          disabled={loading}
          className="shrink-0 mt-8 md:mt-0"
        >
          <span className={`material-symbols-outlined mr-2 ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh Data
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-center">Recipients</TableHead>
              <TableHead className="text-center">Read</TableHead>
              <TableHead className="text-center">Unread</TableHead>
              <TableHead>Ack. Rate</TableHead>
              <TableHead className="text-right">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <span className="text-sm text-gray-500">Loading analytics...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : analytics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                  No notifications dispatched yet.
                </TableCell>
              </TableRow>
            ) : (
              analytics.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-gray-900 max-w-[200px] truncate" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.priority === 'critical' ? (
                      <span className="text-red-600 font-bold text-xs uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Critical
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs uppercase font-medium">Normal</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-gray-600">{item.total_recipients}</TableCell>
                  <TableCell className="text-center font-mono text-emerald-600 font-semibold">{item.read_count}</TableCell>
                  <TableCell className="text-center font-mono text-blue-600 font-semibold">{item.unread_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-gray-100 rounded-full h-2 max-w-[80px]">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${item.read_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-medium text-gray-600">{item.read_percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-500 font-medium whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
