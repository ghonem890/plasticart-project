import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Package, SlidersHorizontal, X } from "lucide-react";

type SortOption = "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export default function Catalog() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [recyclableOnly, setRecyclableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchProducts = async () => {
    setLoading(true);

    // Determine sort column & direction
    let orderCol = "created_at";
    let ascending = false;
    switch (sortBy) {
      case "oldest": orderCol = "created_at"; ascending = true; break;
      case "price_asc": orderCol = "price"; ascending = true; break;
      case "price_desc": orderCol = "price"; ascending = false; break;
      case "name_asc": orderCol = language === "ar" ? "title_ar" : "title_en"; ascending = true; break;
      case "name_desc": orderCol = language === "ar" ? "title_ar" : "title_en"; ascending = false; break;
      default: break;
    }

    let query = supabase
      .from("products")
      .select("*, product_images(image_url, display_order), categories(name_en, name_ar)")
      .eq("status", "active")
      .gte("price", priceRange[0])
      .lte("price", priceRange[1])
      .order(orderCol, { ascending })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (inStockOnly) {
      query = query.gt("stock", 0);
    }

    if (recyclableOnly) {
      query = query.eq("is_recyclable", true);
    }

    if (search) {
      query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%,description_en.ilike.%${search}%,description_ar.ilike.%${search}%`);
    }

    if (selectedCategory && selectedCategory !== "all") {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) query = query.eq("category_id", cat.id);
    }

    const { data } = await query;
    setProducts(data || []);

    if (user) {
      const favRes = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
      setFavorites((favRes.data || []).map((f) => f.product_id));
    }
    setLoading(false);
  };

  // Fetch categories + determine max price once
  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories(data || []));
    supabase.from("products").select("price").eq("status", "active").order("price", { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const mp = Math.ceil(data[0].price / 100) * 100;
        setMaxPrice(mp);
        setPriceRange([0, mp]);
      }
    });
  }, []);

  useEffect(() => { if (categories.length > 0) fetchProducts(); }, [search, selectedCategory, sortBy, priceRange, inStockOnly, recyclableOnly, page, categories, user]);

  const getImage = (p: any) => {
    const imgs = p.product_images;
    if (imgs?.length > 0) return [...imgs].sort((a: any, b: any) => a.display_order - b.display_order)[0].image_url;
    return undefined;
  };

  const getCategoryName = (p: any) => {
    if (!p.categories) return undefined;
    return language === "ar" ? p.categories.name_ar : p.categories.name_en;
  };

  const hasActiveFilters = selectedCategory !== "all" || inStockOnly || recyclableOnly || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const clearFilters = () => {
    setSelectedCategory("all");
    setInStockOnly(false);
    setRecyclableOnly(false);
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
    setSearch("");
    setPage(1);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t("search")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortNewest")}</SelectItem>
              <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
              <SelectItem value="price_asc">{t("sortPriceLow")}</SelectItem>
              <SelectItem value="price_desc">{t("sortPriceHigh")}</SelectItem>
              <SelectItem value="name_asc">{t("sortNameAZ")}</SelectItem>
              <SelectItem value="name_desc">{t("sortNameZA")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={filtersOpen ? "secondary" : "outline"}
            size="sm"
            className="gap-2 shrink-0 h-10"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("filter")}
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Filters panel */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="rounded-xl border bg-card p-4 mb-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t("filter")}</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={clearFilters}>
                    <X className="h-3 w-3" />{t("clearFilters")}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("categories")}</Label>
                  <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {language === "ar" ? c.name_ar : c.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">{t("priceRange")}</Label>
                  <div className="px-1">
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={Math.max(1, Math.round(maxPrice / 100))}
                      value={priceRange}
                      onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{priceRange[0].toLocaleString()} {t("currencySymbol")}</span>
                    <span>{priceRange[1].toLocaleString()} {t("currencySymbol")}</span>
                  </div>
                </div>

                {/* In Stock toggle */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("availability")}</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={inStockOnly} onCheckedChange={(v) => { setInStockOnly(v); setPage(1); }} />
                    <span className="text-sm">{t("inStockOnly")}</span>
                  </div>
                </div>

                {/* Recyclable toggle */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("recycling")}</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={recyclableOnly} onCheckedChange={(v) => { setRecyclableOnly(v); setPage(1); }} />
                    <span className="text-sm">{t("recyclableOnly")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noResults")}</p>
            {hasActiveFilters && (
              <Button variant="link" className="mt-2" onClick={clearFilters}>{t("clearFilters")}</Button>
            )}
          </div>
        ) : (
          <>
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
                  imageUrl={getImage(p)}
                  categoryName={getCategoryName(p)}
                  isFavorited={favorites.includes(p.id)}
                  onFavoriteToggle={fetchProducts}
                />
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</Button>
              <Button variant="outline" disabled={products.length < pageSize} onClick={() => setPage(page + 1)}>→</Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
