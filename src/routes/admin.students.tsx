import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { getApiErrorMessage, getStudents, type Student } from "@/api/api";

export const Route = createFileRoute("/admin/students")({ component: AdminStudents });

function AdminStudents() {
  const [q, setQ] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setError(null);
        setLoading(true);
        setStudents(await getStudents());
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to load the student list. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    void loadStudents();
  }, []);

  const filteredStudents = students.filter(u =>
    q === "" || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">Students</h1>
          <p className="text-muted-foreground mt-1">{filteredStudents.length} registered students</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students..." className="pl-10" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Student</TableHead>
              <TableHead>Email (username)</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead className="text-right">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading students...</TableCell></TableRow>
            )}
            {!loading && error && (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-destructive">{error}</TableCell></TableRow>
            )}
            {!loading && !error && filteredStudents.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-navy text-navy-foreground text-xs">{s.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell className="text-muted-foreground">{s.mobileNumber}</TableCell>
                  <TableCell className="text-right font-semibold">{s.role}</TableCell>
                </TableRow>
            ))}
            {!loading && !error && filteredStudents.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No students found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
