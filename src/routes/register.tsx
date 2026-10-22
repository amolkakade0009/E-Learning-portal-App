import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage, signUp } from "@/api/api";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const message = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        mobileNumber: Number(form.mobile),
        password: form.password,
      });
      toast.success(message);
      await navigate({ to: "/login" });
    } catch (error) {
      console.log(error)
      toast.error(getApiErrorMessage(error, "Unable to create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: "/" }); }}>
      <DialogContent className="w-[92vw] max-w-2xl overflow-hidden rounded-[30px] border border-border bg-background p-0 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:rounded-[32px]">
        <div className="grid bg-background lg:grid-cols-[1fr_1.25fr]">
          <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.2),_transparent_30%),linear-gradient(135deg,#0d1b2a_0%,#173a4a_100%)] p-8 text-white lg:flex lg:flex-col lg:justify-between dark:from-[#081321] dark:to-[#102a34]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#20c5b1] shadow-[0_12px_30px_rgba(32,197,177,0.25)]">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black">Dange Academy</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">Learn · Grow · Excel</div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9fff8]">
                <ShieldCheck className="h-3.5 w-3.5" /> Start today
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight">Start learning today.</h1>
              <p className="mt-4 max-w-sm text-sm text-white/75">
                Join students building real-world skills with expert-led courses, live guidance, and exam-focused support.
              </p>
            </div>

            <div className="text-xs text-white/55">© {new Date().getFullYear()} Dange Academy</div>
          </div>

          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-2xl font-black text-foreground">Create your account</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Free to join. Buy courses anytime.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-12 rounded-2xl border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="h-12 rounded-2xl border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">Mobile number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                  className="h-12 rounded-2xl border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className="h-12 rounded-2xl border-border bg-muted pr-11 text-foreground placeholder:text-muted-foreground"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-[#20c5b1] text-sm font-black text-[#071126] shadow-[0_14px_30px_rgba(32,197,177,0.22)] hover:bg-[#1db7a4]"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-black text-[#0a9d8d] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
