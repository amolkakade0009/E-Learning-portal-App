import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Users, BookOpen, TrendingUp, IndianRupee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { courses, users, payments } = useStore();
  const [range, setRange] = useState<DateRange | undefined>();

  const filteredPayments = useMemo(() => {
    if (!range?.from) return payments;
    return payments.filter(p => {
      const d = new Date(p.date);
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      return true;
    });
  }, [payments, range]);

  const totalRevenue = filteredPayments.filter(p => p.status === "success").reduce((s, p) => s + p.amount, 0);
  const totalStudents = users.filter(u => u.role === "student").length;

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredPayments.forEach(p => {
      const key = format(new Date(p.date), "MMM");
      map.set(key, (map.get(key) || 0) + p.amount);
    });
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [filteredPayments]);

  const courseData = courses.map(c => ({ name: c.name.slice(0, 15), students: c.enrollmentCount }));

  const stats = [
    { icon: BookOpen, label: "Total courses", value: courses.length.toString(), color: "text-chart-2" },
    { icon: Users, label: "Total students", value: totalStudents.toLocaleString(), color: "text-chart-3" },
    { icon: IndianRupee, label: "Revenue", value: "₹" + totalRevenue.toLocaleString(), color: "text-gold" },
    { icon: TrendingUp, label: "Transactions", value: filteredPayments.length.toString(), color: "text-chart-4" },
  ];

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">Overview</div>
          <h1 className="mt-1 font-display text-4xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Track your academy's performance</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {range?.from ? (range.to ? `${format(range.from, "MMM d")} — ${format(range.to, "MMM d")}` : format(range.from, "MMM d, yyyy")) : "Filter by date"}
              {range && <button onClick={(e) => { e.stopPropagation(); setRange(undefined); }} className="ml-2 text-xs text-muted-foreground">✕</button>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Revenue trend</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2.5} dot={{ fill: "var(--gold)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Enrollments by course</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="students" fill="var(--navy)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
