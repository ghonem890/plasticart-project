import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, GitCompareArrows, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  slug?: string | null;
  titleEn: string;
  titleAr?: string | null;
  price: number;
  minOrderQty: number;
  stock: number;
  imageUrl?: string;
  sellerName?: string;
  categoryName?: string;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

export function ProductCard({
  id, slug, titleEn, titleAr, price, minOrderQty, stock,
  imageUrl, sellerName, categoryName, isFavorited, onFavoriteToggle,
}: ProductCardProps) {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const { addItem: addCompare, removeItem: removeCompare, isComparing, isFull } = useCompare();
  const { user } = useAuth();
  const { toast } = useToast();
  const comparing = isComparing(id);
  const title = language === "ar" && titleAr ? titleAr : titleEn;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }
    addItem({
      productId: id,
      title: titleEn,
      titleAr: titleAr || undefined,
      price,
      minOrderQty,
      imageUrl,
      sellerName,
    });
    toast({ title: t("addToCart") + " ✓" });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (comparing) {
      removeCompare(id);
    } else if (!isFull) {
      addCompare({ productId: id, title: titleEn, titleAr: titleAr || undefined });
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
    }
    onFavoriteToggle?.();
  };

  return (
    <Link to={`/product/${slug || id}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-20" />
            </div>
          )}
          {stock === 0 && (
            <Badge variant="destructive" className="absolute top-2 start-2">{t("outOfStock")}</Badge>
          )}
          <div className="absolute top-2 end-2 flex flex-col gap-1">
            {user && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            )}
            <Button
              variant={comparing ? "default" : "secondary"}
              size="icon"
              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCompare}
            >
              <GitCompareArrows className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {categoryName && (
            <span className="text-xs text-muted-foreground">{categoryName}</span>
          )}
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">{title}</h3>
          {sellerName && <p className="text-xs text-muted-foreground">{sellerName}</p>}
          <div className="flex items-end justify-between">
            <div>
              <p className="font-semibold text-primary">
                {price.toLocaleString()} {t("currencySymbol")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("minOrder")}: {minOrderQty} {t("pieces")}
              </p>
            </div>
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddToCart} disabled={stock === 0}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
