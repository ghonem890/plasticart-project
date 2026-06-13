import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, FileText, Image, ExternalLink, Loader2, Building2, Truck, Calendar, Package } from "lucide-react";

interface SellerDetailDialogProps {
  seller: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (sellerId: string, status: "approved" | "rejected") => void;
}

interface IntendedProduct {
  id: string;
  product_name: string;
  image_url: string | null;
  signedUrl?: string | null;
}

export function SellerDetailDialog({ seller, open, onOpenChange, onStatusUpdate }: SellerDetailDialogProps) {
  const { t } = useLanguage();
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [intendedProducts, setIntendedProducts] = useState<IntendedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!open || !seller) return;
    setContractUrl(null);
    setIdPhotoUrl(null);
    setIntendedProducts([]);

    const loadSignedUrls = async () => {
      setLoadingDocs(true);
      const promises: Promise<void>[] = [];

      if (seller.contract_document_url) {
        promises.push(
          supabase.storage
            .from("seller-documents")
            .createSignedUrl(seller.contract_document_url, 3600)
            .then(({ data }) => { if (data) setContractUrl(data.signedUrl); })
        );
      }
      if (seller.id_photo_url) {
        promises.push(
          supabase.storage
            .from("seller-documents")
            .createSignedUrl(seller.id_photo_url, 3600)
            .then(({ data }) => { if (data) setIdPhotoUrl(data.signedUrl); })
        );
      }

      await Promise.all(promises);
      setLoadingDocs(false);
    };

    const loadIntendedProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from("seller_intended_products")
        .select("id, product_name, image_url")
        .eq("seller_profile_id", seller.id);

      if (data && data.length > 0) {
        const withUrls = await Promise.all(
          data.map(async (p) => {
            let signedUrl: string | null = null;
            if (p.image_url) {
              const { data: urlData } = await supabase.storage
                .from("seller-documents")
                .createSignedUrl(p.image_url, 3600);
              signedUrl = urlData?.signedUrl ?? null;
            }
            return { ...p, signedUrl };
          })
        );
        setIntendedProducts(withUrls);
      }
      setLoadingProducts(false);
    };

    loadSignedUrls();
    loadIntendedProducts();
  }, [open, seller]);

  if (!seller) return null;

  const statusColor = seller.verification_status === "approved"
    ? "default"
    : seller.verification_status === "rejected"
    ? "destructive"
    : "secondary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {seller.business_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <Badge variant={statusColor} className="text-sm px-3 py-1">
              {seller.verification_status}
            </Badge>
            {seller.verification_status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { onStatusUpdate(seller.id, "approved"); onOpenChange(false); }}>
                  <CheckCircle className="h-4 w-4 me-1" />{t("approve")}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { onStatusUpdate(seller.id, "rejected"); onOpenChange(false); }}>
                  <XCircle className="h-4 w-4 me-1" />{t("reject")}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Name (EN)</p>
              <p className="font-medium">{seller.business_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Name (AR)</p>
              <p className="font-medium" dir="rtl">{seller.business_name_ar || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</p>
              <p className="font-medium">{seller.profiles?.display_name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
              <p className="font-medium">{seller.profiles?.phone || "—"}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" /> Applied</p>
              <p className="font-medium">{new Date(seller.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Description */}
          {(seller.description || seller.description_ar) && (
            <>
              <Separator />
              <div className="space-y-3">
                {seller.description && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description (EN)</p>
                    <p className="text-sm leading-relaxed">{seller.description}</p>
                  </div>
                )}
                {seller.description_ar && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description (AR)</p>
                    <p className="text-sm leading-relaxed" dir="rtl">{seller.description_ar}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Intended Products */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" /> {t("intendedProducts")}
            </h3>

            {loadingProducts && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            )}

            {!loadingProducts && intendedProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noIntendedProducts")}</p>
            )}

            {intendedProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intendedProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg overflow-hidden">
                    {product.signedUrl ? (
                      <img
                        src={product.signedUrl}
                        alt={product.product_name}
                        className="w-full h-24 object-contain bg-muted"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs font-medium p-2 truncate">{product.product_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Uploaded Documents</h3>

            {loadingDocs && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Contract Document</span>
                </div>
                {seller.contract_document_url ? (
                  contractUrl ? (
                    <div className="space-y-2">
                      <div className="bg-muted rounded-md p-3 text-center">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">PDF Document</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={contractUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 me-1" /> Open Document
                        </a>
                      </Button>
                    </div>
                  ) : loadingDocs ? null : (
                    <p className="text-sm text-muted-foreground">Failed to load</p>
                  )
                ) : (
                  <div className="bg-muted/50 rounded-md p-3 text-center">
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  </div>
                )}
              </div>

              {/* ID Photo */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">ID Photo</span>
                </div>
                {seller.id_photo_url ? (
                  idPhotoUrl ? (
                    <div className="space-y-2">
                      <div className="bg-muted rounded-md overflow-hidden">
                        <img
                          src={idPhotoUrl}
                          alt="Seller ID"
                          className="w-full h-40 object-contain"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={idPhotoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 me-1" /> View Full Size
                        </a>
                      </Button>
                    </div>
                  ) : loadingDocs ? null : (
                    <p className="text-sm text-muted-foreground">Failed to load</p>
                  )
                ) : (
                  <div className="bg-muted/50 rounded-md p-3 text-center">
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification notes */}
          {seller.verification_notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin Notes</p>
                <p className="text-sm">{seller.verification_notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
