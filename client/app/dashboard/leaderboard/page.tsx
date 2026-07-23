"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

interface LeaderboardEntry {
  student_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  total_points: number;
  approved_leads: number;
  rejected_leads: number;
  total_submissions: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);

  // View state
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    setUserRole(role);
    
    if (role === "student") {
      try {
        const studentInfoStr = localStorage.getItem("lms_student_info");
        if (studentInfoStr) {
          const info = JSON.parse(studentInfoStr);
          setStudentId(info.id);
        }
      } catch (e) {
        console.error("Failed to parse student info", e);
      }
    }
    
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient("/api/reports/leaderboard");
      const json = await res.json();
      if (json.success) {
        setLeaderboard(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const studentIndex = leaderboard.findIndex(e => e.student_id === studentId);
  const myStats = studentIndex !== -1 ? leaderboard[studentIndex] : null;
  const myRank = studentIndex !== -1 ? studentIndex + 1 : null;

  const displayLimit = showAll ? leaderboard.length : 10;
  const displayedLeaderboard = leaderboard.slice(0, displayLimit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="Hunters Leaderboard" 
          description="Top performing students based on approved leads and awarded points." 
          icon="social_leaderboard"
        />
        
        {(userRole === "admin" || userRole === "trainer") && leaderboard.length > 10 && (
          <Button variant="outline" onClick={() => setShowAll(!showAll)} className="shrink-0 mt-8 md:mt-0">
            <span className="material-symbols-outlined mr-2">
              {showAll ? 'expand_less' : 'expand_more'}
            </span>
            {showAll ? 'Show Top 10 Only' : 'View All Rankings'}
          </Button>
        )}
      </div>

      {userRole === "student" && myStats && (
        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-0 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <CardContent className="p-8 relative z-10">
            <h2 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person</span>
              My Performance
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Current Rank</div>
                <div className="text-4xl font-black text-white">#{myRank}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Total Points</div>
                <div className="text-4xl font-black text-amber-400">{myStats.total_points}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Approved Leads</div>
                <div className="text-4xl font-black text-emerald-400">{myStats.approved_leads}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Total Leads</div>
                <div className="text-4xl font-black text-white">{myStats.total_submissions}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-2 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-gray-500">Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
                <span className="material-symbols-outlined text-[32px]">emoji_events</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Rankings Yet</h3>
              <p className="text-sm text-gray-500">The leaderboard will populate once leads are approved and points are awarded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLeaderboard.map((entry, index) => {
                const isMe = userRole === "student" && entry.student_id === studentId;
                
                return (
                  <div 
                    key={entry.student_id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                      isMe ? 'bg-blue-50 border-blue-200 shadow-sm relative overflow-hidden' :
                      index === 0 ? 'bg-gradient-to-r from-amber-50/50 to-transparent border-amber-200 shadow-sm' : 
                      index === 1 ? 'bg-gray-50 border-gray-200' : 
                      index === 2 ? 'bg-orange-50/30 border-orange-200' : 
                      'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {isMe && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                    )}
                    
                    <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-xl ${
                        index === 0 && !isMe ? 'bg-amber-100 text-amber-600 border border-amber-200' : 
                        index === 1 && !isMe ? 'bg-gray-200 text-gray-700 border border-gray-300' : 
                        index === 2 && !isMe ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                        isMe ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-gray-50 text-gray-500 border border-gray-100'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className={`font-bold text-lg flex items-center gap-2 ${
                          index === 0 && !isMe ? 'text-amber-700' : 
                          isMe ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {entry.first_name} {entry.last_name}
                          {isMe && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-md">You</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-500 font-mono mt-0.5">{entry.enrollment_id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 sm:gap-10 sm:text-right ml-16 sm:ml-0">
                      <div className="hidden md:block text-left sm:text-right">
                        <div className="text-sm font-bold text-emerald-600">{entry.approved_leads} Approved</div>
                        <div className="text-xs font-medium text-gray-400 mt-1">{entry.total_submissions} Total Submissions</div>
                      </div>
                      <div className="min-w-[100px] bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                        <div className={`font-black text-3xl leading-none ${
                          index === 0 && !isMe ? 'text-amber-500' : 
                          isMe ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {entry.total_points}
                        </div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-1">Points</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
