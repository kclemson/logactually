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
      custom_log_entries: {
        Row: {
          created_at: string
          id: string
          log_type_id: string
          logged_date: string
          numeric_value: number | null
          numeric_value_2: number | null
          text_value: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_type_id: string
          logged_date?: string
          numeric_value?: number | null
          numeric_value_2?: number | null
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_type_id?: string
          logged_date?: string
          numeric_value?: number | null
          numeric_value_2?: number | null
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_log_entries_log_type_id_fkey"
            columns: ["log_type_id"]
            isOneToOne: false
            referencedRelation: "custom_log_types"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_log_types: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          unit: string | null
          updated_at: string
          user_id: string
          value_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
          user_id: string
          value_type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
          value_type?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          feedback_id: number
          id: string
          message: string
          read_at: string | null
          resolved_at: string | null
          resolved_reason: string | null
          responded_at: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id?: number
          id?: string
          message: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_reason?: string | null
          responded_at?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: number
          id?: string
          message?: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_reason?: string | null
          responded_at?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          created_at: string
          eaten_date: string
          food_items: Json
          group_name: string | null
          group_portion_multiplier: number | null
          id: string
          raw_input: string | null
          source_meal_id: string | null
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          eaten_date?: string
          food_items?: Json
          group_name?: string | null
          group_portion_multiplier?: number | null
          id?: string
          raw_input?: string | null
          source_meal_id?: string | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          eaten_date?: string
          food_items?: Json
          group_name?: string | null
          group_portion_multiplier?: number | null
          id?: string
          raw_input?: string | null
          source_meal_id?: string | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_source_meal_id_fkey"
            columns: ["source_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_chats: {
        Row: {
          answer: string
          created_at: string
          id: string
          mode: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          mode: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          mode?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_read_only: boolean
          settings: Json | null
          updated_at: string
          user_number: number
        }
        Insert: {
          created_at?: string
          id: string
          is_read_only?: boolean
          settings?: Json | null
          updated_at?: string
          user_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_read_only?: boolean
          settings?: Json | null
          updated_at?: string
          user_number?: number
        }
        Relationships: []
      }
      prompt_tests: {
        Row: {
          actual_output: Json
          additional_context: string | null
          created_at: string
          id: string
          is_hallucination: boolean | null
          latency_ms: number | null
          prompt_version: string
          run_id: string
          source: string | null
          test_input: string
        }
        Insert: {
          actual_output: Json
          additional_context?: string | null
          created_at?: string
          id?: string
          is_hallucination?: boolean | null
          latency_ms?: number | null
          prompt_version: string
          run_id: string
          source?: string | null
          test_input: string
        }
        Update: {
          actual_output?: Json
          additional_context?: string | null
          created_at?: string
          id?: string
          is_hallucination?: boolean | null
          latency_ms?: number | null
          prompt_version?: string
          run_id?: string
          source?: string | null
          test_input?: string
        }
        Relationships: []
      }
      saved_charts: {
        Row: {
          chart_spec: Json
          created_at: string
          id: string
          question: string
          sort_order: number
          user_id: string
        }
        Insert: {
          chart_spec: Json
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          user_id: string
        }
        Update: {
          chart_spec?: Json
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string | null
          food_items: Json
          id: string
          input_signature: string | null
          items_signature: string | null
          last_used_at: string | null
          name: string
          original_input: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          food_items?: Json
          id?: string
          input_signature?: string | null
          items_signature?: string | null
          last_used_at?: string | null
          name: string
          original_input?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          food_items?: Json
          id?: string
          input_signature?: string | null
          items_signature?: string | null
          last_used_at?: string | null
          name?: string
          original_input?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      saved_routines: {
        Row: {
          created_at: string
          exercise_sets: Json
          id: string
          is_auto_named: boolean
          last_used_at: string | null
          name: string
          original_input: string | null
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_sets?: Json
          id?: string
          is_auto_named?: boolean
          last_used_at?: string | null
          name: string
          original_input?: string | null
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_sets?: Json
          id?: string
          is_auto_named?: boolean
          last_used_at?: string | null
          name?: string
          original_input?: string | null
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weight_sets: {
        Row: {
          created_at: string
          description: string
          distance_miles: number | null
          duration_minutes: number | null
          entry_id: string
          exercise_key: string
          exercise_metadata: Json | null
          exercise_subtype: string | null
          group_name: string | null
          id: string
          logged_date: string
          raw_input: string | null
          reps: number
          sets: number
          source_routine_id: string | null
          updated_at: string
          user_id: string
          weight_lbs: number
        }
        Insert: {
          created_at?: string
          description: string
          distance_miles?: number | null
          duration_minutes?: number | null
          entry_id: string
          exercise_key: string
          exercise_metadata?: Json | null
          exercise_subtype?: string | null
          group_name?: string | null
          id?: string
          logged_date?: string
          raw_input?: string | null
          reps?: number
          sets?: number
          source_routine_id?: string | null
          updated_at?: string
          user_id: string
          weight_lbs?: number
        }
        Update: {
          created_at?: string
          description?: string
          distance_miles?: number | null
          duration_minutes?: number | null
          entry_id?: string
          exercise_key?: string
          exercise_metadata?: Json | null
          exercise_subtype?: string | null
          group_name?: string | null
          id?: string
          logged_date?: string
          raw_input?: string | null
          reps?: number
          sets?: number
          source_routine_id?: string | null
          updated_at?: string
          user_id?: string
          weight_lbs?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_login_count: {
        Args: { timeframe_hours?: number; user_filter?: string }
        Returns: number
      }
      get_top_exercises: {
        Args: {
          p_cardio_keys: string[]
          p_limit_per_group?: number
          p_user_id: string
        }
        Returns: {
          description: string
          distance_miles: number
          duration_minutes: number
          exercise_key: string
          exercise_metadata: Json
          exercise_subtype: string
          frequency: number
          is_cardio: boolean
          reps: number
          sets: number
          weight_lbs: number
        }[]
      }
      get_usage_stats:
        | { Args: { exclude_user_id?: string }; Returns: Json }
        | {
            Args: { include_read_only?: boolean; user_timezone?: string }
            Returns: Json
          }
      get_user_stats:
        | { Args: { exclude_user_id?: string }; Returns: Json }
        | {
            Args: { include_read_only?: boolean; user_timezone?: string }
            Returns: Json
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_login_count: { Args: { user_id: string }; Returns: undefined }
      is_read_only_user: { Args: { _user_id: string }; Returns: boolean }
      toggle_demo_read_only: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
