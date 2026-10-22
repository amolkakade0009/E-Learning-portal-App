import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: Cart });

function Cart() {
  const { cart, courses, removeFromCart, currentUser } = useStore();
  const navigate = useNavigate();

  const items = cart.map(i => ({ ...i, course: courses.find(c => c.id === i.courseId)! })).filter(i => i.course);
  const total = items.reduce((s, i) => s + i.course.fees, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">Your Cart</h1>
        <p className="text-muted-foreground mt-2">{items.length} {items.length === 1 ? "course" : "courses"} in cart</p>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h2 className="mt-6 font-display text-2xl">Your cart is empty</h2>
            <p className="text-muted-foreground mt-2">Browse our courses and start learning today.</p>
            <Link to="/"><Button className="mt-6 btn-gold">Browse courses</Button></Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map(i => (
                <div key={i.courseId} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <img src={i.course.courseThumbnailUrl} alt={i.course.name} className="h-24 w-32 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">{i.course.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{i.subscription} access</p>
                    <div className="mt-2 font-display text-xl font-semibold text-navy">₹{i.course.fees.toLocaleString()}</div>
                  </div>
                  <button onClick={() => removeFromCart(i.courseId)} className="self-start text-muted-foreground hover:text-destructive p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-24">
              <h3 className="font-display text-xl font-semibold">Order Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{Math.round(total * 0.18).toLocaleString()}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold text-navy">₹{Math.round(total * 1.18).toLocaleString()}</span>
              </div>
              <Button
                className="mt-5 w-full h-11 btn-gold"
                onClick={() => currentUser ? navigate({ to: "/checkout" }) : navigate({ to: "/login" })}
              >
                {currentUser ? "Proceed to checkout" : "Log in to checkout"}
              </Button>
            </aside>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
