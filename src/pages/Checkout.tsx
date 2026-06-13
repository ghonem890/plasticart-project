import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

export default function Checkout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", state: "", postalCode: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode) return;
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!data) {
      toast({ title: "Invalid coupon", variant: "destructive" });
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "Coupon expired", variant: "destructive" });
      return;
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      toast({ title: "Coupon exhausted", variant: "destructive" });
      return;
    }
    if (data.min_order_amount && total < data.min_order_amount) {
      toast({ title: `Minimum order: ${data.min_order_amount} EGP`, variant: "destructive" });
      return;
    }

    const disc = data.discount_type === "percentage"
      ? (total * data.discount_amount) / 100
      : data.discount_amount;
    setDiscount(Math.min(disc, total));
    setCouponApplied(true);
    toast({ title: "Coupon applied!" });
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;
    if (!address.street || !address.city || !address.phone) {
      toast({ title: "Please fill shipping address", variant: "destructive" });
      return;
    }

    setLoading(true);
    const finalTotal = total - discount;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        total: finalTotal,
        shipping_address: address,
        status: "pending",
      })
      .select()
      .single();

    if (error || !order) {
      toast({ title: error?.message || "Error", variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("payments").insert({
      order_id: order.id,
      method: "offline",
      status: "pending",
      amount: finalTotal,
    });

    clearCart();
    toast({ title: t("orderPlaced") });
    navigate(`/order-confirmation/${order.id}`);
    setLoading(false);
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{t("checkout")}</h1>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("shippingAddress")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required placeholder="+20..." />
              </div>
              <div className="space-y-2">
                <Label>{t("street")}</Label>
                <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("city")}</Label>
                  <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("state")}</Label>
                  <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("postalCode")}</Label>
                <Input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("couponCode")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder={t("couponCode")} value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={couponApplied} />
                <Button variant="outline" onClick={applyCoupon} disabled={couponApplied}>{t("apply")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("paymentMethod")}</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="font-medium">{t("offlinePayment")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("offlinePaymentNote")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("orderSummary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.title} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString()} {t("currencySymbol")}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span>{total.toLocaleString()} {t("currencySymbol")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t("discount")}</span>
                  <span>-{discount.toLocaleString()} {t("currencySymbol")}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>{t("cartTotal")}</span>
                <span className="text-primary">{(total - discount).toLocaleString()} {t("currencySymbol")}</span>
              </div>
              <Button className="w-full mt-4" onClick={handlePlaceOrder} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {t("placeOrder")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
