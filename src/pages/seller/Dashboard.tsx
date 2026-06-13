import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, ShoppingCart, DollarSign, Plus, AlertCircle, Eye, MoreVertical, Power, Trash2 } from "lucide-react";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import { toast } from "@/hooks/use-toast";

export default function SellerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [spRes, prodRes] = await Promise.all([
        supabase.rpc("get_my_seller_profile"),
        supabase.from("products").select("*, product_images(image_url, display_order)").eq("seller_id", user.id).order("created_at", { ascending: false }),
      ]);
      
      const sp = Array.isArray(spRes.data) ? spRes.data[0] : null;
      if (!sp) { navigate("/seller/onboarding"); return; }
      setSellerProfile(sp);
      setProducts(prodRes.data || []);
      
      // Fetch orders that contain this seller's products
      const prodIds = (prodRes.data || []).map((p: any) => p.id);
      if (prodIds.length > 0) {
        const { data: items } = await supabase.from("order_items").select("*, orders(*), products(title_en)").in("product_id", prodIds);
        const uniqueOrders = new Map();
        (items || []).forEach((item: any) => {
          if (item.orders && !uniqueOrders.has(item.orders.id)) {
            uniqueOrders.set(item.orders.id, { ...item.orders, items: [] });
          }
          if (item.orders) uniqueOrders.get(item.orders.id).items.push(item);
        });
        setOrders(Array.from(uniqueOrders.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <Layout><div className="container py-16 text-center text-muted-foreground">{t("loading")}</div></Layout>;

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s: number, o: any) => s + Number(o.total), 0);

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "shipped" | "completed" | "returned" | "refunded" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", productId);
    if (error) return;
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, status: newStatus } : p));
    toast({ title: newStatus === "active" ? t("productActivated") : t("productDeactivated") });
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast({ title: t("productDeleted") });
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { pending: t("pending"), confirmed: t("confirmed"), shipped: t("shipped"), completed: t("completed"), cancelled: t("cancelled") };
    return map[s] || s;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">{t("sellerDashboard")}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={sellerProfile?.verification_status === "approved" ? "default" : sellerProfile?.verification_status === "rejected" ? "destructive" : "secondary"}>
              {sellerProfile?.verification_status === "approved" ? t("verificationApproved") : sellerProfile?.verification_status === "rejected" ? t("verificationRejected") : t("verificationPending")}
            </Badge>
            {sellerProfile?.verification_status !== "rejected" && (
              <Link to="/seller/products/new">
                <Button size="sm"><Plus className="h-4 w-4 me-1" />{t("addProduct")}</Button>
              </Link>
            )}
          </div>
        </div>

        {sellerProfile?.verification_status === "pending" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">{t("verificationPending")} — Your account is being reviewed.</p>
            </CardContent>
          </Card>
        )}

        {sellerProfile?.verification_status === "rejected" && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{t("sellerRejectedNotice")}</p>
                {sellerProfile.verification_notes && (
                  <p className="text-xs text-muted-foreground mt-1">{t("reason")}: {sellerProfile.verification_notes}</p>
                )}
              </div>
              <Link to="/seller/onboarding">
                <Button size="sm" variant="outline">{t("reapply")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-primary" /></div>
              <div className="min-w-0"><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground truncate">{t("totalProducts")}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ShoppingCart className="h-5 w-5 text-primary" /></div>
              <div className="min-w-0"><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground truncate">{t("totalOrders")}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div className="min-w-0"><p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground truncate">{t("totalRevenue")} ({t("currencySymbol")})</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        <h2 className="text-lg font-semibold mb-4">{t("products")}</h2>
        <div className="space-y-3 mb-8">
          {products.map((p) => (
            <Card key={p.id} className={p.status === "disabled" ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {p.product_images?.[0] && <img src={p.product_images[0].image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title_en}</p>
                  <p className="text-sm text-muted-foreground">{p.price.toLocaleString()} {t("currencySymbol")} · {t("stock")}: {p.stock}</p>
                </div>
                <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                <Link to={`/seller/products/${p.id}/edit`} className="hidden sm:block">
                  <Button variant="outline" size="sm">{t("edit")}</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to={`/seller/products/${p.id}/edit`}>
                        <Eye className="h-4 w-4 me-2" />
                        {t("edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleProductStatus(p.id, p.status)}>
                      <Power className="h-4 w-4 me-2" />
                      {p.status === "active" ? t("deactivateProduct") : t("activateProduct")}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 me-2" />
                          {t("deleteProduct")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deleteProduct")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("confirmDelete")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProduct(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders */}
        <h2 className="text-lg font-semibold mb-4">{t("orders")}</h2>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noResults")}</p>
          ) : orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={order.status} onValueChange={(v: any) => updateOrderStatus(order.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending", "confirmed", "shipped", "completed", "cancelled"].map((s) => (
                          <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedOrderId(order.id); setOrderDialogOpen(true); }}>
                      <Eye className="h-4 w-4 me-1" />{t("viewOrder")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.products?.title_en} × {item.quantity}</span>
                      <span>{(item.unit_price * item.quantity).toLocaleString()} {t("currencySymbol")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <OrderDetailDialog orderId={selectedOrderId} open={orderDialogOpen} onOpenChange={setOrderDialogOpen} />
    </Layout>
  );
}
