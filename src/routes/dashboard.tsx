import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  LogOut,
  Home,
  User,
  Gift,
  Menu,
  X,
} from "lucide-react";

import { logoutUser } from "@/api/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { currentUser, logout, hydrated } = useStore();

  const navigate = useNavigate();
  const loc = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    if (!currentUser) {
      navigate({ to: "/login" });
    } else if (currentUser.role === "admin") {
      navigate({ to: "/admin" });
    }
    console.log("DashboardLayout: currentUser", currentUser);
  }, [currentUser, navigate, hydrated]);

  if (!hydrated || !currentUser) return null;

  const nav = [
    {
      to: "/dashboard",
      label: "My Courses",
      icon: BookOpen,
      exact: true,
    },
    {
      to: "/dashboard/payments",
      label: "Payments",
      icon: CreditCard,
    },
      {
    to: "/refer",
    label: "Refer & Earn",
    icon: Gift,
  },
  ];

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.12),_transparent_35%),linear-gradient(180deg,var(--background)_0%,rgba(32,197,177,0.04)_100%)] text-foreground">
        <aside className="fixed inset-y-0 left-0 hidden w-[280px] flex-col border-r border-border bg-card/90 backdrop-blur-xl lg:flex">
          <Link
            to="/"
            className="flex h-24 items-center gap-3 border-b border-[#edf4f3] px-6"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#20c5b1] shadow-[0_12px_30px_rgba(32,197,177,0.25)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="text-xl font-black leading-none text-[#101827]">
                Dange
              </div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#00a990]">
                Academy
              </div>
            </div>
          </Link>

          <nav className="flex-1 space-y-2 p-4">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-[#0aa795]"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            {nav.map((n) => {
              const active = n.exact
                ? loc.pathname === n.to
                : loc.pathname.startsWith(n.to);

              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#eafffa] text-[#0a9d8d] shadow-[inset_0_0_0_1px_rgba(32,197,177,0.2)] dark:bg-[#0d2f2a] dark:text-[#85f1d8]"
                      : "text-muted-foreground hover:bg-accent hover:text-[#0aa795]"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-[#edf4f3] p-4">
            <Button
              variant="ghost"
              onClick={() => setProfileOpen(true)}
              className="w-full justify-start gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-[#0aa795]"
            >
              <User className="h-4 w-4" />
              My Profile
            </Button>

            <button
              onClick={() => {
                if (currentUser) {
                  logoutUser(currentUser.id)
                    .then(() => {
                      logout();
                      navigate({ to: "/" });
                    });
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        <main className="min-h-screen lg:pl-[280px]">
          <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
            <Link
              to="/"
              className="flex items-center gap-2 font-black text-foreground"
            >
              <GraduationCap className="h-5 w-5 text-[#20c5b1]" />
              Dange Academy
            </Link>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="rounded-xl"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProfileOpen(true)}
                className="rounded-xl"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
              <nav className="grid gap-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-[#0aa795]"
                >
                  <Home className="h-4 w-4" /> Home
                </Link>
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-[#0aa795]"
                  >
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => { setMobileMenuOpen(false); setProfileOpen(true); }}
                  className="justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-[#0aa795]"
                >
                  <User className="h-4 w-4" /> My Profile
                </Button>
              </nav>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-lg rounded-[28px] border-[#ebf1f0] bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.10)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#071126]">My Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#eafffa] text-3xl font-black text-[#071126] shadow-[0_16px_40px_rgba(32,197,177,0.18)]">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-[#eaf0ef] bg-[#f8fffe] p-3">
                <span className="font-semibold text-[#405266]">Name</span>
                <span className="font-medium text-[#071126]">{currentUser?.name}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#eaf0ef] bg-[#f8fffe] p-3">
                <span className="font-semibold text-[#405266]">Email</span>
                <span className="font-medium text-[#071126]">{currentUser?.email}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#eaf0ef] bg-[#f8fffe] p-3">
                <span className="font-semibold text-[#405266]">Mobile</span>
                <span className="font-medium text-[#071126]">{currentUser?.mobileNumber}</span>
              </div>

             

             
            </div>

            <Button
              className="w-full"
              onClick={() => setProfileOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}