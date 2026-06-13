import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingBag, Box, Coffee, Wine, Layers, Tag, Store } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  ShoppingBag: <ShoppingBag className="h-6 w-6" />,
  Box: <Box className="h-6 w-6" />,
  Coffee: <Coffee className="h-6 w-6" />,
  Wine: <Wine className="h-6 w-6" />,
  Layers: <Layers className="h-6 w-6" />,
  Package: <Package className="h-6 w-6" />,
  Tag: <Tag className="h-6 w-6" />,
};

export default function Index() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*, product_images(image_url, display_order)").eq("status", "active").order("created_at", { ascending: false }).limit(12),
    ]);
    setCategories(catRes.data || []);
    setProducts(prodRes.data || []);
    if (user) {
      const favRes = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      setFavorites((favRes.data || []).map((f) => f.product_id));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getProductImage = (product: any) => {
    const images = product.product_images;
    if (images && images.length > 0) {
      const sorted = [...images].sort((a: any, b: any) => a.display_order - b.display_order);
      return sorted[0].image_url;
    }
    return undefined;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 sm:py-24">
        <div className="container text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{t("heroTitle")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("heroSubtitle")}</p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="ps-10 h-12 text-base"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchQuery) window.location.href = `/catalog?q=${searchQuery}`; }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("categories")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/catalog?category=${cat.slug}`}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent/10 hover:border-primary/20 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {iconMap[cat.icon] || <Package className="h-6 w-6" />}
                </div>
                <span className="text-sm font-medium text-center">
                  {language === "ar" ? cat.name_ar : cat.name_en}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t("products")}</h2>
          <Link to="/catalog">
            <Button variant="outline" size="sm">{t("viewDetails")}</Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                titleEn={p.title_en}
                titleAr={p.title_ar}
                price={p.price}
                minOrderQty={p.min_order_qty}
                stock={p.stock}
                imageUrl={getProductImage(p)}
                isFavorited={favorites.includes(p.id)}
                onFavoriteToggle={fetchData}
              />
            ))}
          </div>
        )}
      </section>

      {/* Become a Seller */}
      <section className="bg-primary/5 border-t">
        <div className="container py-16 text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">{t("becomeSellerTitle")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("becomeSellerSubtitle")}</p>
          <Link to="/register?role=seller">
            <Button size="lg" className="mt-2">{t("becomeSellerCta")}</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
