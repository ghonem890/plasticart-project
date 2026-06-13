import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Heart } from "lucide-react";

export default function Favorites() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data: favs } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
    if (!favs || favs.length === 0) { setProducts([]); setLoading(false); return; }
    const ids = favs.map((f) => f.product_id);
    const { data } = await supabase.from("products").select("*, product_images(image_url, display_order)").in("id", ids);
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFavorites(); }, [user]);

  const getImage = (p: any) => {
    const imgs = p.product_images;
    if (imgs?.length > 0) return [...imgs].sort((a: any, b: any) => a.display_order - b.display_order)[0].image_url;
    return undefined;
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{t("favorites")}</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl border bg-card animate-pulse"><div className="aspect-square bg-muted" /><div className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /></div></div>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noFavorites")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id} id={p.id} slug={p.slug} titleEn={p.title_en} titleAr={p.title_ar}
                price={p.price} minOrderQty={p.min_order_qty} stock={p.stock}
                imageUrl={getImage(p)} isFavorited onFavoriteToggle={fetchFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
