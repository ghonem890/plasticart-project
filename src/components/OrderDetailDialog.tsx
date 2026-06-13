import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, User, Calendar, Package, Phone } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<any>(null);
  const [buyerProfile, setBuyerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId || !open) return;
    setLoading(true);
    const fetchOrder = async () => {
      const [orderRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*, products(title_en, title_ar, price))")
          .eq("id", orderId)
          .single(),
      ]);

      const orderData = orderRes.data;
      setOrder(orderData);

      if (orderData?.id) {
        const { data: profile } = await supabase
          .rpc("get_order_buyer_contact", { _order_id: orderData.id });
        const row = Array.isArray(profile) ? profile[0] : null;
        setBuyerProfile(row ?? null);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId, open]);

  const address = order?.shipping_address as Record<string, string> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("orderSummary")} {order && <span className="font-mono text-muted-foreground text-sm">#{order.id.slice(0, 8)}</span>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : order ? (
          <div className="space-y-4">
            {/* Status & Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </div>
              <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
            </div>

            <Separator />

            {/* Buyer Info */}
            {(buyerProfile || address?.phone) && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" /> {t("buyer")}
                </h4>
                {buyerProfile?.display_name && <p className="text-sm text-muted-foreground">{buyerProfile.display_name}</p>}
                {address?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {address.phone}
                  </p>
                )}
              </div>
            )}

            {/* Shipping Address */}
            {address && Object.keys(address).length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {t("shippingAddress")}
                </h4>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {address.street && <p>{address.street}</p>}
                  {(address.city || address.state) && (
                    <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
                  )}
                  {address.country && <p>{address.country}</p>}
                </div>
              </div>
            )}

            <Separator />

            {/* Order Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t("products")}</h4>
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="flex-1">
                    {language === "ar" ? (item.products?.title_ar || item.products?.title_en) : item.products?.title_en}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    {(item.unit_price * item.quantity).toLocaleString()} {t("currencySymbol")}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between font-semibold">
              <span>{t("cartTotal")}</span>
              <span className="text-primary">{order.total.toLocaleString()} {t("currencySymbol")}</span>
            </div>


            {/* Notes */}
            {order.notes && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{t("notes") || "Notes"}</h4>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
