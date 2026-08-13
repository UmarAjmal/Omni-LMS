"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";
import { toast } from "react-toastify";

import { requestNotificationPermission } from "@/lib/fcm";

export interface Notification {
  id: number;
  type: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  action_url: string;
  created_at: string;
  is_read: boolean;
  recipient_id: number;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ["All", "Assignment", "Announcement", "Lead Campaign", "Lead Approved", "Lead Rejected", "System"];

  const fetchNotifications = async (reset = false, targetCategory = category, targetPage = page) => {
    try {
      const res = await apiClient(`/api/notifications?page=${targetPage}&limit=10&category=${targetCategory}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => reset ? json.data : [...prev, ...json.data]);
        setUnreadCount(json.unreadCount);
        setHasMore(json.data.length === 10);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications(true, category, 1);
  }, [category]);

  // FCM listener for real-time updates without polling
  useEffect(() => {
    const handleFCM = () => {
      fetchNotifications(true, category, 1);
    };
    window.addEventListener('fcm-message', handleFCM);
    return () => window.removeEventListener('fcm-message', handleFCM);
  }, [category]);

  // Polling only if required (60 seconds) and only when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen && document.visibilityState === 'visible') {
        fetchNotifications(true, category, 1);
      }
    }, 60000);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isOpen) {
        fetchNotifications(true, category, 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen, category]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await apiClient(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient(`/api/notifications/read-all`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await apiClient(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) return;
    try {
      await apiClient(`/api/notifications`, { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            requestNotificationPermission();
            fetchNotifications(true, category, 1);
          }
        }}
        className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
              <button onClick={handleDeleteAll} className="text-xs font-medium text-red-600 hover:text-red-800">
                Clear all
              </button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-gray-100 overflow-x-auto no-scrollbar flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_paused</span>
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((n) => {
                  const NotificationContent = (
                    <div className={`p-3 rounded-lg flex items-start gap-3 transition-colors group ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                          <span className="text-[10px] font-medium text-gray-500 flex-shrink-0">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="inline-block mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{n.category}</span>
                      </div>
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button onClick={(e) => handleMarkRead(n.id, e)} className="text-gray-400 hover:text-blue-600" title="Mark as read">
                            <span className="material-symbols-outlined text-[16px]">done</span>
                          </button>
                        )}
                        <button onClick={(e) => handleDelete(n.id, e)} className="text-gray-400 hover:text-red-600" title="Delete">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );

                  return n.action_url ? (
                    <Link key={n.id} href={n.action_url} onClick={() => { if (!n.is_read) handleMarkRead(n.id, { stopPropagation: () => {}, preventDefault: () => {} } as any); setIsOpen(false); }} className="block">
                      {NotificationContent}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => { if (!n.is_read) handleMarkRead(n.id, { stopPropagation: () => {}, preventDefault: () => {} } as any); }}>
                      {NotificationContent}
                    </div>
                  );
                })}
              </div>
            )}
            
            {hasMore && notifications.length > 0 && (
              <button 
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchNotifications(false, category, nextPage);
                }} 
                className="w-full mt-2 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
