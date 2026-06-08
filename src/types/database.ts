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
          personal_message: string;
          is_admin: boolean;
          created_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id?: string;
          nick: string;
          personal_message?: string;
          is_admin?: boolean;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Update: {
          id?: string;
          nick?: string;
          personal_message?: string;
          is_admin?: boolean;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_recipient_id_fkey";
            columns: ["recipient_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
