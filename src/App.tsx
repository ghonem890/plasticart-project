import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareTray } from "@/components/CompareTray";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import SellerOnboarding from "./pages/seller/Onboarding";
import SellerDashboard from "./pages/seller/Dashboard";
import ProductForm from "./pages/seller/ProductForm";
import AdminDashboard from "./pages/admin/Dashboard";
import SellerProfile from "./pages/SellerProfile";
import RecycleSubmit from "./pages/RecycleSubmit";
import Rewards from "./pages/Rewards";
import NotFound from "./pages/NotFound";
import StyleGuide from "./pages/StyleGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <CompareProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/seller/onboarding" element={<SellerOnboarding />} />
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/seller/products/new" element={<ProductForm />} />
                  <Route path="/seller/products/:id/edit" element={<ProductForm />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/seller/:sellerId" element={<SellerProfile />} />
                  <Route path="/recycle" element={<RecycleSubmit />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/style-guide" element={<StyleGuide />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CompareTray />
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
