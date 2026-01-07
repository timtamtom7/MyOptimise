export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_rollups: {
        Row: {
          created_at: string
          data: Json
          id: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          organization_id: string
          period: string
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          organization_id: string
          period: string
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          organization_id?: string
          period?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_rollups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          organization_id: string
          start_time: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          organization_id: string
          start_time: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          organization_id?: string
          start_time?: string
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: string
          updated_at: string
          monthly_budget: number | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: string
          updated_at?: string
          monthly_budget?: number | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: string
          updated_at?: string
          monthly_budget?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          calendar_event_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          calendar_event_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bus: {
        Row: {
          created_at: string
          data: Json
          event_type: Database["public"]["Enums"]["event_type_bus"]
          id: string
          organization_id: string
          processed_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data: Json
          event_type: Database["public"]["Enums"]["event_type_bus"]
          id?: string
          organization_id: string
          processed_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          event_type?: Database["public"]["Enums"]["event_type_bus"]
          id?: string
          organization_id?: string
          processed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_bus_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          created_at: string
          id: string
          message_thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_message_thread_id_fkey"
            columns: ["message_thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_private: boolean
          organization_id: string
          title: string
          type: Database["public"]["Enums"]["thread_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_private?: boolean
          organization_id: string
          title: string
          type: Database["public"]["Enums"]["thread_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_private?: boolean
          organization_id?: string
          title?: string
          type?: Database["public"]["Enums"]["thread_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_thread_id: string
          parent_message_id: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["message_visibility"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_thread_id: string
          parent_message_id?: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["message_visibility"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_thread_id?: string
          parent_message_id?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["message_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_message_thread_id_fkey"
            columns: ["message_thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          plan: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      service_metrics: {
        Row: {
          clicks: number
          conversions: number
          created_at: string
          ctr: number
          engagement_rate: number
          id: string
          impressions: number
          likes: number
          metric_date: string
          reach: number
          service_id: string
          shares: number
          updated_at: string
          revenue?: number
          spend?: number
        }
        Insert: {
          clicks: number
          conversions: number
          created_at?: string
          ctr: number
          engagement_rate: number
          id?: string
          impressions: number
          likes: number
          metric_date: string
          reach: number
          service_id: string
          shares: number
          updated_at?: string
          revenue?: number
          spend?: number
        }
        Update: {
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number
          engagement_rate?: number
          id?: string
          impressions?: number
          likes?: number
          metric_date?: string
          reach?: number
          service_id?: string
          shares?: number
          updated_at?: string
          revenue?: number
          spend?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_metrics_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          organization_id: string
          priority: string
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          organization_id: string
          priority: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          organization_id?: string
          priority?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string
          id: string
          tag: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["task_visibility"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_capabilities: {
        Row: {
          user_id: string
          content_view_drafts: boolean | null
          content_create: boolean | null
          content_delete: boolean | null
          content_approve_internal: boolean | null
          content_approve_client: boolean | null
          chat_internal_access: boolean | null
          chat_client_access: boolean | null
          chat_ghost_mode: boolean | null
          sales_access: boolean | null
          sales_lead_gen: boolean | null
          sales_contracts: boolean | null
          analytics_view_financials: boolean | null
          admin_impersonate: boolean | null
          admin_billing: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          content_view_drafts?: boolean | null
          content_create?: boolean | null
          content_delete?: boolean | null
          content_approve_internal?: boolean | null
          content_approve_client?: boolean | null
          chat_internal_access?: boolean | null
          chat_client_access?: boolean | null
          chat_ghost_mode?: boolean | null
          sales_access?: boolean | null
          sales_lead_gen?: boolean | null
          sales_contracts?: boolean | null
          analytics_view_financials?: boolean | null
          admin_impersonate?: boolean | null
          admin_billing?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          content_view_drafts?: boolean | null
          content_create?: boolean | null
          content_delete?: boolean | null
          content_approve_internal?: boolean | null
          content_approve_client?: boolean | null
          chat_internal_access?: boolean | null
          chat_client_access?: boolean | null
          chat_ghost_mode?: boolean | null
          sales_access?: boolean | null
          sales_lead_gen?: boolean | null
          sales_contracts?: boolean | null
          analytics_view_financials?: boolean | null
          admin_impersonate?: boolean | null
          admin_billing?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_capabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_type: "meeting" | "deadline" | "reminder" | "event"
      event_type_bus: "task_created" | "task_updated" | "task_completed" | "event_created" | "event_updated" | "message_sent" | "user_joined" | "user_left" | "service_metric_updated" | "ticket_created" | "ticket_updated"
      message_visibility: "public" | "private" | "team" | "client"
      metric_type: "impressions" | "engagement" | "conversions" | "ctr" | "reach" | "likes" | "shares" | "comments" | "followers" | "clicks"
      service_type: "instagram" | "facebook" | "pinterest" | "email" | "website" | "linkedin" | "twitter" | "youtube" | "sms" | "seo" | "ads" | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      task_visibility: "private" | "team" | "client" | "public"
      thread_type: "general" | "project" | "client" | "support" | "announcement"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      user_role: "owner" | "manager" | "employee" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}