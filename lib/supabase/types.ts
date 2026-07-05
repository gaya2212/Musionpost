export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      artist_profiles: {
        Row: {
          budget_range: string | null;
          created_at: string;
          embedding: string | null;
          influences: string | null;
          primary_genres: string[];
          profile_id: string;
          project_goals: string | null;
          secondary_genres: string[];
          stage: string | null;
          updated_at: string;
        };
        Insert: {
          budget_range?: string | null;
          created_at?: string;
          embedding?: string | null;
          influences?: string | null;
          primary_genres?: string[];
          profile_id: string;
          project_goals?: string | null;
          secondary_genres?: string[];
          stage?: string | null;
          updated_at?: string;
        };
        Update: {
          budget_range?: string | null;
          created_at?: string;
          embedding?: string | null;
          influences?: string | null;
          primary_genres?: string[];
          profile_id?: string;
          project_goals?: string | null;
          secondary_genres?: string[];
          stage?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      credits_export: {
        Row: {
          created_at: string;
          error: string | null;
          exported_at: string | null;
          id: string;
          isrc: string | null;
          iswc: string | null;
          payload: Json;
          project_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          exported_at?: string | null;
          id?: string;
          isrc?: string | null;
          iswc?: string | null;
          payload: Json;
          project_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          exported_at?: string | null;
          id?: string;
          isrc?: string | null;
          iswc?: string | null;
          payload?: Json;
          project_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          decided_at: string | null;
          decision: string;
          feedback: string | null;
          id: string;
          project_id: string;
          pro_profile_id: string;
          reasoning: Json;
          score: number;
          shown_at: string;
          stage: string;
        };
        Insert: {
          decided_at?: string | null;
          decision?: string;
          feedback?: string | null;
          id?: string;
          project_id: string;
          pro_profile_id: string;
          reasoning?: Json;
          score: number;
          shown_at?: string;
          stage: string;
        };
        Update: {
          decided_at?: string | null;
          decision?: string;
          feedback?: string | null;
          id?: string;
          project_id?: string;
          pro_profile_id?: string;
          reasoning?: Json;
          score?: number;
          shown_at?: string;
          stage?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          attachments: Json;
          body: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_profile_id: string;
          thread_id: string;
        };
        Insert: {
          attachments?: Json;
          body: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_profile_id: string;
          thread_id: string;
        };
        Update: {
          attachments?: Json;
          body?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_profile_id?: string;
          thread_id?: string;
        };
        Relationships: [];
      };
      message_threads: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string;
          project_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          project_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          project_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          location: string | null;
          onboarding_complete: boolean;
          role: string;
          slug: string | null;
          timezone: string | null;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          location?: string | null;
          onboarding_complete?: boolean;
          role?: string;
          slug?: string | null;
          timezone?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          location?: string | null;
          onboarding_complete?: boolean;
          role?: string;
          slug?: string | null;
          timezone?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      project_collaborators: {
        Row: {
          accepted_at: string | null;
          completed_at: string | null;
          contribution_notes: string | null;
          id: string;
          invited_at: string;
          project_id: string;
          pro_profile_id: string;
          role: string;
          stage: string;
          status: string;
        };
        Insert: {
          accepted_at?: string | null;
          completed_at?: string | null;
          contribution_notes?: string | null;
          id?: string;
          invited_at?: string;
          project_id: string;
          pro_profile_id: string;
          role: string;
          stage: string;
          status?: string;
        };
        Update: {
          accepted_at?: string | null;
          completed_at?: string | null;
          contribution_notes?: string | null;
          id?: string;
          invited_at?: string;
          project_id?: string;
          pro_profile_id?: string;
          role?: string;
          stage?: string;
          status?: string;
        };
        Relationships: [];
      };
      project_stages: {
        Row: {
          artifacts: Json;
          completed_at: string | null;
          id: string;
          notes: string | null;
          project_id: string;
          stage: string;
          started_at: string | null;
          status: string;
        };
        Insert: {
          artifacts?: Json;
          completed_at?: string | null;
          id?: string;
          notes?: string | null;
          project_id: string;
          stage: string;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          artifacts?: Json;
          completed_at?: string | null;
          id?: string;
          notes?: string | null;
          project_id?: string;
          stage?: string;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          artist_profile_id: string;
          created_at: string;
          current_stage: string;
          description: string | null;
          id: string;
          status: string;
          stage_started_at: string;
          target_completion_date: string | null;
          title: string;
          updated_at: string;
          visibility: string;
          working_title: string | null;
        };
        Insert: {
          artist_profile_id: string;
          created_at?: string;
          current_stage?: string;
          description?: string | null;
          id?: string;
          status?: string;
          stage_started_at?: string;
          target_completion_date?: string | null;
          title: string;
          updated_at?: string;
          visibility?: string;
          working_title?: string | null;
        };
        Update: {
          artist_profile_id?: string;
          created_at?: string;
          current_stage?: string;
          description?: string | null;
          id?: string;
          status?: string;
          stage_started_at?: string;
          target_completion_date?: string | null;
          title?: string;
          updated_at?: string;
          visibility?: string;
          working_title?: string | null;
        };
        Relationships: [];
      };
      pro_profiles: {
        Row: {
          availability_status: string;
          created_at: string;
          embedding: string | null;
          genres: string[];
          notable_credits: Json;
          portfolio_urls: string[];
          profile_id: string;
          pro_type: string;
          rate_range: string | null;
          remote_ok: boolean;
          specialties: string[];
          updated_at: string;
          verified_status: string;
        };
        Insert: {
          availability_status?: string;
          created_at?: string;
          embedding?: string | null;
          genres?: string[];
          notable_credits?: Json;
          portfolio_urls?: string[];
          profile_id: string;
          pro_type: string;
          rate_range?: string | null;
          remote_ok?: boolean;
          specialties?: string[];
          updated_at?: string;
          verified_status?: string;
        };
        Update: {
          availability_status?: string;
          created_at?: string;
          embedding?: string | null;
          genres?: string[];
          notable_credits?: Json;
          portfolio_urls?: string[];
          profile_id?: string;
          pro_type?: string;
          rate_range?: string | null;
          remote_ok?: boolean;
          specialties?: string[];
          updated_at?: string;
          verified_status?: string;
        };
        Relationships: [];
      };
      thread_participants: {
        Row: {
          joined_at: string;
          profile_id: string;
          thread_id: string;
        };
        Insert: {
          joined_at?: string;
          profile_id: string;
          thread_id: string;
        };
        Update: {
          joined_at?: string;
          profile_id?: string;
          thread_id?: string;
        };
        Relationships: [];
      };
      verified_credentials: {
        Row: {
          c2pa_manifest_url: string | null;
          contributors: Json;
          created_at: string;
          id: string;
          issuer_signature: string | null;
          issued_at: string | null;
          project_id: string;
          status: string;
          tier: string;
        };
        Insert: {
          c2pa_manifest_url?: string | null;
          contributors?: Json;
          created_at?: string;
          id?: string;
          issuer_signature?: string | null;
          issued_at?: string | null;
          project_id: string;
          status?: string;
          tier: string;
        };
        Update: {
          c2pa_manifest_url?: string | null;
          contributors?: Json;
          created_at?: string;
          id?: string;
          issuer_signature?: string | null;
          issued_at?: string | null;
          project_id?: string;
          status?: string;
          tier?: string;
        };
        Relationships: [];
      };
      waitlist_entries: {
        Row: {
          email: string;
          id: string;
          location: string | null;
          metadata: Json;
          referrer: string | null;
          role_interest: string | null;
          submitted_at: string;
        };
        Insert: {
          email: string;
          id?: string;
          location?: string | null;
          metadata?: Json;
          referrer?: string | null;
          role_interest?: string | null;
          submitted_at?: string;
        };
        Update: {
          email?: string;
          id?: string;
          location?: string | null;
          metadata?: Json;
          referrer?: string | null;
          role_interest?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
