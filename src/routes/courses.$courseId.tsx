import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent } from "react";
import { 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Play, 
  Loader2,
  GraduationCap,
  Briefcase,
  Award,
  ShieldCheck,
  ChevronDown,
  Video,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicCourse, createPaymentOrder, getApiErrorMessage, verifyPayment } from "@/api/api";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

// Helper for Google Drive Images
const getDirectDriveLink = (url: string) => {
  if (!url || !url.includes("drive.google.com")) return url;
  const fileId = url.match(/\/d\/(.+?)\/(view|edit)?/)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
};

// Helper for Video Duration Formatting
const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
};

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const { currentUser, enrollments, completeCoursePurchase } = useStore();

  // Course Data States
  const [course, setCourse] = useState<any>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({ 0: true });

  // Payment States
  const [paying, setPaying] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check if user is already enrolled
  const isEnrolled = currentUser && enrollments.some(e => e.userId === currentUser.id && e.courseId === courseId);

  const toggleChapter = (index: number) => {
    setOpenChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 1. Fetch Course Data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await getPublicCourse(courseId);
        setCourse(data);
        if (data.introVideoUid) {
          fetchDemoPlayback(data.introVideoUid);
        }
      } catch (error) {
        console.error("Course load failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId]);

  // 2. Fetch Cloudflare Playback URL
  const fetchDemoPlayback = async (uid: string) => {
    setIsLoadingVideo(true);
    try {
      const response = await fetch(`https://dange-academy.onrender.com/public/course/${uid}/playback-url`);
      if (response.ok) {
        let url = await response.text();
        try { 
          const json = JSON.parse(url); 
          url = json.url || json.playbackUrl || url; 
        } catch(e) {}
        
        const cloudflareUrl = url.includes("?") 
          ? `${url}&autoplay=true&letterbox=false` 
          : `${url}?autoplay=true&letterbox=false`;
          
        setPlaybackUrl(cloudflareUrl);
      }
    } catch (error) {
      console.error("Video fetch error", error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // --- PAYMENT LOGIC ---
  const handleEnrollClick = (e: MouseEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.info("Please log in to buy this course.");
      navigate({ to: "/login" });
      return;
    }

    if (isEnrolled) {
      navigate({ to: "/dashboard" });
      return;
    }

    setShowTerms(true);
  };

  const executePayment = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return;
    }

    setShowTerms(false);
    
    try {
      setPaying(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) throw new Error("Razorpay SDK failed to load.");

      const order = await createPaymentOrder(course.id, currentUser!.id);
      const razorpayOrderId = order.razorpayOrderId || order.orderId;

      if (!razorpayOrderId) {
        throw new Error("The payment service did not return a valid Order ID.");
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Dange Academy",
        description: course.courseName,
        order_id: razorpayOrderId as string,
        prefill: {
          name: currentUser!.name,
          email: currentUser!.email,
          contact: currentUser!.mobileNumber,
        },
        theme: { color: "#0f2147" },
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              stundetid: currentUser!.id,
              courseId: course.id,
              enrolledAt: new Date().toISOString(),
            });

            completeCoursePurchase(course.id, response.razorpay_payment_id);
            toast.success("Welcome to the course!");
            navigate({ to: "/dashboard" });
          } catch (err) {
            toast.error("Verification failed. Please contact support.");
          } finally {
            setPaying(false);
          }
        },
        modal: { 
          ondismiss: () => setPaying(false) 
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start payment."));
      setPaying(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!course) return <div className="p-20 text-center text-xl font-display text-muted-foreground">Course not found.</div>;

  const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#a7f3d0]">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.15),_transparent_30%),linear-gradient(90deg,var(--background)_0%,rgba(32,197,177,0.06)_55%,rgba(32,197,177,0.08)_100%)] pb-20 pt-16 md:pb-28">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Badge className="border border-[#7fead7] bg-[#eafffa] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#0aa68d] hover:bg-[#eafffa]">
              {course.category?.replace('_', ' ') || "PROFESSIONAL"}
            </Badge>

            <h1 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-tight text-foreground md:text-5xl">
              {course.courseName}
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {course.description}
            </p>

            <div className="flex flex-wrap gap-8 pt-2 text-sm text-muted-foreground">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-black text-[#20c5b1]">{course.enrolledCount}+</span>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <Users className="h-3.5 w-3.5" /> Students
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-black text-[#20c5b1]">{course.chapters?.length || 0}</span>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <BookOpen className="h-3.5 w-3.5" /> Chapters
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-black text-[#20c5b1]">{course.courseValidity} Months</span>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <Clock className="h-3.5 w-3.5" /> Access
                </span>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-border">
              <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-8 w-2 rounded-full bg-[#20c5b1]" />
              <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                Detailed Curriculum
              </h2>
            </div>

            <div className="space-y-4">
              {course.chapters && course.chapters.length > 0 ? (
                course.chapters.map((chapter: any, chapIdx: number) => {
                  const isOpen = !!openChapters[chapIdx];
                  const subTopicsCount = chapter.subTopics?.length || 0;

                  return (
                    <div
                      key={chapter.id || chapIdx}
                      className="overflow-hidden rounded-2xl border border-border bg-background"
                    >
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapIdx)}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eafffa] text-sm font-black text-[#0aa68d]">
                            {chapter.chapterOrder || chapIdx + 1}
                          </span>
                          <div>
                            <h3 className="text-base font-black text-foreground capitalize md:text-lg">
                              {chapter.chapterName}
                            </h3>
                            {chapter.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="hidden text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                            {subTopicsCount} {subTopicsCount === 1 ? "Lesson" : "Lessons"}
                          </span>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-border bg-card">
                          {chapter.subTopics && chapter.subTopics.length > 0 ? (
                            chapter.subTopics.map((topic: any, topicIdx: number) => {
                              const duration = formatDuration(topic.durationInSeconds);

                              return (
                                <div
                                  key={topic.id || topicIdx}
                                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                                >
                                  <div className="flex items-start gap-3">
                                    <Video className="mt-1 h-4 w-4 shrink-0 text-[#20c5b1]" />
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {topic.topicName}
                                      </p>
                                      {topic.content && (
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                          {topic.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="ml-4 flex shrink-0 items-center gap-3">
                                    {duration && (
                                      <span className="text-xs font-semibold text-muted-foreground">
                                        {duration}
                                      </span>
                                    )}
                                    {!isEnrolled && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                              No topics added to this chapter yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
                  Curriculum details will be available soon.
                </div>
              )}
            </div>
          </div>
            </div>
          </div>

          <div className="w-full lg:-mb-28">
            <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
              <div className="group relative aspect-video overflow-hidden bg-muted">
                {!isPlaying ? (
                  <div className="relative h-full w-full" onClick={() => setIsPlaying(true)}>
                    <img
                      src={getDirectDriveLink(course.courseThumbnailUrl)}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt="Course Preview"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/20">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl transition-transform group-hover:scale-110">
                        <Play className="ml-1 h-8 w-8 fill-black text-black" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-4 text-center">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white drop-shadow-md">
                        Watch Demo Lesson
                      </p>
                    </div>
                  </div>
                ) : (
                  isLoadingVideo ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                  ) : (
                    <iframe
                      src={playbackUrl || ""}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    ></iframe>
                  )
                )}
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-foreground">₹{course.price}</span>
                  <span className="text-base font-medium text-muted-foreground line-through">₹{course.originalPrice}</span>
                  <span className="rounded-md bg-[#eafffa] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0aa68d]">
                    {discount}% OFF
                  </span>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground italic">
                  Special Academic Discount Applied
                </p>

                {isEnrolled ? (
                  <Button
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="h-14 w-full rounded-xl bg-[#20c5b1] text-base font-black text-[#071126] hover:bg-[#1db7a4]"
                  >
                    Go to dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={handleEnrollClick}
                    disabled={paying}
                    className="h-14 w-full rounded-xl bg-[#20c5b1] text-base font-black text-[#071126] hover:bg-[#1db7a4]"
                  >
                    {paying ? <Loader2 className="h-6 w-6 animate-spin" /> : "Enroll now"}
                  </Button>
                )}

                <div className="space-y-4 border-t border-border pt-5 mt-2">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                    What&apos;s included
                  </h4>
                  {[
                    "Full video access for " + course.courseValidity + " months",
                    "Personalized learning dashboard",
                    "Verified course certificate",
                    "Access on web"
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16bda8]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:pr-[460px]">

        <div className="space-y-10">
         
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-8 w-2 rounded-full bg-[#20c5b1]" />
              <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                Meet Your Mentor
              </h2>
            </div>

            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="relative shrink-0">
                <img
                  src={getDirectDriveLink(course.mentor?.profileImageUrl)}
                  className="h-40 w-40 rounded-[24px] object-cover shadow-[0_18px_40px_rgba(15,23,42,0.15)] md:h-52 md:w-52"
                  alt={course.mentor?.name}
                />
                <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20c5b1] text-[#071126] shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>

              <div className="flex-1">
                <Badge variant="outline" className="border-[#7fead7] bg-[#eafffa] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0aa68d]">
                  {course.mentor?.designation}
                </Badge>
                <h3 className="mt-4 text-2xl font-black text-foreground md:text-3xl">
                  {course.mentor?.name}
                </h3>

                <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#20c5b1]" />
                    {course.mentor?.experienceYears}+ Years Experience
                  </span>
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#20c5b1]" />
                    {course.mentor?.qualification}
                  </span>
                </div>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground italic md:text-lg">
                  “{course.mentor?.bio}”
                </p>
              </div>
            </div>
          </div>

         
        </div>
      </section>

      {/* --- CONFIRMATION DIALOG --- */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-navy" /> Enrollment Confirmation
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to enroll in <b>{course.courseName}</b>. Please review the following terms:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p>Course access will be valid for <b>{course.courseValidity} months</b> from the date of purchase.</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p>Payments are non-refundable once the course content is accessed.</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p>One account can be used on only one device.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-secondary/30 p-4 rounded-xl">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms} 
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)} 
              className="mt-1"
            />
            <label htmlFor="terms" className="text-[11px] leading-tight font-medium cursor-pointer">
              I agree to the Terms of Service and Privacy Policy of Dange Academy. I understand that my payment will be processed securely via Razorpay.
            </label>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setShowTerms(false)} className="font-bold">Cancel</Button>
            <Button 
              onClick={executePayment} 
              disabled={!agreedToTerms}
              className="bg-navy hover:bg-navy/90 text-white font-bold px-8"
            >
              Confirm & Pay ₹{course.price.toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}