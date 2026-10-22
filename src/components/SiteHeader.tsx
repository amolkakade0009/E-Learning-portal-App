import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { logoutUser } from "@/api/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";

import logo from "../assets/img/Logo.png";

const navItems = [
  { label: "Home", href: "/#" },
  { label: "Courses", href: "/#courses" },
  { label: "About Us", href: "/#about" },
  { label: "Contact Us", href: "/#contact" },
];

export function SiteHeader() {
  const { currentUser, logout } = useStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const firstName = currentUser?.name?.split(" ")[0] || "Student";
  const initials =
    currentUser?.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "DA";

  const handleLogout = () => {
    if (!currentUser) return;

    logoutUser(currentUser.id).then(() => {
      logout();
      navigate({ to: "/" });
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1840px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#20c5b1] shadow-[0_10px_22px_rgba(32,197,177,0.2)]">
            <img src={logo} alt="Dange Academy" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-black leading-tight tracking-normal text-foreground">
              Dange's <span className="text-[#20c5b1]">Academy</span>
            </div>
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[#009b8c]">
              Definite Success
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/#"
                ? location.pathname === "/" && !location.hash
                : location.hash === item.href.replace("/", "");

            return (
              <a
                key={item.label}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-base font-black transition-colors ${
                  active
                    ? "bg-[#eafffa] text-[#13b69f] dark:bg-[#0d2f2a] dark:text-[#85f1d8]"
                    : "text-muted-foreground hover:bg-accent hover:text-[#13b69f]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <Link
            to="/dashboard"
            className="rounded-xl px-4 py-2 text-base font-black text-muted-foreground transition-colors hover:bg-accent hover:text-[#13b69f]"
          >
            My Learning
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden h-10 w-10 rounded-full text-foreground hover:bg-accent md:inline-flex"
          >
            {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden h-11 rounded-2xl border-border bg-card px-3 text-foreground shadow-none hover:bg-accent md:inline-flex"
                >
                  <Avatar className="h-8 w-8 border-2 border-[#20c5b1]">
                    <AvatarFallback className="bg-[#ecfffb] text-xs font-black text-[#071126] dark:bg-[#123b36] dark:text-[#dffff7]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-black">{firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm">{currentUser.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {currentUser.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currentUser.role === "admin" ? (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login">
                <Button variant="ghost" className="rounded-full font-bold">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full bg-[#20c5b1] font-black text-[#071126] hover:bg-[#18ae9c]">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          <Shield className="hidden h-5 w-5 text-[#9aa4b3] xl:block" />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
            className="h-10 w-10 rounded-full lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#edf0f4] bg-white px-4 pb-5 lg:hidden">
          <nav className="mx-auto grid max-w-[1840px] gap-1.5 py-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-black text-muted-foreground hover:bg-[#eafffa] hover:text-[#13b69f] dark:hover:bg-[#0d2f2a]"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-black text-muted-foreground hover:bg-[#eafffa] hover:text-[#13b69f] dark:hover:bg-[#0d2f2a]"
            >
              My Learning
            </Link>
          </nav>

          <div className="mx-auto flex max-w-[1840px] flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            {currentUser ? (
              <Button onClick={handleLogout} variant="outline" className="rounded-full">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="rounded-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  <Button className="rounded-full bg-[#20c5b1] font-black text-[#071126] hover:bg-[#18ae9c]">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
