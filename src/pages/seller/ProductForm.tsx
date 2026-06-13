import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Camera, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type AiVerdict = {
  isRecyclable: boolean;
  symbolDetected: string | null;
  confidence?: string;
  reasoning?: string;
};

// Resize an image file to max 1024px on its longest edge and return base64 + mime.
async function fileToResizedBase64(file: File, maxSize = 1024): Promise<{ base64: string; mimeType: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = width / height;
    if (width >= height) {
      width = maxSize;
      height = Math.round(maxSize / ratio);
    } else {
      height = maxSize;
      width = Math.round(maxSize * ratio);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", 0.85);
  const base64 = out.split(",")[1] ?? "";
  return { base64, mimeType: "image/jpeg" };
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [form, setForm] = useState({
    titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "",
    price: "", minOrderQty: "1", stock: "0", categoryId: "", tags: "",
  });

  // AI recyclability state
  const [existingRecyclable, setExistingRecyclable] = useState<boolean | null>(null);
  const [symbolFile, setSymbolFile] = useState<File | null>(null);
  const [symbolPreview, setSymbolPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<AiVerdict | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [recyclableToggle, setRecyclableToggle] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories(data || []));

    // Block rejected sellers from adding new products
    if (!isEdit && user) {
      supabase.from("seller_profiles").select("verification_status").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.verification_status === "rejected") {
          toast({ title: t("verificationRejected"), description: t("sellerRejectedNotice"), variant: "destructive" });
          navigate("/seller");
        }
      });
    }
    if (isEdit) {
      supabase.from("products").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            titleEn: data.title_en, titleAr: data.title_ar || "",
            descriptionEn: data.description_en || "", descriptionAr: data.description_ar || "",
            price: String(data.price), minOrderQty: String(data.min_order_qty),
            stock: String(data.stock), categoryId: data.category_id || "",
            tags: (data.tags || []).join(", "),
          });
          setExistingRecyclable(data.is_recyclable ?? false);
          setRecyclableToggle(!!data.is_recyclable);
        }
      });
      supabase.from("product_images").select("*").eq("product_id", id).order("display_order").then(({ data }) => setExistingImages(data || []));
    }
  }, [id]);

  const handleSymbolChange = (file: File | null) => {
    setAiVerdict(null);
    setAiError(null);
    setSymbolFile(file);
    if (symbolPreview) URL.revokeObjectURL(symbolPreview);
    setSymbolPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAnalyze = async () => {
    if (!symbolFile) return;
    setAnalyzing(true);
    setAiError(null);
    setAiVerdict(null);
    try {
      const { base64, mimeType } = await fileToResizedBase64(symbolFile);
      const { data, error } = await supabase.functions.invoke("analyze-recycle-symbol", {
        body: { imageBase64: base64, mimeType },
      });
      if (error) throw error;
      if (!data || typeof data.isRecyclable !== "boolean") {
        throw new Error("Invalid AI response");
      }
      setAiVerdict(data as AiVerdict);
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || t("aiAnalysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Determine recyclability: if toggle is off, product is not recyclable.
    // If toggle is on, AI verdict wins; in edit mode, fall back to existing value.
    let isRecyclable: boolean | null = null;
    if (!recyclableToggle) {
      isRecyclable = false;
    } else if (aiVerdict) {
      isRecyclable = aiVerdict.isRecyclable;
    } else if (isEdit && existingRecyclable) {
      isRecyclable = existingRecyclable;
    }

    if (isRecyclable === null) {
      toast({ title: t("analysisRequired"), variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        seller_id: user.id,
        title_en: form.titleEn,
        title_ar: form.titleAr || null,
        description_en: form.descriptionEn || null,
        description_ar: form.descriptionAr || null,
        price: parseFloat(form.price),
        min_order_qty: parseInt(form.minOrderQty),
        stock: parseInt(form.stock),
        category_id: form.categoryId || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        is_recyclable: isRecyclable,
      };

      let productId = id;

      if (isEdit) {
        const { error } = await supabase.from("products").update(productData).eq("id", id!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Upload new images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const path = `${user.id}/${productId}/${Date.now()}-${i}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
        if (uploadError) continue;

        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        await supabase.from("product_images").insert({
          product_id: productId!,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
        });
      }

      toast({ title: isEdit ? t("productUpdated") : t("productCreated") });
      navigate("/seller");
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const removeExistingImage = async (imageId: string) => {
    await supabase.from("product_images").delete().eq("id", imageId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">{isEdit ? t("editProduct") : t("addProduct")}</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t("productTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("productTitle")} (English) *</Label>
                  <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("productTitleAr")}</Label>
                  <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("productDescription")}</Label>
                  <Textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("productDescriptionAr")}</Label>
                  <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("price")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>{t("productPrice")} *</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("productMinOrder")}</Label>
                    <Input type="number" value={form.minOrderQty} onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("productStock")}</Label>
                    <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("selectCategory")}</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder={t("selectCategory")} /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{language === "ar" ? c.name_ar : c.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("productTags")}</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2, tag3" />
                </div>
              </CardContent>
            </Card>

            {/* AI-locked recyclability verification */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t("recyclabilityVerification")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="recyclable-toggle" className="text-sm font-medium">
                      {language === "ar" ? "هل هذا المنتج قابل لإعادة التدوير؟" : "Is this product recyclable?"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? "قم بالتفعيل للتحقق من قابلية إعادة التدوير باستخدام الذكاء الاصطناعي"
                        : "Turn on to verify recyclability with AI"}
                    </p>
                  </div>
                  <Switch
                    id="recyclable-toggle"
                    checked={recyclableToggle}
                    onCheckedChange={(v) => {
                      setRecyclableToggle(v);
                      if (!v) {
                        setAiVerdict(null);
                        setAiError(null);
                        handleSymbolChange(null);
                      }
                    }}
                  />
                </div>

                {recyclableToggle && (
                  <>
                <p className="text-sm text-muted-foreground">{t("recycleSymbolHint")}</p>

                {isEdit && existingRecyclable !== null && !aiVerdict && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("currentStatus")}:</span>
                    <Badge variant={existingRecyclable ? "default" : "secondary"}>
                      {existingRecyclable ? t("recyclableDetected") : t("notRecyclableDetected")}
                    </Badge>
                  </div>
                )}

                {symbolPreview ? (
                  <div className="relative inline-block">
                    <img src={symbolPreview} alt="recycle symbol" className="h-40 w-40 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => handleSymbolChange(null)}
                      aria-label={t("removeImage")}
                      className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 me-2" />
                          {t("uploadImage")}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSymbolChange(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </Button>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          <Camera className="h-4 w-4 me-2" />
                          {t("takePhoto")}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleSymbolChange(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!symbolFile || analyzing}
                  className="w-full"
                >
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 animate-spin me-2" /> {t("analyzing")}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 me-2" /> {t("analyzeWithAi")}</>
                  )}
                </Button>

                {aiVerdict && (
                  <Alert variant={aiVerdict.isRecyclable ? "default" : "destructive"}>
                    {aiVerdict.isRecyclable ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {aiVerdict.isRecyclable ? t("recyclableDetected") : t("notRecyclableDetected")}
                    </AlertTitle>
                    <AlertDescription>
                      {aiVerdict.symbolDetected && (
                        <div className="mt-1"><strong>{aiVerdict.symbolDetected}</strong></div>
                      )}
                      {aiVerdict.reasoning && <div className="text-xs mt-1 opacity-80">{aiVerdict.reasoning}</div>}
                    </AlertDescription>
                  </Alert>
                )}

                {aiError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>{t("aiAnalysisFailed")}</AlertTitle>
                    <AlertDescription className="text-xs">{aiError}</AlertDescription>
                  </Alert>
                )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("productImages")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-0.5 end-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="text-sm" />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => navigate("/seller")} className="flex-1">{t("cancel")}</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {t("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
