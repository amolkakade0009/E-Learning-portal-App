import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { GraduationCap, LayoutDashboard, Users, BookOpen, CreditCard, LogOut, Home, ShieldCheck, MoreVertical } from "lucide-react";
import { logoutUser } from "@/api/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { currentUser, logout, hydrated } = useStore();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) navigate({ to: "/login" });
    else if (currentUser.role !== "admin") navigate({ to: "/dashboard" });
  }, [currentUser, navigate, hydrated]);

  if (!hydrated || !currentUser || currentUser.role !== "admin") return null;

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/students", label: "Students", icon: Users },
     { to: "/admin/mentor", label: "Mentors", icon: Users },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.12),_transparent_35%),linear-gradient(180deg,var(--background)_0%,rgba(32,197,177,0.04)_100%)] text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-[280px] flex-col border-r border-border bg-card/90 backdrop-blur-xl lg:flex">
        <Link to="/" className="flex h-14 items-center gap-3 border-b border-[#edf4f3] px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#20c5b1] shadow-[0_8px_20px_rgba(32,197,177,0.2)]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black leading-none text-[#101827]">Dange</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#00a990]"><ShieldCheck className="h-2.5 w-2.5" />Admin</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(n => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${active ? "bg-[#eafffa] text-[#0a9d8d] shadow-[inset_0_0_0_1px_rgba(32,197,177,0.2)] dark:bg-[#0d2f2a] dark:text-[#85f1d8]" : "text-muted-foreground hover:bg-accent hover:text-[#0aa795]"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-[#edf4f3] p-3">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-[#0aa795]">
            <Home className="h-4 w-4" /> View site
          </Link>
          <button onClick={() => {
             if (currentUser) {
                              logoutUser(currentUser.id)
                                .then(() => {
                                  logout();
                                  navigate({ to: "/" });
                                });
                            }
             }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-[280px]">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2 font-black text-[#101827]"><GraduationCap className="h-5 w-5 text-[#20c5b1]" /> Admin</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-xl p-2 transition-colors hover:bg-[#f3fbfa]">
                <MoreVertical className="h-4 w-4 text-[#425066]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {nav.map(n => (
                <DropdownMenuItem key={n.to} asChild>
                  <Link to={n.to} className="flex items-center gap-2 cursor-pointer">
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <div className="my-1 border-t border-[#edf4f3]"></div>
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                  <Home className="h-4 w-4" /> View site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (currentUser) {
                  logoutUser(currentUser.id)
                    .then(() => {
                      logout();
                      navigate({ to: "/" });
                    });
                }
              }} className="flex items-center gap-2 cursor-pointer text-red-600">
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
