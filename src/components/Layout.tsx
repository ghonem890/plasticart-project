import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Package, LogIn, UserPlus, LogOut, ShoppingCart,
  Heart, LayoutDashboard, Menu, X, User, ShoppingBag, Store, Plus, Recycle, Gift
} from "lucide-react";
import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, hasRole } = useAuth();
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellerSlug, setSellerSlug] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!user || !hasRole("seller")) return;
    supabase.from("seller_profiles").select("slug").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.slug) setSellerSlug(data.slug);
    });
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight hidden sm:inline">{t("brandName")}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant={isActive("/") ? "secondary" : "ghost"} size="sm">{t("home")}</Button>
            </Link>
            <Link to="/catalog">
              <Button variant={isActive("/catalog") ? "secondary" : "ghost"} size="sm">{t("products")}</Button>
            </Link>
            {user && hasRole("buyer") && (
              <>
                <Link to="/orders">
                  <Button variant={isActive("/orders") ? "secondary" : "ghost"} size="sm">{t("myOrders")}</Button>
                </Link>
                <Link to="/favorites">
                  <Button variant={isActive("/favorites") ? "secondary" : "ghost"} size="sm">{t("favorites")}</Button>
                </Link>
                <Link to="/recycle">
                  <Button variant={isActive("/recycle") ? "secondary" : "ghost"} size="sm">{t("recycle")}</Button>
                </Link>
                <Link to="/rewards">
                  <Button variant={isActive("/rewards") ? "secondary" : "ghost"} size="sm">{t("rewards")}</Button>
                </Link>
              </>
            )}
            {user && hasRole("seller") && (
              <>
                <Link to={`/seller/${sellerSlug || user.id}`}>
                  <Button variant={location.pathname.startsWith("/seller/" + (sellerSlug || user.id)) ? "secondary" : "ghost"} size="sm">{t("profile")}</Button>
                </Link>
                <Link to="/seller/products/new">
                  <Button variant={isActive("/seller/products/new") ? "secondary" : "ghost"} size="sm">{t("addNew")}</Button>
                </Link>
              </>
            )}
            {user && hasRole("admin") && (
              <Link to="/admin">
                <Button variant={isActive("/admin") ? "secondary" : "ghost"} size="sm">{t("adminDashboard")}</Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            {user && (
              <Link to="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="h-4 w-4" /> {t("favorites")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center gap-2 cursor-pointer">
                      <ShoppingBag className="h-4 w-4" /> {t("myOrders")}
                    </Link>
                  </DropdownMenuItem>
                  {hasRole("seller") && (
                    <DropdownMenuItem asChild>
                      <Link to="/seller" className="flex items-center gap-2 cursor-pointer">
                        <Store className="h-4 w-4" /> {t("sellerDashboard")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" /> {t("admin")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1">
                    <LogIn className="h-4 w-4" />{t("login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="hidden sm:inline-flex gap-1">
                    <UserPlus className="h-4 w-4" />{t("register")}
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-card p-4 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t("home")}</Button>
            </Link>
            <Link to="/catalog" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t("products")}</Button>
            </Link>
            {user && hasRole("buyer") && (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><ShoppingBag className="h-4 w-4" />{t("myOrders")}</Button>
                </Link>
                <Link to="/favorites" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><Heart className="h-4 w-4" />{t("favorites")}</Button>
                </Link>
                <Link to="/recycle" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><Recycle className="h-4 w-4" />{t("recycle")}</Button>
                </Link>
                <Link to="/rewards" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><Gift className="h-4 w-4" />{t("rewards")}</Button>
                </Link>
              </>
            )}
            {user && hasRole("seller") && (
              <>
                <Link to={`/seller/${sellerSlug || user.id}`} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><User className="h-4 w-4" />{t("profile")}</Button>
                </Link>
                <Link to="/seller/products/new" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2"><Plus className="h-4 w-4" />{t("addNew")}</Button>
                </Link>
              </>
            )}
            {user && hasRole("admin") && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2"><LayoutDashboard className="h-4 w-4" />{t("adminDashboard")}</Button>
              </Link>
            )}
            {user && (
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => { signOut(); setMenuOpen(false); }}>
                <LogOut className="h-4 w-4" />{t("logout")}
              </Button>
            )}
            {!user && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{t("login")}</Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">{t("register")}</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
