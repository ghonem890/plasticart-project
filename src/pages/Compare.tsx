import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompare } from "@/contexts/CompareContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompareArrows, X, DollarSign, Package, Layers, Tag, Eye, Box } from "lucide-react";

export default function Compare() {
  const { t, language } = useLanguage();
  const { items, removeItem, clearAll } = useCompare();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (items.length === 0) { setProducts([]); return; }
    const ids = items.map((i) => i.productId);
    supabase.from("products")
      .select("*, product_images(image_url, display_order), categories(name_en, name_ar)")
      .in("id", ids)
      .then(({ data }) => setProducts(data || []));
  }, [items]);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">
          <GitCompareArrows className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{t("noProductsToCompare")}</p>
          <p className="text-sm mt-2">{t("selectProductsToCompare")}</p>
        </div>
      </Layout>
    );
  }

  const getImage = (p: any) => {
    const imgs = p.product_images;
    if (imgs?.length > 0) return [...imgs].sort((a: any, b: any) => a.display_order - b.display_order)[0].image_url;
    return undefined;
  };

  const allSpecs = new Set<string>();
  products.forEach((p) => { if (p.specs) Object.keys(p.specs).forEach((k) => allSpecs.add(k)); });

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("compareProducts")}</h1>
          <Button variant="outline" size="sm" onClick={clearAll}>{t("clearCompare")}</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-start p-3 text-sm text-muted-foreground w-40"></th>
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-start">
                    <div className="space-y-2">
                      <div className="aspect-square w-32 rounded-lg bg-muted overflow-hidden">
                        {getImage(p) ? <img src={getImage(p)} alt="" className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center"><Box className="h-8 w-8 text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <p className="font-medium text-sm">{language === "ar" && p.title_ar ? p.title_ar : p.title_en}</p>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(p.id)}>
                        <X className="h-3 w-3 me-1" />{t("removeFromCompare")}
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3 text-sm text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{t("price")}</td>
                {products.map((p) => <td key={p.id} className="p-3 font-semibold text-primary">{p.price.toLocaleString()} {t("currencySymbol")}</td>)}
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="p-3 text-sm text-muted-foreground flex items-center gap-1.5"><Layers className="h-4 w-4" />{t("minOrder")}</td>
                {products.map((p) => <td key={p.id} className="p-3">{p.min_order_qty} {t("pieces")}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-3 text-sm text-muted-foreground flex items-center gap-1.5"><Package className="h-4 w-4" />{t("stock")}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    <Badge variant={p.stock > 0 ? "default" : "destructive"}>{p.stock > 0 ? `${t("inStock")} (${p.stock})` : t("outOfStock")}</Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="p-3 text-sm text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />{t("categories")}</td>
                {products.map((p) => <td key={p.id} className="p-3">{p.categories ? (language === "ar" ? p.categories.name_ar : p.categories.name_en) : "-"}</td>)}
              </tr>
              {Array.from(allSpecs).map((spec, i) => (
                <tr key={spec} className={`border-t ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                  <td className="p-3 text-sm text-muted-foreground">{spec}</td>
                  {products.map((p) => <td key={p.id} className="p-3 text-sm">{p.specs?.[spec] || "-"}</td>)}
                </tr>
              ))}
              {/* View button row */}
              <tr className="border-t">
                <td className="p-3 text-sm text-muted-foreground">{t("viewDetails")}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    <Link to={`/product/${p.slug || p.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 me-1" />{t("viewDetails")}
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
