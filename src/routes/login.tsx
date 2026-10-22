import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, ShieldCheck, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage, login as loginRequest, forgotPassword, verifyOtp, resetPassword } from "@/api/api";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { setAuthenticatedUser } = useStore();
  const navigate = useNavigate();
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminOtp, setAdminOtp] = useState("");
  const [isAdminOtpStep, setIsAdminOtpStep] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminOtpStep && adminOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginRequest({
        email: email.trim(),
        password,
        ...(isAdminOtpStep ? { otp: adminOtp.trim() } : {}),
      });
      const sessionId = user.sessionId ?? user.session_id ?? "";
      const responseRole = user.role?.toLowerCase();

      if (!isAdminOtpStep && (responseRole === "admin" || !user.token)) {
        setIsAdminOtpStep(true);
        setAdminOtp("");
        toast.success("OTP sent. Verify your identity to continue.");
        return;
      }

      if (!user.token) {
        toast.error("Login succeeded, but the server did not return an auth token. Please try again.");
        return;
      }

      localStorage.setItem("dange_academy_auth_token", user.token);
      if (sessionId) {
        localStorage.setItem("dange_academy_session_id", sessionId);
      } else {
        localStorage.removeItem("dange_academy_session_id");
      }

      const role = responseRole === "admin" ? "admin" : "student";
      setAuthenticatedUser({
        id: user.user_id ?? "",
        sessionId,
        name: user.name ?? email.trim(),
        email: user.email ?? email.trim(),
        role,
        mobileNumber: user.mobileNumber,
      });

      toast.success(`Welcome back, ${user.name ?? email.trim()}!`);
      await navigate({ to: role === "admin" ? "/admin" : "/" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed. Please check your email and password."));
    } finally {
      setLoading(false);
    }
  };

  const returnToLoginForm = () => {
    setIsAdminOtpStep(false);
    setAdminOtp("");
  };

  // Password validation
  const isPasswordValid = (pass: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[@$!%*?&]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColor = passwordStrength <= 2 ? "text-red-500" : passwordStrength <= 3 ? "text-yellow-500" : "text-green-500";

  // Forgot password handlers
  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
    setForgotStep("email");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
  };

  const handleForgotPasswordSubmit = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setForgotLoading(true);
    try {
      await forgotPassword({ email: resetEmail.trim() });
      toast.success("OTP sent to your email. Please check your inbox.");
      setForgotStep("otp");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send OTP. Please check your email and try again."));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await verifyOtp({ email: resetEmail.trim(), otp: otp.trim() });
      setResetToken(response.resetToken);
      toast.success("OTP verified successfully!");
      setForgotStep("password");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid OTP. Please try again."));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please enter both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword({ resetToken, newPassword });
      toast.success("Password reset successfully! You can now log in with your new password.");
      setShowForgotPassword(false);
      setForgotStep("email");
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reset password. Please try again."));
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep("email");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
  };

  return (
    <>
      <Dialog open={!showForgotPassword} onOpenChange={(open) => { if (!open) navigate({ to: "/" }); }}>
        <DialogContent className="w-[92vw] max-w-xl overflow-hidden rounded-[30px] border border-border bg-background p-0 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:rounded-[32px]">
          <div className="grid bg-background lg:grid-cols-[1fr_1.2fr]">
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
                  <ShieldCheck className="h-3.5 w-3.5" /> Welcome back
                </div>
                <h1 className="mt-6 text-4xl font-black leading-tight">Continue your learning journey.</h1>
                <p className="mt-4 max-w-sm text-sm text-white/75">
                  Pick up exactly where you left off. Your progress stays saved across every lesson and device.
                </p>
              </div>

              <div className="text-xs text-white/55">© {new Date().getFullYear()} Dange Academy</div>
            </div>

            <div className="p-6 sm:p-8">
              <DialogHeader className="mb-6 text-left">
                <div className="flex items-start gap-3">
                  {isAdminOtpStep && (
                    <button
                      type="button"
                      onClick={returnToLoginForm}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Back to login"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <div>
                    <DialogTitle className="text-2xl font-black text-foreground">
                      {isAdminOtpStep ? "Verify admin login" : "Welcome back"}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                      {isAdminOtpStep
                        ? `Enter the 6-digit OTP sent to ${email.trim()}.`
                        : "Log in to access your courses and learning dashboard."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-5">
                {!isAdminOtpStep ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 rounded-2xl border-border bg-muted text-foreground placeholder:text-muted-foreground"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 rounded-2xl border-border bg-muted pr-11 text-foreground placeholder:text-muted-foreground"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleForgotPasswordClick}
                        className="text-xs font-semibold text-[#0a9d8d] transition-colors hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="admin-otp" className="text-sm font-semibold text-foreground">One-time password</Label>
                    <Input
                      id="admin-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={adminOtp}
                      onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      autoFocus
                      className="h-14 rounded-2xl border-border bg-muted text-center text-2xl font-bold tracking-[0.45em] text-foreground placeholder:text-muted-foreground"
                      placeholder="000000"
                    />
                    <p className="text-xs text-muted-foreground">Your admin verification code is valid for this login attempt.</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-[#20c5b1] text-sm font-black text-[#071126] shadow-[0_14px_30px_rgba(32,197,177,0.22)] hover:bg-[#1db7a4]"
                >
                  {loading ? (isAdminOtpStep ? "Verifying..." : "Signing in...") : (isAdminOtpStep ? "Verify and continue" : "Log in")}
                </Button>

                {!isAdminOtpStep && (
                  <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="font-black text-[#0a9d8d] hover:underline">
                      Sign up
                    </Link>
                  </p>
                )}
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={closeForgotPassword}>
        <DialogContent className="w-[92vw] max-w-xl rounded-[30px] border border-border bg-background p-0 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:rounded-[32px]">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              {forgotStep !== "email" && (
                <button
                  onClick={() => {
                    if (forgotStep === "otp") {
                      setForgotStep("email");
                      setOtp("");
                    } else if (forgotStep === "password") {
                      setForgotStep("otp");
                      setNewPassword("");
                      setConfirmPassword("");
                    }
                  }}
                  className="rounded-lg hover:bg-muted p-2 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              <div>
                <DialogTitle className="text-2xl font-black text-foreground">
                  {forgotStep === "email" && "Forgot Password?"}
                  {forgotStep === "otp" && "Verify OTP"}
                  {forgotStep === "password" && "Reset Password"}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-1">
                  {forgotStep === "email" && "Enter your email to receive an OTP"}
                  {forgotStep === "otp" && "Enter the OTP sent to your email"}
                  {forgotStep === "password" && "Create a new password for your account"}
                </DialogDescription>
              </div>
            </div>

            {/* Step 1: Email */}
            {forgotStep === "email" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-semibold text-foreground">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 rounded-2xl border-border bg-muted text-foreground placeholder:text-muted-foreground"
                    placeholder="you@example.com"
                  />
                </div>
                <Button
                  onClick={handleForgotPasswordSubmit}
                  disabled={forgotLoading}
                  className="h-12 w-full rounded-full bg-[#20c5b1] text-sm font-black text-[#071126] hover:bg-[#1db7a4]"
                >
                  {forgotLoading ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            )}

            {/* Step 2: OTP */}
            {forgotStep === "otp" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp-input" className="text-sm font-semibold text-foreground">Enter OTP</Label>
                  <Input
                    id="otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="h-12 rounded-2xl border-border bg-muted text-center text-2xl tracking-widest font-bold text-foreground placeholder:text-muted-foreground"
                    placeholder="000000"
                  />
                  <p className="text-xs text-muted-foreground">A 6-digit OTP has been sent to {resetEmail}</p>
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={forgotLoading || otp.length !== 6}
                  className="h-12 w-full rounded-full bg-[#20c5b1] text-sm font-black text-[#071126] hover:bg-[#1db7a4]"
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            )}

            {/* Step 3: Reset Password */}
            {forgotStep === "password" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border bg-muted pr-11 text-foreground placeholder:text-muted-foreground"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`text-xs font-semibold ${strengthColor}`}>
                      Password Strength: {passwordStrength <= 2 ? "Weak" : passwordStrength <= 3 ? "Fair" : "Strong"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must contain at least 8 characters, uppercase, lowercase, number, and special character (@$!%*?&)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border bg-muted pr-11 text-foreground placeholder:text-muted-foreground"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 font-semibold">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={forgotLoading || !newPassword || !confirmPassword}
                  className="h-12 w-full rounded-full bg-[#20c5b1] text-sm font-black text-[#071126] hover:bg-[#1db7a4]"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
