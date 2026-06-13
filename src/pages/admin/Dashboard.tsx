import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Package, ShoppingCart, DollarSign, CheckCircle, XCircle, Shield, Eye, Pencil, Recycle } from "lucide-react";
import { SellerDetailDialog } from "@/components/admin/SellerDetailDialog";
import { OrderDetailDialog } from "@/components/OrderDetailDialog";
import { RecyclingTab } from "@/components/admin/RecyclingTab";

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const { user, hasRole, roles } = useAuth();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [recyclingSubmissions, setRecyclingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [couponFilter, setCouponFilter] = useState<"all" | "admin" | "user">("all");
  
  // New/edit category form
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatAr, setNewCatAr] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  
  // New coupon form
  const [newCoupon, setNewCoupon] = useState({ code: "", discountType: "percentage" as "percentage" | "fixed", discountAmount: "", maxUses: "", minOrderAmount: "" });

  useEffect(() => {
    if (!user || !hasRole("admin")) return;
    const fetchData = async () => {
    const [sRes, pRes, oRes, cRes, cpRes, rRes] = await Promise.all([
        supabase.rpc("admin_list_seller_profiles"),
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("recycling_submissions").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const sellerData = (sRes.data as any[]) || [];
      let profilesMap: Record<string, any> = {};
      if (sellerData.length > 0) {
        const userIds = sellerData.map((s: any) => s.user_id);
        const { data: profilesData } = await supabase
          .rpc("admin_get_user_contacts", { _user_ids: userIds });
        if (profilesData) {
          (profilesData as any[]).forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
      }
      setSellers(sellerData.map((s: any) => ({ ...s, profiles: profilesMap[s.user_id] || null })));
      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
      setCategories(cRes.data || []);

      // Enrich coupons with creator profile data
      const couponsData = cpRes.data || [];
      if (couponsData.length > 0) {
        const creatorIds = [...new Set(couponsData.filter((c: any) => c.created_by).map((c: any) => c.created_by))];
        let creatorMap: Record<string, any> = {};
        if (creatorIds.length > 0) {
          const { data: creatorProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", creatorIds);
          creatorProfiles?.forEach((p: any) => { creatorMap[p.user_id] = p; });
        }
        setCoupons(couponsData.map((c: any) => ({ ...c, creator_profile: creatorMap[c.created_by] || null })));
      } else {
        setCoupons([]);
      }

      // Enrich recycling submissions with profile data
      const recyclingData = rRes.data || [];
      if (recyclingData.length > 0) {
        const rUserIds = [...new Set(recyclingData.map((r: any) => r.user_id))] as string[];
        const { data: rProfiles } = await supabase
          .rpc("admin_get_user_contacts", { _user_ids: rUserIds });
        const rMap: Record<string, any> = {};
        (rProfiles as any[] | null)?.forEach((p: any) => { rMap[p.user_id] = p; });
        setRecyclingSubmissions(recyclingData.map((r: any) => ({ ...r, profile: rMap[r.user_id] || null })));
      } else {
        setRecyclingSubmissions([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, roles]);

  if (!hasRole("admin")) {
    return <Layout><div className="container py-16 text-center"><Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" /><p>Access denied</p></div></Layout>;
  }

  const pendingSellers = sellers.filter((s) => s.verification_status === "pending");
  const pendingRecycling = recyclingSubmissions.filter((s: any) => s.status === "pending");
  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + Number(o.total), 0);

  const updateSellerStatus = async (sellerId: string, status: "approved" | "rejected") => {
    await supabase.from("seller_profiles").update({ verification_status: status }).eq("id", sellerId);
    setSellers((prev) => prev.map((s) => s.id === sellerId ? { ...s, verification_status: status } : s));
    toast({ title: `Seller ${status}` });
  };

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "shipped" | "completed" | "returned" | "refunded" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const addCategory = async () => {
    if (!newCatEn || !newCatAr || !newCatSlug) return;
    if (editingCatId) {
      const { error } = await supabase.from("categories").update({ name_en: newCatEn, name_ar: newCatAr, slug: newCatSlug }).eq("id", editingCatId);
      if (error) { toast({ title: error.message, variant: "destructive" }); return; }
      setCategories((prev) => prev.map((c) => c.id === editingCatId ? { ...c, name_en: newCatEn, name_ar: newCatAr, slug: newCatSlug } : c));
      setEditingCatId(null);
      toast({ title: "Category updated" });
    } else {
      const { data, error } = await supabase.from("categories").insert({ name_en: newCatEn, name_ar: newCatAr, slug: newCatSlug, sort_order: categories.length }).select().single();
      if (error) { toast({ title: error.message, variant: "destructive" }); return; }
      setCategories([...categories, data]);
      toast({ title: "Category added" });
    }
    setNewCatEn(""); setNewCatAr(""); setNewCatSlug("");
  };

  const startEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setNewCatEn(cat.name_en);
    setNewCatAr(cat.name_ar);
    setNewCatSlug(cat.slug);
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatEn(""); setNewCatAr(""); setNewCatSlug("");
  };

  const deleteCategory = async (catId: string) => {
    await supabase.from("categories").delete().eq("id", catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const addCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountAmount) return;
    const { data, error } = await supabase.from("coupons").insert({
      code: newCoupon.code.toUpperCase(),
      discount_type: newCoupon.discountType,
      discount_amount: parseFloat(newCoupon.discountAmount),
      max_uses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
      min_order_amount: newCoupon.minOrderAmount ? parseFloat(newCoupon.minOrderAmount) : 0,
      created_by: user?.id,
    } as any).select().single();
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setCoupons([data, ...coupons]);
    setNewCoupon({ code: "", discountType: "percentage", discountAmount: "", maxUses: "", minOrderAmount: "" });
    toast({ title: "Coupon created" });
  };

  const toggleCoupon = async (couponId: string, isActive: boolean) => {
    await supabase.from("coupons").update({ is_active: !isActive }).eq("id", couponId);
    setCoupons((prev) => prev.map((c) => c.id === couponId ? { ...c, is_active: !isActive } : c));
  };

  if (loading) return <Layout><div className="container py-16 text-center text-muted-foreground">{t("loading")}</div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{t("adminDashboard")}</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{sellers.length}</p><p className="text-xs text-muted-foreground">{t("totalUsers")}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">{t("totalProducts")}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">{t("totalOrders")}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">{t("totalRevenue")}</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="sellers">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsTrigger value="sellers" className="shrink-0 sm:flex-1 text-xs sm:text-sm">{t("sellerVerification")} {pendingSellers.length > 0 && `(${pendingSellers.length})`}</TabsTrigger>
            <TabsTrigger value="orders" className="shrink-0 sm:flex-1 text-xs sm:text-sm">{t("orders")}</TabsTrigger>
            <TabsTrigger value="categories" className="shrink-0 sm:flex-1 text-xs sm:text-sm">{t("categories")}</TabsTrigger>
            <TabsTrigger value="coupons" className="shrink-0 sm:flex-1 text-xs sm:text-sm">{t("couponManagement")}</TabsTrigger>
            <TabsTrigger value="recycling" className="shrink-0 sm:flex-1 text-xs sm:text-sm">
              <Recycle className="h-4 w-4 me-1 hidden sm:inline" />
              {t("recycling")} {pendingRecycling.length > 0 && `(${pendingRecycling.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Sellers */}
          <TabsContent value="sellers" className="space-y-4">
            {sellers.map((s) => (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedSeller(s); setSellerDialogOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.business_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{s.profiles?.display_name} · {s.profiles?.phone}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {s.contract_document_url && <Badge variant="outline">Contract ✓</Badge>}
                        {s.id_photo_url && <Badge variant="outline">ID ✓</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={s.verification_status === "approved" ? "default" : s.verification_status === "rejected" ? "destructive" : "secondary"}>
                        {s.verification_status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedSeller(s); setSellerDialogOpen(true); }}>
                        <Eye className="h-4 w-4 me-1" /> Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-sm">#{o.id.slice(0, 8)}</span>
                      <span className="ms-2 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                      <p className="text-sm font-semibold mt-1">{o.total.toLocaleString()} {t("currencySymbol")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Select value={o.status} onValueChange={(v: any) => updateOrderStatus(o.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pending", "confirmed", "shipped", "completed", "returned", "refunded", "cancelled"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrderId(o.id); setOrderDialogOpen(true); }}>
                        <Eye className="h-4 w-4 me-1" />{t("viewOrder")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1"><Label>English</Label><Input value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Arabic</Label><Input value={newCatAr} onChange={(e) => setNewCatAr(e.target.value)} dir="rtl" /></div>
                  <div className="space-y-1"><Label>Slug</Label><Input value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} /></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={addCategory} className="w-full sm:w-auto">{editingCatId ? t("save") : "Add"}</Button>
                  {editingCatId && <Button variant="outline" onClick={cancelEditCategory}>Cancel</Button>}
                </div>
              </CardContent>
            </Card>
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="font-medium">{c.name_en}</p><p className="text-sm text-muted-foreground">{c.name_ar} · /{c.slug}</p></div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEditCategory(c)}><Pencil className="h-4 w-4 me-1" />{t("edit")}</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteCategory(c.id)}>{t("delete")}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Coupons */}
          <TabsContent value="coupons" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                  <div className="space-y-1"><Label>Code</Label><Input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Type</Label>
                    <Select value={newCoupon.discountType} onValueChange={(v: "percentage" | "fixed") => setNewCoupon({ ...newCoupon, discountType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Amount</Label><Input type="number" value={newCoupon.discountAmount} onChange={(e) => setNewCoupon({ ...newCoupon, discountAmount: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Max Uses</Label><Input type="number" value={newCoupon.maxUses} onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })} /></div>
                </div>
                <Button onClick={addCoupon} className="mt-2 w-full sm:w-auto">Add</Button>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant={couponFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCouponFilter("all")}>{t("all")}</Button>
              <Button variant={couponFilter === "admin" ? "default" : "outline"} size="sm" onClick={() => setCouponFilter("admin")}>{t("adminCreated")}</Button>
              <Button variant={couponFilter === "user" ? "default" : "outline"} size="sm" onClick={() => setCouponFilter("user")}>{t("userRedeemed")}</Button>
            </div>
            {coupons.filter((c) => couponFilter === "all" ? true : couponFilter === "user" ? c.code.startsWith("RECYCLE-") : !c.code.startsWith("RECYCLE-")).map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-medium">{c.code}</p>
                      <Badge variant={c.code.startsWith("RECYCLE-") ? "secondary" : "outline"}>
                        {c.code.startsWith("RECYCLE-") ? t("userRedeemed") : t("adminCreated")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_amount}%` : `${c.discount_amount} EGP`}
                      {c.max_uses && ` · ${c.used_count}/${c.max_uses} uses`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.creator_profile?.display_name
                        ? `${t("createdBy")}: ${c.creator_profile.display_name}`
                        : c.created_by
                        ? `${t("createdBy")}: ${c.created_by.slice(0, 8)}...`
                        : ""}
                      {c.created_at && ` · ${new Date(c.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant={c.is_active ? "destructive" : "default"} size="sm" onClick={() => toggleCoupon(c.id, c.is_active)}>
                    {c.is_active ? t("disable") : t("enable")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {/* Recycling */}
          <TabsContent value="recycling">
            <RecyclingTab
              submissions={recyclingSubmissions}
              onUpdate={(id, status) =>
                setRecyclingSubmissions((prev) =>
                  prev.map((s: any) => (s.id === id ? { ...s, status } : s))
                )
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <SellerDetailDialog
        seller={selectedSeller}
        open={sellerDialogOpen}
        onOpenChange={setSellerDialogOpen}
        onStatusUpdate={updateSellerStatus}
      />
      <OrderDetailDialog orderId={selectedOrderId} open={orderDialogOpen} onOpenChange={setOrderDialogOpen} />
    </Layout>
  );
}
