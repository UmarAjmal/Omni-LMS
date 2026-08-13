"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "web-dev", label: "Web Development", icon: "code" },
  { id: "app-dev", label: "App Development", icon: "phone_android" },
  { id: "devops", label: "DevOps", icon: "cloud_sync" },
];

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url?: string;
  email: string;
}

interface ReferenceLink {
  id: string;
  title: string;
  url: string;
}

export default function NewTaskPage() {
  const [selectedCourse, setSelectedCourse] = useState("fullstack-ai");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [points, setPoints] = useState("100");
  const [dueDate, setDueDate] = useState("");
  
  // Reference Links
  const [links, setLinks] = useState<ReferenceLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Students list
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  // Rich Text Editor states / mock helpers
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);


  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const res = await apiClient(`/api/students`);
        const json = await res.json();
        if (json.success) {
          setStudents(json.data);
        } else {
          toast.error("Failed to load students registry.");
        }
      } catch (err) {
        console.error("Error loading students:", err);
        toast.error("Network error while loading students.");
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  // Filter students based on selected course & search query
  const filteredStudents = students.filter((s) => {
    // Map program tags to match course id
    const studentProgram = (s.program || "").toLowerCase().trim();
    const matchesCourse = studentProgram === selectedCourse || 
      (selectedCourse === "fullstack-ai" && studentProgram.includes("ai")) ||
      (selectedCourse === "web-dev" && studentProgram.includes("web")) ||
      (selectedCourse === "app-dev" && studentProgram.includes("app")) ||
      (selectedCourse === "devops" && studentProgram.includes("devops"));

    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(studentSearch.toLowerCase()) || 
      s.enrollment_id?.toLowerCase().includes(studentSearch.toLowerCase());

    return matchesCourse && matchesSearch;
  });

  // Handle Add Link
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.warning("Please provide both reference title and URL.");
      return;
    }
    
    // Simple validation for URL format
    if (!newLinkUrl.startsWith("http://") && !newLinkUrl.startsWith("https://")) {
      toast.warning("URL must start with http:// or https://");
      return;
    }

    const newLink: ReferenceLink = {
      id: Date.now().toString(),
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
    };

    setLinks([...links, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    toast.success("Reference link attached successfully.");
  };

  // Handle Remove Link
  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
    toast.info("Reference link detached.");
  };

  // Handle Student Selection
  const handleToggleStudent = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Handle Select All Students
  const handleSelectAll = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      // Unselect all currently visible
      setSelectedStudentIds(selectedStudentIds.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all currently visible (union)
      const newSelections = Array.from(new Set([...selectedStudentIds, ...visibleIds]));
      setSelectedStudentIds(newSelections);
    }
  };

  // Assign Task
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      toast.error("Task title cannot be blank.");
      return;
    }

    if (!taskContent.trim()) {
      toast.error("Please compose some guidelines or instructions in the text area.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to assign this task.");
      return;
    }

    const course = COURSES.find(c => c.id === selectedCourse);
    setIsSubmittingTask(true);
    try {
      const res = await apiClient(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskContent,
          courseId: selectedCourse,
          courseLabel: course?.label || selectedCourse,
          points: Number(points) || 100,
          dueDate: dueDate || null,
          referenceLinks: links.map(l => ({ title: l.title, url: l.url })),
          assignedStudentIds: selectedStudentIds,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to create task.");
      } else {
        toast.success(`🎉 Task assigned to ${selectedStudentIds.length} student(s)!`);
        setTaskTitle("");
        setTaskContent("");
        setLinks([]);
        setSelectedStudentIds([]);
        setDueDate("");
        setPoints("100");
      }
    } catch {
      toast.error("Network error. Could not reach the server.");
    } finally {
      setIsSubmittingTask(false);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="New Task Creator" 
        description="Design course milestones, set goals and assign objectives to registered students." 
      />

      <Card>
        <CardContent className="p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Select Targeted Course
          </label>
          <div className="flex flex-wrap gap-3">
            {COURSES.map((course) => {
              const isActive = selectedCourse === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setSelectedStudentIds([]); // Clear selection when course changes
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{course.icon}</span>
                  {course.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Form & Text Area (7 cols on large) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleAssignTask} className="space-y-6">
                
                {/* Task Title */}
                <div>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">
                    Task Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Building a REST API in Node.js"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Office Word Style Editor Container */}
                <div>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">
                    Task Description & Requirements <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* Editor ToolBar */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 border-b-0 rounded-t-xl px-3 py-2 text-gray-500">
                    <button
                      type="button"
                      onClick={() => setIsBold(!isBold)}
                      className={`p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors ${isBold ? "text-blue-600 bg-blue-50" : ""}`}
                      title="Bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsItalic(!isItalic)}
                      className={`p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors ${isItalic ? "text-blue-600 bg-blue-50" : ""}`}
                      title="Italic"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_italic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCode(!isCode)}
                      className={`p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors ${isCode ? "text-blue-600 bg-blue-50" : ""}`}
                      title="Code Block"
                    >
                      <span className="material-symbols-outlined text-[18px]">code</span>
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n- ")}
                      className="p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      title="Bullet List"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n1. ")}
                      className="p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      title="Numbered List"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n> ")}
                      className="p-1.5 rounded flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      title="Quote"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_quote</span>
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskContent("");
                        toast.info("Content cleared.");
                      }}
                      className="p-1.5 rounded flex items-center justify-center ml-auto hover:bg-red-50 hover:text-red-600 transition-colors text-gray-400"
                      title="Clear Content"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    placeholder="Writie task objectives, description, guidelines, and expectations here..."
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    rows={8}
                    style={{
                      fontWeight: isBold ? "bold" : "normal",
                      fontStyle: isItalic ? "italic" : "normal",
                      fontFamily: isCode ? "monospace" : "inherit"
                    }}
                    className="w-full bg-white border border-gray-200 rounded-b-xl p-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors resize-y min-h-[150px]"
                    required
                  />
                </div>

                {/* Additional Settings (XP, Due Date) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">
                      Milestone Reward (XP / Points)
                    </Label>
                    <Input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">
                      Submission Deadline
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dynamic Reference Links Builder */}
                <div className="pt-6 border-t border-gray-100">
                  <Label className="mb-3 block text-xs tracking-widest uppercase text-gray-500">
                    Reference Materials & Links
                  </Label>
                  
                  {/* Link Inputs */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Input
                      type="text"
                      placeholder="Resource Title (e.g. Git Cheatsheet)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddLink}
                      className="shrink-0"
                    >
                      <span className="material-symbols-outlined mr-2">add</span>
                      Add Link
                    </Button>
                  </div>

                  {/* Links List */}
                  {links.length > 0 && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3 truncate min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0">link</span>
                            <span className="font-semibold text-gray-900 truncate">{link.title}</span>
                            <span className="text-xs text-gray-400 truncate">({link.url})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(link.id)}
                            className="text-gray-400 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-gray-100">
                  <Button
                    type="submit"
                    disabled={isSubmittingTask}
                    isLoading={isSubmittingTask}
                    className="w-full text-base py-6"
                  >
                    {!isSubmittingTask && <span className="material-symbols-outlined mr-2">assignment_turned_in</span>}
                    Assign Task to Candidates ({selectedStudentIds.length})
                  </Button>
                </div>

              </form>

            </CardContent>
          </Card>
        </div>

        {/* Right Column - Student Selectors (5 cols on large) */}
        <div className="lg:col-span-5">
          <Card className="flex flex-col h-full min-h-[600px] max-h-[800px]">
            <CardHeader className="pb-4">
              <CardTitle>Target Candidates</CardTitle>
              <CardDescription>Select enrolled students from this program to assign this task.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0">
              {/* Student Search & Select All Actions */}
              <div className="flex gap-3 mb-4 items-center shrink-0">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search candidate name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    search
                  </span>
                </div>
                {filteredStudents.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="shrink-0"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">
                      {filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? "deselect" : "select_all"}
                    </span>
                    {filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? "Deselect" : "Select All"}
                  </Button>
                )}
              </div>

              {/* Students List Container */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4">
                {isLoadingStudents ? (
                  <div className="text-center py-20">
                    <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Loading program students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <span className="material-symbols-outlined text-gray-400 text-4xl mb-3 block">
                      group_off
                    </span>
                    <p className="text-gray-500 font-medium text-sm">No students found matching current criteria.</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isChecked = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isChecked
                            ? "bg-blue-50/50 border-blue-500"
                            : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isChecked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>
                          {isChecked && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                        </div>

                        {/* Student Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            alt={`${student.first_name} avatar`}
                            className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0"
                            src={student.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"}
                          />
                          <div className="truncate">
                            <p className="text-gray-900 font-bold text-sm truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                              ID: {student.enrollment_id || "N/A"}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-600 shrink-0">
                          {student.program || "Course"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selection Summary Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 shrink-0">
                <span>Enrolled: <strong className="text-gray-900">{filteredStudents.length}</strong></span>
                <span>Selected: <strong className="text-blue-600 text-base">{selectedStudentIds.length}</strong></span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
