import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">{t("brandName")}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">{t("footerAbout")}</p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("footerQuickLinks")}</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("home")}</Link>
              <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("products")}</Link>
              <Link to="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("favorites")}</Link>
              <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("myOrders")}</Link>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-xs text-muted-foreground text-center">
          © {year} {t("brandName")}. {t("footerRights")}
        </p>
      </div>
    </footer>
  );
}
