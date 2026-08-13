"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

interface FeePayment {
  id: number;
  amount: string | number;
  payment_method: string;
  transaction_reference?: string;
  receipt_number: string;
  remarks: string;
  payment_date: string;
}

interface FeeData {
  id: number;
  total_fee: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  status: string;
}

export default function StudentFeesPage() {
  const router = useRouter();
  const [fee, setFee] = useState<FeeData | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  const fetchFeeData = useCallback(async (studentId: number) => {
    try {
      const res = await apiClient(`/api/student/${studentId}/fees`);
      const json = await res.json();
      if (json.success) {
        setFee(json.data.fee);
        setPayments(json.data.payments || []);
      } else {
        toast.error(json.error || "Failed to load fee information.");
      }
    } catch {
      toast.error("Failed to load fee information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined" || infoStr === "null") {
      router.push("/login/student");
      return;
    }
    try {
      const student = JSON.parse(infoStr);
      if (student && student.id) {
        setStudentInfo(student);
        fetchFeeData(student.id);
      } else {
        router.push("/login/student");
      }
    } catch {
      router.push("/login/student");
    }
  }, [fetchFeeData, router]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "partial": return "warning";
      case "course_not_assigned": return "destructive";
      case "fee_not_configured": return "destructive";
      default: return "destructive";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Fully Paid";
      case "partial": return "Partially Paid";
      case "course_not_assigned": return "No Course Assigned";
      case "fee_not_configured": return "Fee Not Configured";
      default: return "Unpaid";
    }
  };

  const printReceipt = (payment: FeePayment) => {
    setReceiptToPrint(payment);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading fee information...</p>
      </div>
    );
  }

  const total = Number(fee?.total_fee || 0);
  const paid = Number(fee?.paid_amount || 0);
  const progressPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const statusStr = fee?.status || "unpaid";
  
  // Find last payment date if there are payments
  const lastPayment = payments.length > 0 ? payments[0].payment_date : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

      {/* Print Receipt Section */}
      {receiptToPrint && studentInfo && (
        <div className="receipt-print-area text-black font-sans bg-white p-8 max-w-2xl mx-auto border-2 border-black/10 shadow-none">
          <div className="text-center mb-8 border-b-2 border-black/10 pb-6">
            <h1 className="text-3xl font-extrabold text-black">Falcon Swift</h1>
            <p className="text-sm text-black/60">Enterprise Software House & Academy</p>
            <h2 className="text-xl font-bold mt-4 uppercase tracking-widest text-black/80">Fee Receipt</h2>
          </div>
          
          <div className="flex justify-between mb-8 text-sm">
            <div>
              <p><span className="font-bold">Receipt No:</span> {receiptToPrint.receipt_number}</p>
              <p><span className="font-bold">Date:</span> {new Date(receiptToPrint.payment_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Student:</span> {studentInfo.first_name} {studentInfo.last_name}</p>
              <p><span className="font-bold">Reg No:</span> {studentInfo.enrollment_id || "N/A"}</p>
              <p><span className="font-bold">Course:</span> {studentInfo.program || "N/A"}</p>
            </div>
          </div>
          
          <table className="w-full text-left mb-8 text-sm">
            <thead>
              <tr className="border-y-2 border-black/10">
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
          
          <div className="border-t-2 border-black/10 pt-4 flex justify-between text-xs text-black/60">
            <p>Generated by OmniLearn LMS</p>
            <p>Signature: ______________________</p>
          </div>
        </div>
      )}

      <div className="no-print">
        <PageHeader 
          title="My Fees" 
          description="Track your course fee status and payment history." 
          icon="account_balance_wallet"
        />
      </div>

      {!fee ? (
        <Card className="no-print border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
              <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
            </div>
            <p className="text-gray-500 font-medium text-lg">No fee record found for your account.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 no-print">
          {/* Top Status Card */}
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-0 overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 w-full space-y-4">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Current Status</p>
                <div>
                  <Badge variant={getStatusVariant(statusStr) as any} className="uppercase tracking-wider px-3 py-1">
                    {getStatusLabel(statusStr)}
                  </Badge>
                </div>
                {lastPayment && (
                  <p className="text-sm text-blue-100 font-medium">
                    <span className="text-blue-300 font-semibold mr-2">Last Payment:</span> {new Date(lastPayment).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-around w-full md:w-auto gap-8 sm:gap-12 shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-inner">
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Total Fee</span>
                  <span className="text-2xl font-bold text-white">{fee.total_fee === null ? 'Not Configured' : `Rs. ${fee.total_fee}`}</span>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Paid</span>
                  <span className="text-2xl font-bold text-emerald-400">{fee.paid_amount === null ? '—' : `Rs. ${fee.paid_amount}`}</span>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Remaining</span>
                  <span className="text-2xl font-bold text-red-400">{fee.remaining_amount === null ? '—' : `Rs. ${fee.remaining_amount}`}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fee Progress</span>
                <span className="text-sm font-black text-emerald-600">{Math.round(progressPct)}% Paid</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <span className="material-symbols-outlined text-blue-600">history</span>
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt / Ref</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-gray-600 font-medium">{new Date(p.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="font-bold text-emerald-600">Rs. {p.amount}</TableCell>
                      <TableCell className="text-gray-600">{p.payment_method}</TableCell>
                      <TableCell className="text-gray-500 text-xs font-mono">{p.receipt_number || "—"}</TableCell>
                      <TableCell className="text-blue-600 text-xs italic">{p.remarks || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => printReceipt(p)}
                          title="Download/Print Receipt"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                        No payments recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
