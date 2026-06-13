export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          rate_percentage: number
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          rate_percentage?: number
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          rate_percentage?: number
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_amount: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          message: string
          message_ar: string | null
          metadata: Json | null
          read: boolean
          status: Database["public"]["Enums"]["notification_status"]
          type: string
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message: string
          message_ar?: string | null
          metadata?: Json | null
          read?: boolean
          status?: Database["public"]["Enums"]["notification_status"]
          type: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message?: string
          message_ar?: string | null
          metadata?: Json | null
          read?: boolean
          status?: Database["public"]["Enums"]["notification_status"]
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          notes: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          notes?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          order_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          order_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_recyclable: boolean
          min_order_qty: number
          price: number
          seller_id: string
          slug: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          tags: string[] | null
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_recyclable?: boolean
          min_order_qty?: number
          price: number
          seller_id: string
          slug?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tags?: string[] | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_recyclable?: boolean
          min_order_qty?: number
          price?: number
          seller_id?: string
          slug?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tags?: string[] | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recycling_points: {
        Row: {
          balance: number
          id: string
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recycling_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          points_redeemed: number
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          points_redeemed: number
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          points_redeemed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recycling_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      recycling_submissions: {
        Row: {
          address: Json
          created_at: string
          id: string
          mass_kg: number
          notes: string | null
          phone: string
          points_earned: number
          status: string
          updated_at: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          address?: Json
          created_at?: string
          id?: string
          mass_kg: number
          notes?: string | null
          phone: string
          points_earned: number
          status?: string
          updated_at?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          address?: Json
          created_at?: string
          id?: string
          mass_kg?: number
          notes?: string | null
          phone?: string
          points_earned?: number
          status?: string
          updated_at?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_id_profiles_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_intended_products: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          product_name: string
          seller_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          product_name: string
          seller_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          product_name?: string
          seller_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_intended_products_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          business_name: string
          business_name_ar: string | null
          contract_document_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          id_photo_url: string | null
          shipping_preference: Database["public"]["Enums"]["shipping_preference"]
          slug: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          business_name: string
          business_name_ar?: string | null
          contract_document_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          id_photo_url?: string | null
          shipping_preference?: Database["public"]["Enums"]["shipping_preference"]
          slug?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          business_name?: string
          business_name_ar?: string | null
          contract_document_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          id_photo_url?: string | null
          shipping_preference?: Database["public"]["Enums"]["shipping_preference"]
          slug?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_user_contacts: {
        Args: { _user_ids: string[] }
        Returns: {
          display_name: string
          phone: string
          user_id: string
        }[]
      }
      admin_list_seller_profiles: {
        Args: never
        Returns: {
          business_name: string
          business_name_ar: string | null
          contract_document_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          id_photo_url: string | null
          shipping_preference: Database["public"]["Enums"]["shipping_preference"]
          slug: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "seller_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      approve_recycling_submission: {
        Args: { _admin_id: string; _submission_id: string }
        Returns: undefined
      }
      get_my_seller_profile: {
        Args: never
        Returns: {
          business_name: string
          business_name_ar: string | null
          contract_document_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          id_photo_url: string | null
          shipping_preference: Database["public"]["Enums"]["shipping_preference"]
          slug: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "seller_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_order_buyer_contact: {
        Args: { _order_id: string }
        Returns: {
          display_name: string
          phone: string
        }[]
      }
      get_seller_order_ids: { Args: { _seller_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_recycling_points: {
        Args: { _points: number; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "seller" | "buyer"
      discount_type: "percentage" | "fixed"
      notification_channel: "email" | "whatsapp"
      notification_status: "pending" | "sent" | "failed"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "completed"
        | "returned"
        | "refunded"
        | "cancelled"
      payment_status: "pending" | "confirmed" | "failed"
      product_status: "active" | "disabled"
      shipping_preference: "self_managed" | "platform_provided"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "seller", "buyer"],
      discount_type: ["percentage", "fixed"],
      notification_channel: ["email", "whatsapp"],
      notification_status: ["pending", "sent", "failed"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "completed",
        "returned",
        "refunded",
        "cancelled",
      ],
      payment_status: ["pending", "confirmed", "failed"],
      product_status: ["active", "disabled"],
      shipping_preference: ["self_managed", "platform_provided"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
