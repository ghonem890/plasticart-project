import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, order_items(*, products(title_en, title_ar))")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t("pending"), confirmed: t("confirmed"), shipped: t("shipped"),
      completed: t("completed"), returned: t("returned"), refunded: t("refunded"), cancelled: t("cancelled"),
    };
    return map[status] || status;
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{t("myOrders")}</h1>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noResults")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="text-sm text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                      <span className="text-sm text-muted-foreground ms-3">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusColors[order.status]}>{getStatusLabel(order.status)}</Badge>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrderId(order.id); setDialogOpen(true); }}>
                        <Eye className="h-4 w-4 me-1" />{t("viewOrder")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products?.title_en} × {item.quantity}</span>
                        <span>{(item.unit_price * item.quantity).toLocaleString()} {t("currencySymbol")}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>{t("cartTotal")}</span>
                    <span className="text-primary">{order.total.toLocaleString()} {t("currencySymbol")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <OrderDetailDialog orderId={selectedOrderId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
