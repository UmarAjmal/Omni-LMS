"use client";

import { useNotifications } from "@/components/NotificationProvider";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function NotificationCenter() {
  const { notifications, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.is_read);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Notification Center" 
          description="Stay updated with your latest alerts and tasks"
          icon="notifications"
        />
        
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-300 text-4xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">You're all caught up!</h3>
            <p className="text-gray-500 text-sm mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications at the moment.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`group bg-white border ${!n.is_read ? 'border-blue-300 shadow-sm' : 'border-gray-200'} rounded-2xl p-5 hover:border-gray-300 transition-all flex flex-col sm:flex-row gap-4 sm:items-center relative overflow-hidden`}
            >
              {!n.is_read && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600"></div>
              )}
              
              <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${!n.is_read ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {n.type === 'announcement' ? 'campaign' : 
                   n.type === 'assignment' ? 'assignment' : 
                   n.type === 'lead_campaign' ? 'rocket_launch' : 'notifications'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </h3>
                      {n.priority === 'critical' && (
                        <Badge variant="danger" className="text-[10px]">Critical</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block font-medium">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {n.action_url && (
                    <Link href={n.action_url}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  )}
                  {n.attachment_url && (
                    <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">attach_file</span>
                      Attachment
                    </a>
                  )}
                </div>
              </div>
              
              {!n.is_read && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className="sm:opacity-0 group-hover:opacity-100 absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto bg-blue-50 hover:bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  title="Mark as read"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
