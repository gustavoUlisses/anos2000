export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nick: string;
          is_admin: boolean;
          created_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id?: string;
          nick: string;
          is_admin?: boolean;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Update: {
          id?: string;
          nick?: string;
          is_admin?: boolean;
          created_at?: string;
          last_seen_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          channel: "msn" | "uol";
          room_id: string | null;
          sender_id: string;
          recipient_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel: "msn" | "uol";
          room_id?: string | null;
          sender_id: string;
          recipient_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel?: "msn" | "uol";
          room_id?: string | null;
          sender_id?: string;
          recipient_id?: string | null;
          body?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
