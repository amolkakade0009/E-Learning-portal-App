import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";

import {
  createPaymentOrder,
  getApiErrorMessage,
  verifyPayment,
} from "@/api/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useStore, type Course } from "@/lib/store";

const categoryStyles = [
  "bg-[#20c5b1] text-[#071126]",
  "bg-[#f6b21a] text-white",
  "bg-[#ef4966] text-white",
  "bg-[#6d6bf3] text-white",
  "bg-[#16bda8] text-[#071126]",
];

function getDirectDriveLink(url: string) {
  if (!url || !url.includes("drive.google.com")) return url;
  const fileId =
    url.match(/\/d\/(.+?)\/(view|edit)?/)?.[1] ||
    url.match(/id=(.+?)(&|$)/)?.[1];
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
}

function formatCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrice(value: number | string | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-IN") : String(value || 0);
}

function discountPercent(price: number, originalPrice: string) {
  const original = Number(originalPrice || 0);
  if (!original || original <= price) return 35;
  return Math.round(((original - price) / original) * 100);
}

function categoryColorIndex(category: string) {
  return Math.abs(
    category.split("").reduce((total, char) => total + char.charCodeAt(0), 0),
  ) % categoryStyles.length;
}

export function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  const {
    currentUser,
    enrollments,
    addToCart,
    completeCoursePurchase,
  } = useStore();

  const [paying, setPaying] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isEnrolled =
    currentUser &&
    enrollments.some(
      (enrollment) =>
        enrollment.userId === currentUser.id && enrollment.courseId === course.id,
    );
  const chapters = Array.isArray(course.chapters) ? course.chapters : [];
  const totalLessons = chapters.reduce(
    (sum, chapter) =>
      sum + (Array.isArray(chapter.subtopics) ? chapter.subtopics.length : 0),
    0,
  );
  const lectureCount = totalLessons || Math.max(chapters.length * 10, 60);
  const duration = course.courseValidity
    ? `${course.courseValidity} months`
    : course.duration || "6 months";
  const level =
    course.category?.toLowerCase().includes("class") ||
    course.category?.toLowerCase().includes("foundation")
      ? "Beginner"
      : course.category?.toLowerCase().includes("diploma")
        ? "Intermediate"
        : "Advanced";
  const badgeClass =
    categoryStyles[categoryColorIndex(course.category || "program")];

  const handleEnrollClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

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

  const handleCartClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      toast.info("Please log in to add this course to your cart.");
      navigate({ to: "/login" });
      return;
    }

    addToCart(course.id, "1 year");
    toast.success("Course added to cart.");
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
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load.");
      }

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
        description: course.name,
        order_id: razorpayOrderId as string,
        prefill: {
          name: currentUser!.name,
          email: currentUser!.email,
          contact: currentUser!.mobileNumber,
        },
        theme: { color: "#20c5b1" },
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
          } catch {
            toast.error("Verification failed. Please contact support.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start payment."));
      setPaying(false);
    }
  };

  return (
    <>
      <article className="group overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="relative block aspect-[2.05/1] overflow-hidden bg-[#e7edf3]"
        >
          {course.courseThumbnailUrl ? (
            <img
              src={getDirectDriveLink(course.courseThumbnailUrl)}
              alt={course.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#f4f7fa,#dce8ee)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          <span
            className={`absolute left-3 top-3 rounded-md px-3 py-1 text-xs font-black uppercase ${badgeClass}`}
          >
            {formatCategory(course.category || "Program")}
          </span>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-[#2f3341] px-3 py-1 text-xs font-black text-white">
            <Star className="h-3.5 w-3.5 fill-[#ffc629] text-[#ffc629]" />
            4.9
          </span>
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-sm font-black text-[#20e0c7]">
            <PlayCircle className="h-4 w-4" />
            1080p HD Streaming
          </span>
          <span className="absolute bottom-3 right-3 rounded-md bg-[#1d2230]/90 px-3 py-1 text-xs font-bold text-white">
            {level}
          </span>
        </Link>

        <div className="flex min-h-[196px] flex-col p-5">
          <Link to="/courses/$courseId" params={{ courseId: course.id }}>
            <h3 className="line-clamp-2 min-h-[52px] text-xl font-black leading-snug tracking-normal text-foreground transition-colors hover:text-[#16bda8]">
              {course.name}
            </h3>
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-[#16bda8]" />
              {duration}
            </span>
            <span className="text-muted-foreground/60">-</span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-[#16bda8]" />
              {lectureCount} Lectures
            </span>
          </div>

          <div className="mt-auto border-t border-border pt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {"\u20B9"}
                    {formatPrice(course.fees)}
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm font-bold text-muted-foreground line-through">
                      {"\u20B9"}
                      {formatPrice(course.originalPrice)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-black uppercase text-[#00a990]">
                  {discountPercent(course.fees, course.originalPrice)}% off applied
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Add to cart"
                  onClick={handleCartClick}
                  className="h-11 w-11 rounded-xl border-border bg-background text-foreground hover:bg-accent hover:text-[#16bda8]"
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                {isEnrolled ? (
                  <Button
                    type="button"
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="h-11 rounded-xl bg-[#20c5b1] px-5 font-black text-[#071126] hover:bg-[#18ae9c]"
                  >
                    Learn <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleEnrollClick}
                    disabled={paying}
                    className="h-11 rounded-xl bg-[#20c5b1] px-5 font-black text-[#071126] hover:bg-[#18ae9c]"
                  >
                    {paying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Enroll <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="h-5 w-5 text-[#16bda8]" /> Enrollment
              Confirmation
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to enroll in <b>{course.name}</b>. Please review the
              following terms:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs leading-relaxed text-muted-foreground">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16bda8]" />
              <p>
                Course access will be valid for <b>{course.courseValidity} months</b>{" "}
                from the date of purchase.
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16bda8]" />
              <p>Payments are non-refundable once the course content is accessed.</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16bda8]" />
              <p>One account can be used on only one device.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-xl bg-secondary/30 p-4">
            <Checkbox
              id={`terms-${course.id}`}
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
              className="mt-1"
            />
            <label
              htmlFor={`terms-${course.id}`}
              className="cursor-pointer text-[11px] font-medium leading-tight"
            >
              I agree to the Terms of Service and Privacy Policy of Dange Academy.
              I understand that my payment will be processed securely via Razorpay.
            </label>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowTerms(false)}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={executePayment}
              disabled={!agreedToTerms}
              className="bg-[#20c5b1] px-8 font-bold text-[#071126] hover:bg-[#18ae9c]"
            >
              Confirm & Pay {"\u20B9"}
              {formatPrice(course.fees)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
