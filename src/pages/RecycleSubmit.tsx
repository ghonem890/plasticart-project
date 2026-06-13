import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Recycle, Leaf } from "lucide-react";

const POINTS_PER_KG = 20;
const MAX_MASS_KG = 10000;

export default function RecycleSubmit() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [massKg, setMassKg] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", postalCode: "" });

  const calculatedPoints = Math.floor(Math.max(0, Math.min(parseFloat(massKg) || 0, MAX_MASS_KG)) * POINTS_PER_KG);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    const mass = parseFloat(massKg);
    if (!mass || mass <= 0 || mass > MAX_MASS_KG) {
      toast({ title: t("invalidMass"), variant: "destructive" });
      return;
    }
    if (!phone.trim() || phone.trim().length < 8 || phone.trim().length > 20) {
      toast({ title: t("phoneRequired"), variant: "destructive" });
      return;
    }
    if (!address.street.trim() || !address.city.trim()) {
      toast({ title: t("addressRequired"), variant: "destructive" });
      return;
    }
    if (address.street.length > 200 || address.city.length > 100 || address.state.length > 100) {
      toast({ title: t("inputTooLong"), variant: "destructive" });
      return;
    }

    setLoading(true);
    const points = Math.floor(mass * POINTS_PER_KG);

    const { error } = await supabase.from("recycling_submissions" as any).insert({
      user_id: user.id,
      mass_kg: mass,
      points_earned: points,
      phone: phone.trim(),
      address,
      notes: notes.trim().slice(0, 500) || null,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: t("recyclingSubmitted") });
      navigate("/rewards");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Recycle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("recycleSubmitTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("recycleSubmitSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("recyclingDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("massKg")} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={MAX_MASS_KG}
                  value={massKg}
                  onChange={(e) => setMassKg(e.target.value)}
                  placeholder="e.g. 5.5"
                  required
                />
              </div>
              {parseFloat(massKg) > 0 && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      {t("youWillEarn")}: <span className="text-lg">{calculatedPoints}</span> {t("points")}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      = {calculatedPoints} {t("currencySymbol")} {t("inCoupons")}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  placeholder={t("recyclingNotesPlaceholder")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("contactAndAddress")}</CardTitle>
              <CardDescription>{t("pickupAddressNote")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("phone")} *</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20..."
                  required
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("street")} *</Label>
                <Input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("city")} *</Label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("state")}</Label>
                  <Input
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("postalCode")}</Label>
                <Input
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  maxLength={10}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t("submitRecycling")}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
