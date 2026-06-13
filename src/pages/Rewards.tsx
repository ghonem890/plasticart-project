import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Recycle, Gift, Coins, History, Plus } from "lucide-react";
import { CouponCelebration } from "@/components/CouponCelebration";

const MIN_REDEEM = 50;

export default function Rewards() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [points, setPoints] = useState<{ total_earned: number; total_redeemed: number; balance: number } | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [celebrationCode, setCelebrationCode] = useState("");
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [pointsRes, subsRes, redemptionsRes] = await Promise.all([
      supabase.from("recycling_points" as any).select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("recycling_submissions" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("recycling_redemptions" as any).select("*, coupons(code, discount_amount, expires_at)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (pointsRes.data) setPoints(pointsRes.data as any);
    if (subsRes.data) setSubmissions(subsRes.data as any[]);
    if (redemptionsRes.data) setRedemptions(redemptionsRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRedeem = async () => {
    if (!user) return;
    const amount = parseInt(redeemAmount);
    if (!amount || amount < MIN_REDEEM) {
      toast({ title: `${t("minimumRedeem")}: ${MIN_REDEEM} ${t("points")}`, variant: "destructive" });
      return;
    }
    if (!points || amount > points.balance) {
      toast({ title: t("insufficientPoints"), variant: "destructive" });
      return;
    }

    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_recycling_points" as any, {
      _user_id: user.id,
      _points: amount,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      // RPC returns coupon UUID, fetch the actual code
      const couponId = data as string;
      const { data: coupon } = await supabase
        .from("coupons")
        .select("code")
        .eq("id", couponId)
        .maybeSingle();
      setCelebrationCode(coupon?.code || couponId);
      setCelebrationPoints(amount);
      setShowCelebration(true);
      setRedeemAmount("");
      fetchData();
    }
    setRedeeming(false);
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "default";
    if (s === "rejected") return "destructive";
    return "secondary";
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const balance = points?.balance ?? 0;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Recycle className="h-5 w-5 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">{t("myRewards")}</h1>
          </div>
          <Link to="/recycle">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> {t("newSubmission")}
            </Button>
          </Link>
        </div>

        {/* Points overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Coins className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-3xl font-bold">{balance}</p>
              <p className="text-sm text-muted-foreground">{t("availablePoints")}</p>
              <p className="text-xs text-muted-foreground mt-1">= {balance} {t("currencySymbol")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Recycle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold">{points?.total_earned ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t("totalEarned")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Gift className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold">{points?.total_redeemed ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t("totalRedeemed")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Redeem section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" /> {t("redeemPoints")}
            </CardTitle>
            <CardDescription>
              {t("redeemDescription")} ({t("minimumRedeem")}: {MIN_REDEEM} {t("points")})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="number"
                min={MIN_REDEEM}
                max={balance}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder={`${MIN_REDEEM}+`}
                className="max-w-[200px]"
              />
              <Button onClick={handleRedeem} disabled={redeeming || balance < MIN_REDEEM}>
                {redeeming && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {t("redeemNow")}
              </Button>
            </div>
            {redeemAmount && parseInt(redeemAmount) >= MIN_REDEEM && (
              <p className="text-sm text-muted-foreground mt-2">
                {t("youWillGet")}: {redeemAmount} {t("currencySymbol")} {t("couponCode").toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Redemption history */}
        {redemptions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" /> {t("redemptionHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redemptions.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-mono font-medium">{r.coupons?.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()} · {r.points_redeemed} {t("points")} · {r.coupons?.discount_amount} {t("currencySymbol")}
                      </p>
                    </div>
                    <Badge variant="default">{t("active")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" /> {t("submissionHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("noSubmissions")}</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{s.mass_kg} kg → {s.points_earned} {t("points")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={statusColor(s.status)}>
                      {t(s.status as any)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CouponCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        couponCode={celebrationCode}
        pointsRedeemed={celebrationPoints}
      />
    </Layout>
  );
}
