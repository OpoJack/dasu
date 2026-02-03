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
      menu_items: {
        Row: {
          id: string
          name: string
          price: number
          category: string
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          category: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          category?: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tabs: {
        Row: {
          id: string
          name: string
          status: 'open' | 'closed'
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'open' | 'closed'
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'open' | 'closed'
          created_at?: string
          closed_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          tab_id: string
          status: 'in_progress' | 'editing' | 'complete'
          edited_by: string | null
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tab_id: string
          status?: 'in_progress' | 'editing' | 'complete'
          edited_by?: string | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tab_id?: string
          status?: 'in_progress' | 'editing' | 'complete'
          edited_by?: string | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tab_id_fkey"
            columns: ["tab_id"]
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_order: number
          notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_order: number
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price_at_order?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tab_total: {
        Args: { p_tab_id: string }
        Returns: number
      }
      start_order_edit: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      finish_order_edit: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      complete_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      close_tab: {
        Args: { p_tab_id: string }
        Returns: number
      }
      reopen_tab: {
        Args: { p_tab_id: string }
        Returns: boolean
      }
      delete_tab: {
        Args: { p_tab_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tab = Database['public']['Tables']['tabs']['Row']
export type TabInsert = Database['public']['Tables']['tabs']['Insert']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']

// Joined types for display
export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[]
  tab: Tab
}
