import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Heart, GitCompareArrows, Star, Minus, Plus, Store, Package, MessageSquarePlus, Leaf } from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { addItem: addCompare, isComparing, removeItem: removeCompare } = useCompare();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sellerAvgRating, setSellerAvgRating] = useState(0);
  const [sellerReviewCount, setSellerReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      // Determine if slug is a UUID or a readable slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const prodRes = await supabase.from("products").select("*, categories(name_en, name_ar)").eq(isUuid ? "id" : "slug", slug).single();
      const productId = prodRes.data?.id;
      if (!productId) { setLoading(false); return; }
      const [imgRes, revRes] = await Promise.all([
        supabase.from("product_images").select("*").eq("product_id", productId).order("display_order"),
        supabase.from("reviews").select("*, profiles:buyer_id(display_name)").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      if (prodRes.data) {
        setProduct(prodRes.data);
        setQuantity(prodRes.data.min_order_qty);
        const sellerRes = await supabase.from("seller_profiles").select("*").eq("user_id", prodRes.data.seller_id).single();
        setSeller(sellerRes.data);
        // Fetch all seller's products to calculate seller-wide review stats
        const { data: sellerProducts } = await supabase.from("products").select("id").eq("seller_id", prodRes.data.seller_id).eq("status", "active");
        if (sellerProducts && sellerProducts.length > 0) {
          const sellerProductIds = sellerProducts.map((p: any) => p.id);
          const { data: sellerReviews } = await supabase.from("reviews").select("rating").in("product_id", sellerProductIds);
          if (sellerReviews && sellerReviews.length > 0) {
            setSellerAvgRating(sellerReviews.reduce((s: number, r: any) => s + r.rating, 0) / sellerReviews.length);
            setSellerReviewCount(sellerReviews.length);
          }
        }
      }
      setImages(imgRes.data || []);
      setReviews(revRes.data || []);
      if (user) {
        const favRes = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", productId);
        setIsFavorited((favRes.data || []).length > 0);
        // Check if user purchased this product
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("id, order_id, orders!inner(buyer_id, status)")
          .eq("product_id", productId)
          .eq("orders.buyer_id", user.id);
        const completed = (orderItems || []).some((oi: any) => 
          ["confirmed", "shipped", "completed"].includes(oi.orders?.status)
        );
        setHasPurchased(completed);
        // Check if user already reviewed
        setHasReviewed((revRes.data || []).some((r: any) => r.buyer_id === user.id));
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, user]);

  const handleSubmitReview = async () => {
    if (!user || !product?.id) return;
    setSubmittingReview(true);
    const { data, error } = await supabase.from("reviews").insert({
      product_id: product.id,
      buyer_id: user.id,
      rating: reviewRating,
      comment: reviewComment || null,
    }).select("*, profiles:buyer_id(display_name)").single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setReviews([data, ...reviews]);
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      setHasReviewed(true);
      toast({ title: t("reviews") + " ✓" });
    }
    setSubmittingReview(false);
  };

  if (loading) return <Layout><div className="container py-16 text-center text-muted-foreground">{t("loading")}</div></Layout>;
  if (!product) return <Layout><div className="container py-16 text-center">{t("noResults")}</div></Layout>;

  const title = language === "ar" && product.title_ar ? product.title_ar : product.title_en;
  const desc = language === "ar" && product.description_ar ? product.description_ar : product.description_en;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleAddToCart = () => {
    if (!user) { toast({ title: "Please login first", variant: "destructive" }); return; }
    addItem({
      productId: product.id,
      title: product.title_en,
      titleAr: product.title_ar,
      price: product.price,
      minOrderQty: product.min_order_qty,
      quantity,
      imageUrl: images[0]?.image_url,
    });
    toast({ title: t("addToCart") + " ✓" });
  };

  const handleFavorite = async () => {
    if (!user) return;
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product?.id!);
      setIsFavorited(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product?.id! });
      setIsFavorited(true);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border">
              {images.length > 0 ? (
                <img src={images[selectedImage]?.image_url} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === selectedImage ? "border-primary" : "border-transparent"}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {product.categories && (
              <Badge variant="secondary">{language === "ar" ? product.categories.name_ar : product.categories.name_en}</Badge>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            
            <div className="flex items-center gap-2">
              {avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({reviews.length})</span>
                </div>
              )}
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? t("inStock") : t("outOfStock")}
              </Badge>
            </div>

            <p className="text-3xl font-bold text-primary">{product.price.toLocaleString()} {t("currencySymbol")}</p>
            <p className="text-sm text-muted-foreground">{t("minOrder")}: {product.min_order_qty} {t("pieces")}</p>

            {desc && <p className="text-muted-foreground">{desc}</p>}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t("quantity")}:</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(product.min_order_qty, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input className="w-20 h-8 text-center" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(product.min_order_qty, parseInt(e.target.value) || product.min_order_qty))} />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="h-4 w-4 me-2" />{t("addToCart")}
              </Button>
              <Button variant="outline" size="icon" onClick={handleFavorite}>
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {
                isComparing(product.id) ? removeCompare(product.id) : addCompare({ productId: product.id, title: product.title_en, titleAr: product.title_ar });
              }}>
                <GitCompareArrows className={`h-4 w-4 ${isComparing(product.id) ? "text-primary" : ""}`} />
              </Button>
            </div>

            {/* Recyclable indicator */}
            {product.is_recyclable && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">{language === "ar" ? "منتج قابل لإعادة التدوير" : "Recyclable Product"}</p>
                  <p className="text-sm text-green-700 dark:text-green-400">{language === "ar" ? "هذا المنتج مصنوع من مواد قابلة لإعادة التدوير" : "This product is made from recyclable materials"}</p>
                </div>
              </div>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">{t("specifications")}</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (
                      <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Seller Section */}
        {seller && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4">{t("seller")}</h2>
            <Link to={`/seller/${seller.slug || product.seller_id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        {language === "ar" && seller.business_name_ar ? seller.business_name_ar : seller.business_name}
                      </h3>
                      <Badge variant={seller.verification_status === "approved" ? "default" : "secondary"} className="text-xs">
                        {seller.verification_status === "approved" ? t("verificationApproved") : t("verificationPending")}
                      </Badge>
                    </div>
                    {(language === "ar" ? seller.description_ar : seller.description) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{language === "ar" ? seller.description_ar : seller.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {sellerAvgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{sellerAvgRating.toFixed(1)}</span>
                          <span>({sellerReviewCount})</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-primary font-medium">{t("viewDetails")} →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {/* Reviews */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("reviews")} ({reviews.length})</h2>
            {user && hasPurchased && !hasReviewed && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                <MessageSquarePlus className="h-4 w-4 me-2" />
                {language === "ar" ? "أضف تقييم" : "Add Review"}
              </Button>
            )}
          </div>

          {showReviewForm && (
            <Card className="mb-4">
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{language === "ar" ? "التقييم" : "Rating"}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setReviewRating(i + 1)}>
                        <Star className={`h-6 w-6 cursor-pointer transition-colors ${i < reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted hover:text-yellow-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{language === "ar" ? "تعليق (اختياري)" : "Comment (optional)"}</p>
                  <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={language === "ar" ? "اكتب تعليقك هنا..." : "Write your comment here..."} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} disabled={submittingReview} size="sm">
                    {submittingReview ? (language === "ar" ? "جاري الإرسال..." : "Submitting...") : (language === "ar" ? "إرسال" : "Submit")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reviews.length === 0 && !showReviewForm ? (
            <p className="text-muted-foreground">{t("noReviews")}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                      ))}</div>
                      <span className="text-sm text-muted-foreground">{r.profiles?.display_name}</span>
                    </div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
