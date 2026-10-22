import { createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/refer")({
  component: ReferPage,
});


function ReferPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <Card className="max-w-xl w-full border-0 shadow-2xl">
        <CardContent className="p-10 text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg">
            <Gift className="h-12 w-12" />
          </div>

          <Badge className="mt-6 bg-orange-500 hover:bg-orange-500">
            <Clock className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>

          <h1 className="mt-5 text-4xl font-bold">
            Refer & Earn
          </h1>

          <p className="mt-4 text-muted-foreground leading-7">
            We're building an exciting referral program where you can
            invite your friends, help them learn, and earn amazing rewards
            for every successful referral.
          </p>

          <div className="mt-8 rounded-xl bg-violet-50 border border-violet-200 p-5">
            <div className="flex items-center justify-center gap-2 text-violet-700 font-semibold">
              <Sparkles className="h-5 w-5" />
              Upcoming Features
            </div>

            <div className="mt-4 grid gap-3 text-left">
              <div>🎁 Earn rewards for every successful referral</div>
              <div>💰 Cashback & wallet balance</div>
              <div>📤 One-click WhatsApp sharing</div>
              <div>📊 Track referral history & earnings</div>
              <div>🏆 Unlock exclusive bonuses</div>
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            🚀 This feature is under development and will be available soon.
            Stay tuned!
          </p>

        </CardContent>
      </Card>
    </div>
  );
}