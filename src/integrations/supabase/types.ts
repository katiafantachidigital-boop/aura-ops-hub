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
      checklist_occurrences: {
        Row: {
          action_taken: string | null
          checklist_id: string
          created_at: string
          id: string
          occurrence: string
        }
        Insert: {
          action_taken?: string | null
          checklist_id: string
          created_at?: string
          id?: string
          occurrence: string
        }
        Update: {
          action_taken?: string | null
          checklist_id?: string
          created_at?: string
          id?: string
          occurrence?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_occurrences_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "daily_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklists: {
        Row: {
          behavior_clear_communication: boolean | null
          behavior_no_conflicts: boolean | null
          behavior_positive_climate: boolean | null
          behavior_proactivity: boolean | null
          behavior_quiet_environment: boolean | null
          checklist_date: string
          cleaning_bathrooms: boolean | null
          cleaning_common_areas: boolean | null
          cleaning_equipment: boolean | null
          cleaning_reception: boolean | null
          cleaning_rooms: boolean | null
          cleaning_towels: boolean | null
          cleaning_trash: boolean | null
          created_at: string
          id: string
          is_perfect: boolean | null
          operations_agenda_reviewed: boolean | null
          operations_cash_checked: boolean | null
          operations_equipment_working: boolean | null
          operations_materials_stocked: boolean | null
          operations_previous_checklist: boolean | null
          operations_schedule_visible: boolean | null
          punctuality_hair: boolean | null
          punctuality_makeup: boolean | null
          punctuality_on_time: boolean | null
          punctuality_uniforms: boolean | null
          service_cordial: boolean | null
          service_explanations: boolean | null
          service_on_time: boolean | null
          service_post_cleaning: boolean | null
          service_room_ready: boolean | null
          service_satisfied: boolean | null
          submitted_by: string
          submitted_by_name: string
          updated_at: string
        }
        Insert: {
          behavior_clear_communication?: boolean | null
          behavior_no_conflicts?: boolean | null
          behavior_positive_climate?: boolean | null
          behavior_proactivity?: boolean | null
          behavior_quiet_environment?: boolean | null
          checklist_date?: string
          cleaning_bathrooms?: boolean | null
          cleaning_common_areas?: boolean | null
          cleaning_equipment?: boolean | null
          cleaning_reception?: boolean | null
          cleaning_rooms?: boolean | null
          cleaning_towels?: boolean | null
          cleaning_trash?: boolean | null
          created_at?: string
          id?: string
          is_perfect?: boolean | null
          operations_agenda_reviewed?: boolean | null
          operations_cash_checked?: boolean | null
          operations_equipment_working?: boolean | null
          operations_materials_stocked?: boolean | null
          operations_previous_checklist?: boolean | null
          operations_schedule_visible?: boolean | null
          punctuality_hair?: boolean | null
          punctuality_makeup?: boolean | null
          punctuality_on_time?: boolean | null
          punctuality_uniforms?: boolean | null
          service_cordial?: boolean | null
          service_explanations?: boolean | null
          service_on_time?: boolean | null
          service_post_cleaning?: boolean | null
          service_room_ready?: boolean | null
          service_satisfied?: boolean | null
          submitted_by: string
          submitted_by_name: string
          updated_at?: string
        }
        Update: {
          behavior_clear_communication?: boolean | null
          behavior_no_conflicts?: boolean | null
          behavior_positive_climate?: boolean | null
          behavior_proactivity?: boolean | null
          behavior_quiet_environment?: boolean | null
          checklist_date?: string
          cleaning_bathrooms?: boolean | null
          cleaning_common_areas?: boolean | null
          cleaning_equipment?: boolean | null
          cleaning_reception?: boolean | null
          cleaning_rooms?: boolean | null
          cleaning_towels?: boolean | null
          cleaning_trash?: boolean | null
          created_at?: string
          id?: string
          is_perfect?: boolean | null
          operations_agenda_reviewed?: boolean | null
          operations_cash_checked?: boolean | null
          operations_equipment_working?: boolean | null
          operations_materials_stocked?: boolean | null
          operations_previous_checklist?: boolean | null
          operations_schedule_visible?: boolean | null
          punctuality_hair?: boolean | null
          punctuality_makeup?: boolean | null
          punctuality_on_time?: boolean | null
          punctuality_uniforms?: boolean | null
          service_cordial?: boolean | null
          service_explanations?: boolean | null
          service_on_time?: boolean | null
          service_post_cleaning?: boolean | null
          service_room_ready?: boolean | null
          service_satisfied?: boolean | null
          submitted_by?: string
          submitted_by_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals_race_config: {
        Row: {
          created_at: string
          created_by: string | null
          current_position: number
          goal_target: number
          id: string
          is_active: boolean
          period_end: string | null
          period_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_position?: number
          goal_target?: number
          id?: string
          is_active?: boolean
          period_end?: string | null
          period_start?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_position?: number
          goal_target?: number
          id?: string
          is_active?: boolean
          period_end?: string | null
          period_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals_race_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id: string
          points: number
          race_id: string
          related_checklist_id: string | null
          related_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id?: string
          points: number
          race_id: string
          related_checklist_id?: string | null
          related_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["race_event_type"]
          id?: string
          points?: number
          race_id?: string
          related_checklist_id?: string | null
          related_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_race_events_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "goals_race_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_race_events_related_checklist_id_fkey"
            columns: ["related_checklist_id"]
            isOneToOne: false
            referencedRelation: "daily_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          custom_role: string | null
          full_name: string | null
          id: string
          is_supervisor: boolean | null
          profile_completed: boolean
          role: string | null
          shift: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          custom_role?: string | null
          full_name?: string | null
          id: string
          is_supervisor?: boolean | null
          profile_completed?: boolean
          role?: string | null
          shift?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          custom_role?: string | null
          full_name?: string | null
          id?: string
          is_supervisor?: boolean | null
          profile_completed?: boolean
          role?: string | null
          shift?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_contents: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          title: string
        }
        Insert: {
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number
          title: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          training_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          training_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          completed_at: string | null
          content_id: string | null
          created_at: string
          id: string
          module_id: string | null
          training_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          training_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "training_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_mandatory: boolean
          points_reward: number | null
          target_audience: string[] | null
          title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          points_reward?: number | null
          target_audience?: string[] | null
          title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          points_reward?: number | null
          target_audience?: string[] | null
          title?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_scores: {
        Row: {
          checklists_sent: number
          created_at: string
          critical_errors: number
          delays: number
          id: string
          perfect_checklists: number
          period_start: string
          supervisor_weeks: number
          total_points: number | null
          trainings_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checklists_sent?: number
          created_at?: string
          critical_errors?: number
          delays?: number
          id?: string
          perfect_checklists?: number
          period_start?: string
          supervisor_weeks?: number
          total_points?: number | null
          trainings_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checklists_sent?: number
          created_at?: string
          critical_errors?: number
          delays?: number
          id?: string
          perfect_checklists?: number
          period_start?: string
          supervisor_weeks?: number
          total_points?: number | null
          trainings_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_supervisors: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_manager_or_supervisor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "gestora" | "supervisora" | "colaborador"
      race_event_type:
        | "checklist_sent"
        | "checklist_perfect"
        | "delay"
        | "critical_error"
        | "checklist_missing"
        | "training_completed"
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
      app_role: ["gestora", "supervisora", "colaborador"],
      race_event_type: [
        "checklist_sent",
        "checklist_perfect",
        "delay",
        "critical_error",
        "checklist_missing",
        "training_completed",
      ],
    },
  },
} as const
