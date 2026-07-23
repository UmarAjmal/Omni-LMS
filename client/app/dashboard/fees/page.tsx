"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

interface FeePayment {
  id: number;
  amount: string | number;
  payment_method: string;
  transaction_reference: string;
  receipt_number: string;
  remarks: string;
  payment_date: string;
  recorded_by: number;
}

interface FeeRecord {
  student_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  course: string;
  email: string;
  phone: string;
  fee_status: string;
  total_fee: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  last_payment_date: string | null;
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [filtered, setFiltered] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [activeStudent, setActiveStudent] = useState<FeeRecord | null>(null);
  const [studentPayments, setStudentPayments] = useState<FeePayment[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Form State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/finance/fees`);
      const json = await res.json();
      if (json.success) {
        setFees(json.data || []);
        setFiltered(json.data || []);
      }
    } catch {
      toast.error("Failed to load fees.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  useEffect(() => {
    let temp = fees;
    if (search.trim()) {
      const q = search.toLowerCase();
      temp = temp.filter(f =>
        f.first_name?.toLowerCase().includes(q) ||
        f.last_name?.toLowerCase().includes(q) ||
        f.enrollment_id?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      temp = temp.filter(f => f.fee_status === statusFilter);
    }
    setFiltered(temp);
  }, [search, statusFilter, fees]);

  const openStudentModal = async (student: FeeRecord) => {
    setActiveStudent(student);
    setIsModalLoading(true);
    setStudentPayments([]);
    setPayAmount("");
    setPayMethod("Cash");
    setPayRef("");
    setPayRemarks("");
    try {
      const res = await apiClient(`/api/finance/fees/${student.student_id}`);
      const json = await res.json();
      if (json.success) {
        setStudentPayments(json.data.payments || []);
      }
    } catch {
      toast.error("Failed to load payment history.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const closeStudentModal = () => {
    setActiveStudent(null);
  };

  const handleUpdateTotalFee = async () => {
    if (!activeStudent) return;
    const newTotal = window.prompt("Enter new Total Course Fee for " + activeStudent.first_name + ":", String(activeStudent.total_fee));
    if (newTotal === null) return;
    const num = parseFloat(newTotal);
    if (isNaN(num) || num < 0) {
      toast.error("Invalid total fee entered.");
      return;
    }
    
    setIsUpdatingFee(true);
    try {
      const res = await apiClient(`/api/finance/fees/${activeStudent.student_id}/total`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ totalFee: num })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Total fee updated successfully!");
        setActiveStudent({ ...activeStudent, ...json.data });
        fetchFees();
      } else {
        toast.error(json.error || "Failed to update total fee.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handlePayment = async () => {
    if (!activeStudent) return;
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setIsPaying(true);
    try {
      const res = await apiClient(`/api/finance/fees/${activeStudent.student_id}/pay`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          transactionReference: payRef,
          remarks: payRemarks,
          totalFee: activeStudent.total_fee
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment recorded successfully!");
        fetchFees();
        closeStudentModal();
      } else {
        toast.error(json.error || "Failed to record payment.");
      }
    } catch {
      toast.error("Network error while recording payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Student ID", "First Name", "Last Name", "Enrollment ID", "Course", "Email", "Phone", "Status", "Total Fee", "Paid", "Remaining", "Last Payment"];
    const rows = filtered.map(f => [
      f.student_id, f.first_name, f.last_name, f.enrollment_id, f.course, f.email, f.phone, f.fee_status, f.total_fee, f.paid_amount, f.remaining_amount, f.last_payment_date || "N/A"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Fee_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReceipt = (payment: FeePayment) => {
    setReceiptToPrint(payment);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null);
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "partial": return "primary";
      case "course_not_assigned": return "danger";
      case "fee_not_configured": return "danger";
      default: return "danger";
    }
  };

  const formatStatus = (status: string) => {
    if (status === 'course_not_assigned') return 'No Course';
    if (status === 'fee_not_configured') return 'No Fee';
    if (status === 'unpaid') return 'Unpaid';
    if (status === 'paid') return 'Paid';
    if (status === 'partial') return 'Partial';
    return status;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-area, .receipt-print-area * {
            visibility: visible;
          }
          .receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {receiptToPrint && activeStudent && (
        <div className="receipt-print-area text-black font-sans bg-white p-8 max-w-2xl mx-auto border-2 border-gray-200 shadow-none">
          <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
            <h1 className="text-3xl font-extrabold text-black">Falcon Swift</h1>
            <p className="text-sm text-gray-600">Enterprise Software House & Academy</p>
            <h2 className="text-xl font-bold mt-4 uppercase tracking-widest text-gray-800">Fee Receipt</h2>
          </div>
          
          <div className="flex justify-between mb-8 text-sm">
            <div>
              <p><span className="font-bold">Receipt No:</span> {receiptToPrint.receipt_number}</p>
              <p><span className="font-bold">Date:</span> {new Date(receiptToPrint.payment_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Student:</span> {activeStudent.first_name} {activeStudent.last_name}</p>
              <p><span className="font-bold">Reg No:</span> {activeStudent.enrollment_id}</p>
              <p><span className="font-bold">Course:</span> {activeStudent.course}</p>
            </div>
          </div>
          
          <table className="w-full text-left mb-8 text-sm">
            <thead>
              <tr className="border-y-2 border-gray-200">
                <th className="py-2">Description</th>
                <th className="py-2">Method</th>
                <th className="py-2 text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4">Course Fee Payment</td>
                <td className="py-4">{receiptToPrint.payment_method} {receiptToPrint.transaction_reference ? `(${receiptToPrint.transaction_reference})` : ""}</td>
                <td className="py-4 text-right font-bold text-lg">{receiptToPrint.amount}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="border-t-2 border-gray-200 pt-4 flex justify-between text-xs text-gray-600">
            <p>Generated by OmniLearn LMS</p>
            <p>Signature: ______________________</p>
          </div>
        </div>
      )}

      <div className="no-print">
        <PageHeader 
          title="Fee Management" 
          description="Track payments, manage balances, and record transactions."
        />
      </div>

      <div className="no-print">
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <Input
              type="text"
              placeholder="Search by name, reg #, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </Select>
            <Button onClick={exportCSV} variant="outline" className="shrink-0 w-full md:w-auto">
              <span className="material-symbols-outlined mr-2">download</span>
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 no-print">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <Card className="no-print">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((fee) => (
                <TableRow key={fee.student_id}>
                  <TableCell>
                    <div className="font-bold text-gray-900 text-sm">{fee.first_name} {fee.last_name}</div>
                    <div className="text-gray-500 font-medium text-[11px]">{fee.enrollment_id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-700 font-medium">{fee.email}</div>
                    <div className="text-gray-500 font-medium">{fee.phone || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 font-medium">{fee.course || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(fee.fee_status) as any}>
                      {formatStatus(fee.fee_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-gray-900">{fee.total_fee === null ? '—' : `Rs. ${fee.total_fee}`}</TableCell>
                  <TableCell className="font-bold text-green-600">{fee.paid_amount === null ? '—' : `Rs. ${fee.paid_amount}`}</TableCell>
                  <TableCell className="font-bold text-red-600">{fee.remaining_amount === null ? '—' : `Rs. ${fee.remaining_amount}`}</TableCell>
                  <TableCell className="text-center">
                    <Button 
                      onClick={() => openStudentModal(fee)}
                      variant="outline"
                      size="sm"
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-12 text-center text-gray-500 font-medium">No records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Payment & History Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl relative my-auto max-h-[95vh] flex flex-col border border-gray-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Fee Details: {activeStudent.first_name} {activeStudent.last_name}
                </h3>
                <p className="text-xs font-bold text-blue-600 mt-1">{activeStudent.enrollment_id} • {activeStudent.course}</p>
              </div>
              <button onClick={closeStudentModal} className="text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Left Column - Add Payment */}
              <div className="w-full md:w-1/3 border-r border-gray-100 p-6 overflow-y-auto bg-gray-50/30">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Record Payment</h4>
                
                {activeStudent.fee_status === 'course_not_assigned' || activeStudent.fee_status === 'fee_not_configured' ? (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-red-500 text-3xl mb-3">warning</span>
                    <p className="text-red-700 font-bold text-sm mb-1">{activeStudent.fee_status === 'course_not_assigned' ? 'Course Not Assigned' : 'Fee Not Configured'}</p>
                    <p className="text-red-500 font-medium text-xs">Please assign a total fee before recording payments.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Amount (Rs.)</label>
                      <Input 
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="text-lg font-bold py-3"
                        placeholder="e.g. 5000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Payment Method</label>
                      <Select 
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Credit Card">Credit Card</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Transaction Ref / Cheque #</label>
                      <Input 
                        type="text"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Remarks</label>
                      <textarea 
                        value={payRemarks}
                        onChange={(e) => setPayRemarks(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm font-medium resize-none placeholder-gray-400"
                        placeholder="Any notes..."
                      />
                    </div>

                    <Button 
                      onClick={handlePayment}
                      disabled={isPaying}
                      isLoading={isPaying}
                      className="w-full py-6"
                    >
                      Save Payment
                    </Button>
                    
                    <p className="text-[10px] text-center text-gray-400 font-medium italic mt-2">Receipt number will be auto-generated.</p>
                  </div>
                )}
              </div>

              {/* Right Column - History & Summary */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto flex flex-col gap-6 bg-white">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center relative group">
                    <button 
                      onClick={handleUpdateTotalFee}
                      disabled={isUpdatingFee}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 w-7 h-7 rounded flex items-center justify-center transition-all shadow-sm"
                      title="Edit Total Fee"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fee</span>
                    <span className="text-xl font-black text-gray-900">{activeStudent.total_fee === null ? 'Not Configured' : `Rs. ${activeStudent.total_fee}`}</span>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Paid Amount</span>
                    <span className="text-xl font-black text-green-700">{activeStudent.paid_amount === null ? '—' : `Rs. ${activeStudent.paid_amount}`}</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Remaining</span>
                    <span className="text-xl font-black text-red-600">{activeStudent.remaining_amount === null ? '—' : `Rs. ${activeStudent.remaining_amount}`}</span>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Payment History</h4>
                  </div>
                  <div className="flex-1 overflow-x-auto overflow-y-auto bg-white p-4">
                    {isModalLoading ? (
                      <div className="text-center text-gray-400 text-sm mt-10 font-medium">Loading history...</div>
                    ) : studentPayments.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm mt-10 font-medium">No payments recorded yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {studentPayments.map((p) => (
                          <div key={p.id} className="bg-white border border-gray-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all">
                            <div className="flex-1">
                              <div className="text-base font-black text-green-600 mb-1">Rs. {p.amount}</div>
                              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {new Date(p.payment_date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">payments</span> {p.payment_method}</span>
                              </div>
                              <div className="text-[11px] font-bold text-gray-400 mt-3 flex gap-2 flex-wrap">
                                {p.receipt_number && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Receipt: {p.receipt_number}</span>}
                                {p.transaction_reference && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Ref: {p.transaction_reference}</span>}
                              </div>
                              {p.remarks && <div className="text-[12px] text-blue-600 mt-2 font-medium bg-blue-50/50 p-2 rounded-lg border border-blue-100 inline-block px-3">"{p.remarks}"</div>}
                            </div>
                            <button 
                              onClick={() => printReceipt(p)}
                              className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
                              title="Print Receipt"
                            >
                              <span className="material-symbols-outlined text-lg">print</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
