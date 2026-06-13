import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Star, Package, Leaf, RefreshCw } from "lucide-react";

export default function SellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { t, language } = useLanguage();
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetchData = async () => {
      // Detect UUID vs slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerId);
      const sellerQuery = isUUID
        ? supabase.from("seller_profiles").select("*").eq("user_id", sellerId).single()
        : supabase.from("seller_profiles").select("*").eq("slug", sellerId).single();

      const sellerRes = await sellerQuery;
      setSeller(sellerRes.data);
      if (!sellerRes.data) { setLoading(false); return; }

      const { data: prodsData } = await supabase
        .from("products")
        .select("*, product_images(image_url, display_order), categories(name_en, name_ar)")
        .eq("seller_id", sellerRes.data.user_id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const prods = prodsData || [];
      setProducts(prods);

      // Fetch all reviews for this seller's products
      if (prods.length > 0) {
        const productIds = prods.map((p: any) => p.id);
        const { data: reviews } = await supabase.from("reviews").select("rating").in("product_id", productIds);
        if (reviews && reviews.length > 0) {
          setAvgRating(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
          setReviewCount(reviews.length);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  if (loading) return <Layout><div className="container py-16 text-center text-muted-foreground">{t("loading")}</div></Layout>;
  if (!seller) return <Layout><div className="container py-16 text-center">{t("noResults")}</div></Layout>;

  const businessName = language === "ar" && seller.business_name_ar ? seller.business_name_ar : seller.business_name;
  const description = language === "ar" && seller.description_ar ? seller.description_ar : seller.description;

  // Eco badge logic
  const recyclableCount = products.filter((p: any) => p.is_recyclable).length;
  const recyclablePct = products.length > 0 ? (recyclableCount / products.length) * 100 : 0;
  const ecoTier = products.length > 0 ? (recyclablePct >= 75 ? 1 : recyclablePct >= 50 ? 2 : 3) : null;

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Seller Header */}
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{businessName}</h1>
                 <Badge variant={seller.verification_status === "approved" ? "default" : "secondary"}>
                   {seller.verification_status === "approved" ? t("verificationApproved") : t("verificationPending")}
                 </Badge>
                 {ecoTier === 1 && (
                   <Badge className="bg-green-600 text-white border-green-600 hover:bg-green-700">
                     <Leaf className="h-3 w-3 me-1" />
                     {t("tier1EcoFriendly")}
                   </Badge>
                 )}
                 {ecoTier === 2 && (
                   <Badge className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600">
                     <RefreshCw className="h-3 w-3 me-1" />
                     {t("tier2EcoFriendly")}
                   </Badge>
                 )}
                 {ecoTier === 3 && (
                   <Badge className="bg-gray-400 text-white border-gray-400 hover:bg-gray-500">
                     <RefreshCw className="h-3 w-3 me-1" />
                     {t("tier3EcoFriendly")}
                   </Badge>
                 )}
               </div>
              {description && <p className="text-muted-foreground">{description}</p>}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
                    <span>({reviewCount} {t("reviews")})</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{products.length} {t("products")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("products")}</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => {
                const sortedImages = (p.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    titleEn={p.title_en}
                    titleAr={p.title_ar}
                    price={p.price}
                    minOrderQty={p.min_order_qty}
                    stock={p.stock}
                    imageUrl={sortedImages[0]?.image_url}
                    categoryName={p.categories ? (language === "ar" ? p.categories.name_ar : p.categories.name_en) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
