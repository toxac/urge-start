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
      ai_logs: {
        Row: {
          component_key: string
          context: Json | null
          created_at: string
          error: string | null
          id: string
          model: string | null
          provider: string | null
          purpose: string
          request: Json | null
          response: Json | null
          source_node_key: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          component_key: string
          context?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          purpose: string
          request?: Json | null
          response?: Json | null
          source_node_key?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          component_key?: string
          context?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          purpose?: string
          request?: Json | null
          response?: Json | null
          source_node_key?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_source_node_key_fkey"
            columns: ["source_node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          offering_id: string | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          offering_id?: string | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          offering_id?: string | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          observation_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          observation_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          observation_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observation_links_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "user_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price: number
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_node_resources: {
        Row: {
          created_at: string
          description: string | null
          format: string
          id: string
          is_internal: boolean | null
          mission_key: string | null
          node_key: string
          role: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          format: string
          id?: string
          is_internal?: boolean | null
          mission_key?: string | null
          node_key: string
          role: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          is_internal?: boolean | null
          mission_key?: string | null
          node_key?: string
          role?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      program_nodes: {
        Row: {
          component: string
          created_at: string
          dependencies: string[]
          description: string | null
          intent: string
          metadata: Json
          mission_key: string
          node_key: string
          program_version: number
          prompt: string | null
          quest_key: string | null
          resources: Json
          role: Database["public"]["Enums"]["program_node_role"]
          sequence: number
          title: string
          updated_at: string
        }
        Insert: {
          component: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          intent: string
          metadata?: Json
          mission_key: string
          node_key: string
          program_version: number
          prompt?: string | null
          quest_key?: string | null
          resources?: Json
          role: Database["public"]["Enums"]["program_node_role"]
          sequence: number
          title: string
          updated_at?: string
        }
        Update: {
          component?: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          intent?: string
          metadata?: Json
          mission_key?: string
          node_key?: string
          program_version?: number
          prompt?: string | null
          quest_key?: string | null
          resources?: Json
          role?: Database["public"]["Enums"]["program_node_role"]
          sequence?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_commitments: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          source_node_key: string | null
          statement: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          source_node_key?: string | null
          statement: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          source_node_key?: string | null
          statement?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_commitments_source_node_key_fkey"
            columns: ["source_node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      user_contacts: {
        Row: {
          contact_details: Json
          context: string | null
          created_at: string
          id: string
          name: string
          organization: string | null
          relationships: string[]
          role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_details?: Json
          context?: string | null
          created_at?: string
          id?: string
          name: string
          organization?: string | null
          relationships?: string[]
          role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_details?: Json
          context?: string | null
          created_at?: string
          id?: string
          name?: string
          organization?: string | null
          relationships?: string[]
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_content: {
        Row: {
          body: string
          content_type: string
          created_at: string
          id: string
          metadata: Json
          published_at: string | null
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          content_type: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_observations: {
        Row: {
          content: string
          context: string | null
          created_at: string
          domain: string | null
          focus: string | null
          id: string
          metadata: Json
          observed_at: string | null
          source_node_key: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string
          domain?: string | null
          focus?: string | null
          id?: string
          metadata?: Json
          observed_at?: string | null
          source_node_key?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string
          domain?: string | null
          focus?: string | null
          id?: string
          metadata?: Json
          observed_at?: string | null
          source_node_key?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_observations_source_node_key_fkey"
            columns: ["source_node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      user_opportunities: {
        Row: {
          created_at: string
          customer: string | null
          description: string | null
          hypothesis: string | null
          id: string
          metadata: Json
          problem: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer?: string | null
          description?: string | null
          hypothesis?: string | null
          id?: string
          metadata?: Json
          problem?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer?: string | null
          description?: string | null
          hypothesis?: string | null
          id?: string
          metadata?: Json
          problem?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          gender: string | null
          id: string
          mobile_number: string | null
          shipping_address: Json | null
          social_links: Json
          updated_at: string
          user_id: string
          username: string
          username_key: string
          website_url: string | null
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          shipping_address?: Json | null
          social_links?: Json
          updated_at?: string
          user_id: string
          username: string
          username_key: string
          website_url?: string | null
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          shipping_address?: Json | null
          social_links?: Json
          updated_at?: string
          user_id?: string
          username?: string
          username_key?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_program_context: {
        Row: {
          additional_assessment: Json | null
          capabilities: Json
          constraints: Json
          created_at: string
          desired_future: Json
          experience: Json
          fears: Json
          id: string
          motivations: Json
          network_context: Json
          perceived_barriers: Json
          program_currency: string | null
          quit_conditions: Json
          resources: Json
          start_drive: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_assessment?: Json | null
          capabilities?: Json
          constraints?: Json
          created_at?: string
          desired_future?: Json
          experience?: Json
          fears?: Json
          id?: string
          motivations?: Json
          network_context?: Json
          perceived_barriers?: Json
          program_currency?: string | null
          quit_conditions?: Json
          resources?: Json
          start_drive?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_assessment?: Json | null
          capabilities?: Json
          constraints?: Json
          created_at?: string
          desired_future?: Json
          experience?: Json
          fears?: Json
          id?: string
          motivations?: Json
          network_context?: Json
          perceived_barriers?: Json
          program_currency?: string | null
          quit_conditions?: Json
          resources?: Json
          start_drive?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_program_state: {
        Row: {
          created_at: string
          current_node_key: string | null
          id: string
          program_version: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_node_key?: string | null
          id?: string
          program_version: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_node_key?: string | null
          id?: string
          program_version?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_state_current_node_key_fkey"
            columns: ["current_node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          node_key: string
          payload: Json
          program_version: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          node_key: string
          payload?: Json
          program_version: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          node_key?: string
          payload?: Json
          program_version?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_node_key_fkey"
            columns: ["node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      user_project_offers: {
        Row: {
          ask: string | null
          created_at: string
          description: string | null
          hook: string | null
          id: string
          metadata: Json
          project_id: string
          promise: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ask?: string | null
          created_at?: string
          description?: string | null
          hook?: string | null
          id?: string
          metadata?: Json
          project_id: string
          promise?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ask?: string | null
          created_at?: string
          description?: string | null
          hook?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          promise?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          opportunity_id: string | null
          selected_offer_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          selected_offer_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          selected_offer_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "user_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_projects_selected_offer_fk"
            columns: ["selected_offer_id"]
            isOneToOne: false
            referencedRelation: "user_project_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          offering_id: string
          provider: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          offering_id: string
          provider?: string | null
          provider_subscription_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          offering_id?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          is_nudge_enabled: boolean
          metadata: Json
          observation_id: string | null
          project_id: string | null
          source_node_key: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          is_nudge_enabled?: boolean
          metadata?: Json
          observation_id?: string | null
          project_id?: string | null
          source_node_key?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          is_nudge_enabled?: boolean
          metadata?: Json
          observation_id?: string | null
          project_id?: string | null
          source_node_key?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "user_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "user_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_source_node_key_fkey"
            columns: ["source_node_key"]
            isOneToOne: false
            referencedRelation: "program_nodes"
            referencedColumns: ["node_key"]
          },
        ]
      }
      user_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          discount_id: string | null
          id: string
          metadata: Json | null
          offering_id: string
          provider: string
          provider_transaction_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          discount_id?: string | null
          id?: string
          metadata?: Json | null
          offering_id: string
          provider: string
          provider_transaction_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          discount_id?: string | null
          id?: string
          metadata?: Json | null
          offering_id?: string
          provider?: string
          provider_transaction_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_transactions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_program_node: {
        Args: {
          p_next_node_key?: string
          p_node_key: string
          p_payload?: Json
          p_program_version: number
        }
        Returns: {
          completed: string[]
          current_node_key: string
          program_version: number
        }[]
      }
    }
    Enums: {
      content_status: "draft" | "published"
      opportunity_status: "added" | "shortlisted" | "testing"
      program_node_role: "setup" | "investigation" | "reveal" | "action"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      content_status: ["draft", "published"],
      opportunity_status: ["added", "shortlisted", "testing"],
      program_node_role: ["setup", "investigation", "reveal", "action"],
    },
  },
} as const
