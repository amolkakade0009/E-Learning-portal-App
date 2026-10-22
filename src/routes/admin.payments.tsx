import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, IndianRupee, FileDown } from "lucide-react";
import { format } from "date-fns";
import { getAllOrders, getApiErrorMessage } from "@/api/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getAllOrders();
        setOrders(data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load orders from server."));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter logic for searching
  const filtered = useMemo(() => {
    return orders.filter(p =>
      q === "" || 
      p.user.name.toLowerCase().includes(q.toLowerCase()) ||
      p.razorpayOrderId?.toLowerCase().includes(q.toLowerCase()) ||
      p.status.toLowerCase().includes(q.toLowerCase())
    );
  }, [orders, q]);

  // Total revenue only from PAID orders
  const totalRevenue = useMemo(() => {
    return filtered
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filtered]);

  return (
    <div className="p-6 sm:p-10 bg-background min-h-screen text-foreground">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Payment Transactions</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Real-time revenue monitoring from student enrollments
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-navy text-white p-6 rounded-2xl shadow-lg border border-navy/20">
          <div className="p-3 bg-white/10 rounded-full">
             <IndianRupee className="h-6 w-6 text-gold" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Search by student name or Order ID..." 
            className="pl-10 h-11 bg-card" 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Student Details</TableHead>
              <TableHead className="font-bold">Razorpay Info</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="text-right font-bold">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gold" />
                  Loading payment logs...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                  {q ? "No payments match your search criteria." : "No transaction history available."}
                </TableCell>
              </TableRow>
            ) : filtered.map(order => (
              <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-xs">
                  <div className="font-bold text-navy">
                    {format(new Date(order.paidAt || order.createdAt), "MMM dd, yyyy")}
                  </div>
                  <div className="text-muted-foreground">
                    {format(new Date(order.paidAt || order.createdAt), "hh:mm a")}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-bold text-sm">{order.user.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {order.user.email}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit mb-1">
                    Order: {order.razorpayOrderId}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    PayID: {order.razorpayPaymentId || "N/A"}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Badge 
                    className={`font-bold border-none px-3 py-1 uppercase text-[10px] tracking-wider rounded-full ${
                      order.status === "PAID" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {order.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <span className={`text-sm font-black ${order.status === 'PAID' ? 'text-navy' : 'text-muted-foreground opacity-50'}`}>
                    ₹{order.amount.toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}