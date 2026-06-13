import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function Cart() {
  const { t, language } = useLanguage();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg text-muted-foreground mb-4">{t("cartEmpty")}</p>
          <Link to="/catalog"><Button>{t("continueShopping")}</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{t("cart")}</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ShoppingCart className="h-6 w-6 m-auto mt-5 text-muted-foreground opacity-30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-sm">{language === "ar" && item.titleAr ? item.titleAr : item.title}</h3>
                      <p className="text-sm text-primary font-semibold">{item.price.toLocaleString()} {t("currencySymbol")}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm">{(item.price * item.quantity).toLocaleString()} {t("currencySymbol")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={clearCart}>{t("clearCart")}</Button>
          </div>
          <Card className="h-fit">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">{t("orderSummary")}</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-medium">{total.toLocaleString()} {t("currencySymbol")}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold">
                <span>{t("cartTotal")}</span>
                <span className="text-primary">{total.toLocaleString()} {t("currencySymbol")}</span>
              </div>
              <Link to="/checkout" className="block">
                <Button className="w-full">{t("checkout")}</Button>
              </Link>
              <Link to="/catalog" className="block">
                <Button variant="outline" className="w-full">{t("continueShopping")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
