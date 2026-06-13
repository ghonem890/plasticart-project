import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Plus, X, ImageIcon } from "lucide-react";

interface IntendedProduct {
  name: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function SellerOnboarding() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "", businessNameAr: "",
    description: "", descriptionAr: "",
  });
  const [intendedProducts, setIntendedProducts] = useState<IntendedProduct[]>([
    { name: "", imageFile: null, imagePreview: null },
  ]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from("seller-documents").upload(path, file);
    if (error) throw error;
    return data.path;
  };

  const addIntendedProduct = () => {
    setIntendedProducts([...intendedProducts, { name: "", imageFile: null, imagePreview: null }]);
  };

  const removeIntendedProduct = (index: number) => {
    if (intendedProducts.length <= 1) return;
    setIntendedProducts(intendedProducts.filter((_, i) => i !== index));
  };

  const updateIntendedProduct = (index: number, field: keyof IntendedProduct, value: any) => {
    const updated = [...intendedProducts];
    if (field === "imageFile" && value instanceof File) {
      updated[index].imageFile = value;
      updated[index].imagePreview = URL.createObjectURL(value);
    } else {
      (updated[index] as any)[field] = value;
    }
    setIntendedProducts(updated);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let contractUrl = "";
      let idPhotoUrl = "";

      if (contractFile) {
        contractUrl = await uploadFile(contractFile, `${user.id}/contract-${Date.now()}.pdf`);
      }
      if (idPhotoFile) {
        idPhotoUrl = await uploadFile(idPhotoFile, `${user.id}/id-photo-${Date.now()}`);
      }

      const { data: sellerProfile, error } = await supabase.from("seller_profiles").insert({
        user_id: user.id,
        business_name: form.businessName,
        business_name_ar: form.businessNameAr || null,
        description: form.description || null,
        description_ar: form.descriptionAr || null,
        contract_document_url: contractUrl || null,
        id_photo_url: idPhotoUrl || null,
        shipping_preference: "self_managed",
        verification_status: "pending",
      }).select("id").single();

      if (error) throw error;

      // Upload intended products
      const validProducts = intendedProducts.filter(p => p.name.trim());
      if (validProducts.length > 0 && sellerProfile) {
        const productRows = [];
        for (const product of validProducts) {
          let imageUrl: string | null = null;
          if (product.imageFile) {
            imageUrl = await uploadFile(
              product.imageFile,
              `${user.id}/intended-products/${Date.now()}-${product.imageFile.name}`
            );
          }
          productRows.push({
            seller_profile_id: sellerProfile.id,
            product_name: product.name.trim(),
            image_url: imageUrl,
          });
        }
        const { error: prodError } = await supabase.from("seller_intended_products").insert(productRows);
        if (prodError) throw prodError;
      }

      toast({ title: t("verificationPending") });
      navigate("/seller");
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const TOTAL_STEPS = 4;

  return (
    <Layout>
      <div className="container py-8 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">{t("sellerOnboarding")}</h1>
        
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("step")} 1</CardTitle>
              <CardDescription>{t("businessName")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("businessName")} *</Label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("businessNameAr")}</Label>
                <Input value={form.businessNameAr} onChange={(e) => setForm({ ...form, businessNameAr: e.target.value })} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{t("businessDescription")}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("businessDescriptionAr")}</Label>
                <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
              </div>
              
              <Button className="w-full" onClick={() => setStep(2)} disabled={!form.businessName}>{t("next")}</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("step")} 2</CardTitle>
              <CardDescription>{t("intendedProducts")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {intendedProducts.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    {intendedProducts.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeIntendedProduct(index)}>
                        <X className="h-4 w-4 me-1" />{t("removeProduct")}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("productNameLabel")} *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => updateIntendedProduct(index, "name", e.target.value)}
                      placeholder={t("productNameLabel")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("productImageLabel")}</Label>
                    {product.imagePreview ? (
                      <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                        <img src={product.imagePreview} alt="" className="w-full h-full object-contain" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 end-1 h-6 w-6"
                          onClick={() => {
                            const updated = [...intendedProducts];
                            updated[index].imageFile = null;
                            updated[index].imagePreview = null;
                            setIntendedProducts(updated);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateIntendedProduct(index, "imageFile", file);
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={addIntendedProduct}>
                <Plus className="h-4 w-4 me-1" />{t("addIntendedProduct")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>{t("previous")}</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>{t("next")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("step")} 3</CardTitle>
              <CardDescription>{t("uploadContract")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <input type="file" accept=".pdf" onChange={(e) => setContractFile(e.target.files?.[0] || null)} className="text-sm" />
                {contractFile && <p className="text-sm text-muted-foreground mt-2">{contractFile.name}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>{t("previous")}</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>{t("next")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("step")} 4</CardTitle>
              <CardDescription>{t("uploadIdPhoto")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <input type="file" accept="image/*" onChange={(e) => setIdPhotoFile(e.target.files?.[0] || null)} className="text-sm" />
                {idPhotoFile && <p className="text-sm text-muted-foreground mt-2">{idPhotoFile.name}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>{t("previous")}</Button>
                <Button className="flex-1" onClick={handleComplete} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t("complete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
