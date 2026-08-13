"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer" },
  { id: "web-dev", label: "Web Development" },
  { id: "app-dev", label: "App Development" },
  { id: "devops", label: "DevOps" },
];

interface Trainer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  phone: string | null;
  avatar_url: string | null;
  email: string;
  assigned_courses: string[] | null;
  created_at: string;
}

export default function AdminTrainersPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/trainers`);
      const json = await res.json();
      if (json.success) setTrainers(json.data || []);
      else toast.error(json.error || "Failed to load trainers.");
    } catch (err) {
      console.error("fetchTrainers error:", err);
      toast.error("Failed to load trainers.");
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchTrainers();
  }, [fetchTrainers, router]);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      toast.error("First name, last name, and email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient(`/api/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, department, assignedCourses: selectedCourses }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Trainer created! Employee ID: ${json.employeeId}`);
        setShowForm(false);
        setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setDepartment(""); setSelectedCourses([]);
        fetchTrainers();
      } else {
        toast.error(json.error || "Failed to create trainer.");
      }
    } catch (err) {
      console.error("handleCreate error:", err);
      toast.error("Network error creating trainer.");
    }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this trainer? This cannot be undone.")) return;
    try {
      const res = await apiClient(`/api/trainers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Trainer deleted."); fetchTrainers(); }
      else toast.error(json.error || "Failed to delete.");
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Network error deleting trainer.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader 
          title="Trainer Management" 
          description={`${trainers.length} trainers enrolled`}
          icon="badge"
        />
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "primary"}
        >
          <span className="material-symbols-outlined mr-2">{showForm ? "close" : "person_add"}</span>
          {showForm ? "Cancel" : "Add Trainer"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 shadow-md">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">person_add</span>
            <h2 className="text-base font-bold text-blue-900">Create Trainer Account</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[
                { label: "First Name *", value: firstName, setter: setFirstName, placeholder: "John" },
                { label: "Last Name *", value: lastName, setter: setLastName, placeholder: "Doe" },
                { label: "Email *", value: email, setter: setEmail, placeholder: "trainer@example.com" },
                { label: "Phone", value: phone, setter: setPhone, placeholder: "+92 300 0000000" },
                { label: "Department", value: department, setter: setDepartment, placeholder: "Engineering" },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <Label className="mb-2 block text-xs tracking-widest uppercase text-gray-500">{label}</Label>
                  <Input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            
            <div className="mb-6">
              <Label className="mb-3 block text-xs tracking-widest uppercase text-gray-500">Assigned Courses</Label>
              <div className="flex gap-2 flex-wrap">
                {COURSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleCourse(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      selectedCourses.includes(c.id)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-700">A temporary password <strong>FalconSwift@123</strong> will be generated. The trainer will receive login credentials via email.</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {!isSubmitting && <span className="material-symbols-outlined mr-2">person_add</span>}
                Create Trainer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-2xl border border-gray-200">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading trainers...</p>
        </div>
      ) : trainers.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">badge</span>
            </div>
            <p className="text-gray-500 font-medium mb-4">No trainers enrolled yet</p>
            {!showForm && (
              <Button variant="outline" onClick={() => setShowForm(true)}>
                Add your first trainer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((trainer) => (
                <TableRow key={trainer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                        {trainer.avatar_url ? (
                          <img src={trainer.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-gray-500 font-bold">{(trainer.first_name || "?")[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{trainer.first_name} {trainer.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{trainer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {trainer.department || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-blue-600">{trainer.employee_id || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(trainer.assigned_courses || []).slice(0, 2).map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                      {(trainer.assigned_courses || []).length > 2 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{(trainer.assigned_courses || []).length - 2}
                        </Badge>
                      )}
                      {!trainer.assigned_courses?.length && <span className="text-gray-400 text-xs italic">None</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(trainer.id)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
