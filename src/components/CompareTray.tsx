// Compare tray floating component
import { Link, useLocation } from "react-router-dom";
import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { X, GitCompareArrows } from "lucide-react";

export function CompareTray() {
  const { items, removeItem, clearAll } = useCompare();
  const { t, language } = useLanguage();
  const location = useLocation();

  if (items.length === 0 || location.pathname === "/compare") return null;

  return (
    <div className="fixed bottom-4 start-4 end-4 z-50 mx-auto max-w-lg">
      <div className="rounded-xl border bg-card shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("compare")} ({items.length}/4)</span>
          </div>
          <div className="flex gap-1">
            <Link to="/compare">
              <Button size="sm">{t("compareProducts")}</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs">
              <span className="truncate max-w-24">
                {language === "ar" && item.titleAr ? item.titleAr : item.title}
              </span>
              <button onClick={() => removeItem(item.productId)}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
