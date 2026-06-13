import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="container py-16 max-w-md text-center">
        <Card>
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">{t("orderConfirmation")}</h1>
            <p className="text-muted-foreground">{t("orderPlaced")}</p>
            <p className="text-sm text-muted-foreground font-mono">#{id?.slice(0, 8)}</p>
            <div className="flex flex-col gap-2 mt-4">
              <Link to="/orders"><Button className="w-full">{t("myOrders")}</Button></Link>
              <Link to="/catalog"><Button variant="outline" className="w-full">{t("continueShopping")}</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
