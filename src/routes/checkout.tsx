import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const { cart, courses, currentUser, checkout } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
    else if (cart.length === 0 && !done) navigate({ to: "/cart" });
  }, [currentUser, cart, done, navigate]);

  const items = cart.map(i => ({ ...i, course: courses.find(c => c.id === i.courseId)! })).filter(i => i.course);
  const total = items.reduce((s, i) => s + i.course.fees, 0);
  const grand = Math.round(total * 1.18);

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      checkout();
      setProcessing(false);
      setDone(true);
      toast.success("Payment successful!");
    }, 1600);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold">Payment successful!</h1>
          <p className="mt-2 text-muted-foreground">Your courses are now unlocked. Start learning right away.</p>
          <Link to="/dashboard"><Button className="mt-6 btn-gold h-11 px-6">Go to my courses</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Checkout</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={pay} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-navy" />
              <h2 className="font-display text-xl font-semibold">Payment details</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Secure</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Card number</Label>
                <Input required placeholder="4242 4242 4242 4242" className="mt-1.5" defaultValue="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry</Label>
                  <Input required placeholder="MM/YY" className="mt-1.5" defaultValue="12/28" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input required placeholder="123" className="mt-1.5" defaultValue="123" />
                </div>
              </div>
              <div>
                <Label>Name on card</Label>
                <Input required className="mt-1.5" defaultValue={currentUser?.name} />
              </div>
            </div>

            <Button type="submit" disabled={processing} className="mt-6 w-full h-11 btn-gold">
              {processing ? "Processing payment..." : `Pay ₹${grand.toLocaleString()}`}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">This is a demo checkout. No real payment is processed.</p>
          </form>

          <aside className="rounded-2xl border border-border bg-card p-6 h-fit">
            <h3 className="font-display text-xl font-semibold">Order Summary</h3>
            <div className="mt-4 space-y-3">
              {items.map(i => (
                <div key={i.courseId} className="flex gap-3 text-sm">
                  <img src={i.course.thumbnail} alt="" className="h-12 w-16 rounded object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 font-medium">{i.course.name}</div>
                    <div className="text-xs text-muted-foreground">{i.subscription}</div>
                  </div>
                  <div className="font-semibold">₹{i.course.fees.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{Math.round(total * 0.18).toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t border-border mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-display text-xl font-semibold text-navy">₹{grand.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
