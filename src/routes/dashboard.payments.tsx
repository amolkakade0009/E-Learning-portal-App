import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getStudentOrders, getApiErrorMessage } from "@/api/api";
import { Loader2, ReceiptIndianRupee } from "lucide-react";

export const Route = createFileRoute("/dashboard/payments")({ component: MyPayments });

function MyPayments() {
  const { currentUser } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        const data = await getStudentOrders(currentUser.id);
        setOrders(data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load payment history."));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ecfffb]">
            <ReceiptIndianRupee className="h-6 w-6 text-[#20c5b1]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Payment History
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Track all your transaction records and billing information.
            </p>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
        <div className="hidden overflow-x-auto md:block">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-40 font-black text-foreground">Date & Time</TableHead>
              <TableHead className="font-black text-foreground">Razorpay Order ID</TableHead>
              <TableHead className="font-black text-foreground">Payment ID</TableHead>
              <TableHead className="text-center font-black text-foreground">Status</TableHead>
              <TableHead className="text-right font-black text-foreground">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center text-[#536070]">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#20c5b1]" />
                  Loading your payment records...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center text-[#536070]">
                  No transaction records found in your account.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="text-sm">
                    <div className="font-semibold text-foreground">
                      {format(new Date(order.paidAt || order.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {format(new Date(order.paidAt || order.createdAt), "hh:mm a")}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground">
                    {order.razorpayOrderId}
                  </TableCell>

                  <TableCell className="font-mono text-[11px]">
                    {order.razorpayPaymentId ? (
                      <span className="rounded-full bg-[#ecfffb] px-2 py-1 text-[#0a9d8d] dark:bg-[#123b36] dark:text-[#9af5db]">
                        {order.razorpayPaymentId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">---</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`border-2 px-3 font-black capitalize ${
                        order.status === "PAID"
                          ? "border-[#6ae4cb] bg-[#eafffa] text-[#0a9d8d]"
                          : "border-[#b8e2ff] bg-[#eef8ff] text-[#1369d1]"
                      }`}
                    >
                      {order.status.toLowerCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-lg font-black text-foreground">
                      {order.currency === "INR" ? "₹" : order.currency}
                      {order.amount.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-[#536070]">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#20c5b1]" />
              Loading your payment records...
            </div>
          ) : orders.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-[#536070]">
              No transaction records found in your account.
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment date</p>
                    <p className="text-sm font-bold text-foreground">
                      {format(new Date(order.paidAt || order.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(order.paidAt || order.createdAt), "hh:mm a")}
                    </p>
                  </div>
                  <span className="text-lg font-black text-foreground">
                    {order.currency === "INR" ? "₹" : order.currency}{order.amount.toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-muted-foreground">Order ID</span>
                    <span className="break-all text-right font-mono font-semibold text-foreground">{order.razorpayOrderId || "---"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-muted-foreground">Payment ID</span>
                    <span className="break-all text-right font-mono text-foreground">{order.razorpayPaymentId || "---"}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`border-2 px-2.5 text-[11px] font-black capitalize ${
                    order.status === "PAID"
                      ? "border-[#6ae4cb] bg-[#eafffa] text-[#0a9d8d]"
                      : "border-[#b8e2ff] bg-[#eef8ff] text-[#1369d1]"
                  }`}
                >
                  {order.status.toLowerCase()}
                </Badge>
              </article>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#ffd7d7] bg-[#fff4f4] p-4 text-sm font-medium text-[#cc2d3a]">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-[24px] border border-[#dff4ef] bg-[#ecfffb] p-4 sm:flex-row sm:items-center">
        <p className="text-xs italic text-[#43706b]">
          Payments are secured via Razorpay. For failed transactions or issues, contact help@dangeacademy.com
        </p>
        <Badge className="bg-[#071126] text-white hover:bg-[#071126]">
          {orders.filter((o) => o.status === "PAID").length} Successful Payments
        </Badge>
      </div>
    </div>
  );
}