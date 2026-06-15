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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      equipment: {
        Row: {
          brand: string | null
          category: string
          condition: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string | null
          deposit: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_popular: boolean | null
          last_verified: string | null
          model: string | null
          name: string | null
          operator_id: string
          price_full_day: number | null
          price_half_day: number | null
          price_hourly: number | null
          price_multi_day: number | null
          price_weekly: number | null
          quantity_available: number | null
          quantity_total: number | null
          size: string | null
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          deposit?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          last_verified?: string | null
          model?: string | null
          name?: string | null
          operator_id: string
          price_full_day?: number | null
          price_half_day?: number | null
          price_hourly?: number | null
          price_multi_day?: number | null
          price_weekly?: number | null
          quantity_available?: number | null
          quantity_total?: number | null
          size?: string | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          deposit?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          last_verified?: string | null
          model?: string | null
          name?: string | null
          operator_id?: string
          price_full_day?: number | null
          price_half_day?: number | null
          price_hourly?: number | null
          price_multi_day?: number | null
          price_weekly?: number | null
          quantity_available?: number | null
          quantity_total?: number | null
          size?: string | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          address: string | null
          booking_url: string | null
          categories: string[] | null
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          inventory_sync_type:
            | Database["public"]["Enums"]["inventory_sync_type"]
            | null
          is_active: boolean | null
          last_verified: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          notes_internal: string | null
          offers_delivery: boolean
          offers_demo: boolean
          offers_rental: boolean
          offers_season_lease: boolean
          phone: string | null
          photos: string[] | null
          rating_external: number | null
          rating_external_count: number | null
          slug: string
          state: string | null
          subcategories: string[]
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          booking_url?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          inventory_sync_type?:
            | Database["public"]["Enums"]["inventory_sync_type"]
            | null
          is_active?: boolean | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          notes_internal?: string | null
          offers_delivery?: boolean
          offers_demo?: boolean
          offers_rental?: boolean
          offers_season_lease?: boolean
          phone?: string | null
          photos?: string[] | null
          rating_external?: number | null
          rating_external_count?: number | null
          slug: string
          state?: string | null
          subcategories?: string[]
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          booking_url?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          inventory_sync_type?:
            | Database["public"]["Enums"]["inventory_sync_type"]
            | null
          is_active?: boolean | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          notes_internal?: string | null
          offers_delivery?: boolean
          offers_demo?: boolean
          offers_rental?: boolean
          offers_season_lease?: boolean
          phone?: string | null
          photos?: string[] | null
          rating_external?: number | null
          rating_external_count?: number | null
          slug?: string
          state?: string | null
          subcategories?: string[]
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      equipment_condition: "new" | "excellent" | "good" | "fair"
      inventory_sync_type: "manual" | "api" | "scrape" | "none"
      skill_level: "beginner" | "intermediate" | "advanced" | "all"
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

export const Constants = {
  public: {
    Enums: {
      equipment_condition: ["new", "excellent", "good", "fair"],
      inventory_sync_type: ["manual", "api", "scrape", "none"],
      skill_level: ["beginner", "intermediate", "advanced", "all"],
    },
  },
} as const

// Convenience aliases used across the app.
export type Operator = Tables<"operators">
export type Equipment = Tables<"equipment">
export type SkillLevel = Database["public"]["Enums"]["skill_level"]
