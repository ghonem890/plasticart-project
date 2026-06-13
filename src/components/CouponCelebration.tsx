import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { Gift, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface CouponCelebrationProps {
  open: boolean;
  onClose: () => void;
  couponCode: string;
  pointsRedeemed: number;
}

export function CouponCelebration({ open, onClose, couponCode, pointsRedeemed }: CouponCelebrationProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      setCopied(false);
      setShowContent(false);
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0 [&>button]:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/80 dark:to-emerald-900/60 border border-green-200 dark:border-green-800 p-8 text-center">
          {/* Floating particles */}
          {open && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <span
                  key={i}
                  className="absolute text-green-400/60 dark:text-green-300/40 animate-bounce"
                  style={{
                    left: `${8 + (i * 7.5) % 85}%`,
                    top: `${10 + (i * 13) % 70}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                    fontSize: `${10 + (i % 4) * 4}px`,
                  }}
                >
                  {i % 3 === 0 ? "✦" : i % 3 === 1 ? "•" : "✧"}
                </span>
              ))}
            </div>
          )}

          {/* Icon */}
          <div
            className={`mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-700 ${
              showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <Gift className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <div
            className={`transition-all duration-500 delay-200 ${
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200">
                {t("redeemSuccess")}
              </h2>
              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-green-700/80 dark:text-green-300/80 mb-6">
              {pointsRedeemed} {t("points")} → {pointsRedeemed} {t("currencySymbol")}
            </p>
          </div>

          {/* Coupon code */}
          <div
            className={`transition-all duration-500 delay-400 ${
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <div
              onClick={handleCopy}
              className="cursor-pointer mx-auto max-w-xs rounded-xl bg-white dark:bg-green-900/50 border-2 border-dashed border-green-400 dark:border-green-600 px-6 py-4 mb-4 group hover:border-green-500 transition-colors"
            >
              <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium uppercase tracking-wider">
                {t("couponCode")}
              </p>
              <p className="text-2xl font-mono font-bold tracking-widest text-green-700 dark:text-green-300 group-hover:scale-105 transition-transform">
                {couponCode}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {copied ? "✓ Copied!" : "Click to copy"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <div
            className={`transition-all duration-500 delay-500 ${
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
            >
              {t("done") || "Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
