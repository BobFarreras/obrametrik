export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      building_elements: {
        Row: {
          confirmation: Database["public"]["Enums"]["geometry_confirmation"];
          created_at: string;
          created_by: string;
          depth_mm: number;
          height_mm: number;
          host_element_id: string | null;
          host_face: Database["public"]["Enums"]["element_host_face"] | null;
          id: string;
          kind: Database["public"]["Enums"]["building_element_kind"];
          lifecycle: Database["public"]["Enums"]["element_lifecycle"];
          name: string;
          position_x_mm: number;
          position_y_mm: number;
          position_z_mm: number;
          project_id: string;
          rotation_x_millidegrees: number;
          rotation_y_millidegrees: number;
          rotation_z_millidegrees: number;
          space_id: string;
          specification: Json;
          updated_at: string;
          width_mm: number;
        };
        Insert: {
          confirmation?: Database["public"]["Enums"]["geometry_confirmation"];
          created_at?: string;
          created_by: string;
          depth_mm: number;
          height_mm: number;
          host_element_id?: string | null;
          host_face?: Database["public"]["Enums"]["element_host_face"] | null;
          id?: string;
          kind: Database["public"]["Enums"]["building_element_kind"];
          lifecycle: Database["public"]["Enums"]["element_lifecycle"];
          name: string;
          position_x_mm?: number;
          position_y_mm?: number;
          position_z_mm?: number;
          project_id: string;
          rotation_x_millidegrees?: number;
          rotation_y_millidegrees?: number;
          rotation_z_millidegrees?: number;
          space_id: string;
          specification?: Json;
          updated_at?: string;
          width_mm: number;
        };
        Update: {
          confirmation?: Database["public"]["Enums"]["geometry_confirmation"];
          created_at?: string;
          created_by?: string;
          depth_mm?: number;
          height_mm?: number;
          host_element_id?: string | null;
          host_face?: Database["public"]["Enums"]["element_host_face"] | null;
          id?: string;
          kind?: Database["public"]["Enums"]["building_element_kind"];
          lifecycle?: Database["public"]["Enums"]["element_lifecycle"];
          name?: string;
          position_x_mm?: number;
          position_y_mm?: number;
          position_z_mm?: number;
          project_id?: string;
          rotation_x_millidegrees?: number;
          rotation_y_millidegrees?: number;
          rotation_z_millidegrees?: number;
          space_id?: string;
          specification?: Json;
          updated_at?: string;
          width_mm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "building_elements_host_element_id_project_id_fkey";
            columns: ["host_element_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_elements";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "building_elements_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "building_elements_space_id_project_id_fkey";
            columns: ["space_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_spaces";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      building_levels: {
        Row: {
          created_at: string;
          created_by: string;
          display_order: number;
          elevation_mm: number;
          id: string;
          name: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          display_order: number;
          elevation_mm: number;
          id?: string;
          name: string;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          display_order?: number;
          elevation_mm?: number;
          id?: string;
          name?: string;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "building_levels_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      building_spaces: {
        Row: {
          clear_height_mm: number;
          confirmation: Database["public"]["Enums"]["geometry_confirmation"];
          created_at: string;
          created_by: string;
          footprint_kind: Database["public"]["Enums"]["space_footprint_kind"];
          geometry_source: Database["public"]["Enums"]["geometry_source"];
          id: string;
          kind: Database["public"]["Enums"]["building_space_kind"];
          level_id: string;
          name: string;
          origin_x_mm: number;
          origin_y_mm: number;
          origin_z_mm: number;
          polygon_vertices: Json | null;
          project_id: string;
          rectangle_depth_mm: number | null;
          rectangle_width_mm: number | null;
          rotation_x_millidegrees: number;
          rotation_y_millidegrees: number;
          rotation_z_millidegrees: number;
          updated_at: string;
        };
        Insert: {
          clear_height_mm: number;
          confirmation?: Database["public"]["Enums"]["geometry_confirmation"];
          created_at?: string;
          created_by: string;
          footprint_kind: Database["public"]["Enums"]["space_footprint_kind"];
          geometry_source: Database["public"]["Enums"]["geometry_source"];
          id?: string;
          kind: Database["public"]["Enums"]["building_space_kind"];
          level_id: string;
          name: string;
          origin_x_mm?: number;
          origin_y_mm?: number;
          origin_z_mm?: number;
          polygon_vertices?: Json | null;
          project_id: string;
          rectangle_depth_mm?: number | null;
          rectangle_width_mm?: number | null;
          rotation_x_millidegrees?: number;
          rotation_y_millidegrees?: number;
          rotation_z_millidegrees?: number;
          updated_at?: string;
        };
        Update: {
          clear_height_mm?: number;
          confirmation?: Database["public"]["Enums"]["geometry_confirmation"];
          created_at?: string;
          created_by?: string;
          footprint_kind?: Database["public"]["Enums"]["space_footprint_kind"];
          geometry_source?: Database["public"]["Enums"]["geometry_source"];
          id?: string;
          kind?: Database["public"]["Enums"]["building_space_kind"];
          level_id?: string;
          name?: string;
          origin_x_mm?: number;
          origin_y_mm?: number;
          origin_z_mm?: number;
          polygon_vertices?: Json | null;
          project_id?: string;
          rectangle_depth_mm?: number | null;
          rectangle_width_mm?: number | null;
          rotation_x_millidegrees?: number;
          rotation_y_millidegrees?: number;
          rotation_z_millidegrees?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "building_spaces_level_id_project_id_fkey";
            columns: ["level_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_levels";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "building_spaces_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      measurements: {
        Row: {
          area_m2: number | null;
          created_at: string;
          created_by: string;
          height_m: number;
          id: string;
          label: string;
          operation: Database["public"]["Enums"]["measurement_operation"];
          surface_id: string;
          updated_at: string;
          width_m: number;
        };
        Insert: {
          area_m2?: number | null;
          created_at?: string;
          created_by: string;
          height_m: number;
          id?: string;
          label: string;
          operation?: Database["public"]["Enums"]["measurement_operation"];
          surface_id: string;
          updated_at?: string;
          width_m: number;
        };
        Update: {
          area_m2?: number | null;
          created_at?: string;
          created_by?: string;
          height_m?: number;
          id?: string;
          label?: string;
          operation?: Database["public"]["Enums"]["measurement_operation"];
          surface_id?: string;
          updated_at?: string;
          width_m?: number;
        };
        Relationships: [
          {
            foreignKeyName: "measurements_surface_id_fkey";
            columns: ["surface_id"];
            isOneToOne: false;
            referencedRelation: "surfaces";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          preferred_locale: Database["public"]["Enums"]["app_locale"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          preferred_locale?: Database["public"]["Enums"]["app_locale"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          preferred_locale?: Database["public"]["Enums"]["app_locale"];
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          height_m: number | null;
          id: string;
          kind: Database["public"]["Enums"]["room_kind"] | null;
          length_m: number | null;
          name: string;
          project_id: string;
          updated_at: string;
          width_m: number | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          height_m?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["room_kind"] | null;
          length_m?: number | null;
          name: string;
          project_id: string;
          updated_at?: string;
          width_m?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          height_m?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["room_kind"] | null;
          length_m?: number | null;
          name?: string;
          project_id?: string;
          updated_at?: string;
          width_m?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      surface_work_scopes: {
        Row: {
          condition: Database["public"]["Enums"]["surface_condition"];
          confirmed_at: string;
          created_at: string;
          created_by: string;
          desired_works: Database["public"]["Enums"]["surface_work_type"][];
          existing_finish: Database["public"]["Enums"]["existing_surface_finish"];
          id: string;
          notes: string | null;
          remove_existing: boolean;
          surface_id: string;
          updated_at: string;
          water_exposure: Database["public"]["Enums"]["water_exposure"];
        };
        Insert: {
          condition: Database["public"]["Enums"]["surface_condition"];
          confirmed_at?: string;
          created_at?: string;
          created_by: string;
          desired_works: Database["public"]["Enums"]["surface_work_type"][];
          existing_finish: Database["public"]["Enums"]["existing_surface_finish"];
          id?: string;
          notes?: string | null;
          remove_existing?: boolean;
          surface_id: string;
          updated_at?: string;
          water_exposure?: Database["public"]["Enums"]["water_exposure"];
        };
        Update: {
          condition?: Database["public"]["Enums"]["surface_condition"];
          confirmed_at?: string;
          created_at?: string;
          created_by?: string;
          desired_works?: Database["public"]["Enums"]["surface_work_type"][];
          existing_finish?: Database["public"]["Enums"]["existing_surface_finish"];
          id?: string;
          notes?: string | null;
          remove_existing?: boolean;
          surface_id?: string;
          updated_at?: string;
          water_exposure?: Database["public"]["Enums"]["water_exposure"];
        };
        Relationships: [
          {
            foreignKeyName: "surface_work_scopes_surface_id_fkey";
            columns: ["surface_id"];
            isOneToOne: true;
            referencedRelation: "surfaces";
            referencedColumns: ["id"];
          },
        ];
      };
      surfaces: {
        Row: {
          created_at: string;
          created_by: string;
          gross_area_m2: number | null;
          height_m: number;
          id: string;
          kind: Database["public"]["Enums"]["surface_kind"];
          name: string;
          room_id: string;
          updated_at: string;
          width_m: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          gross_area_m2?: number | null;
          height_m: number;
          id?: string;
          kind: Database["public"]["Enums"]["surface_kind"];
          name: string;
          room_id: string;
          updated_at?: string;
          width_m: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          gross_area_m2?: number | null;
          height_m?: number;
          id?: string;
          kind?: Database["public"]["Enums"]["surface_kind"];
          name?: string;
          room_id?: string;
          updated_at?: string;
          width_m?: number;
        };
        Relationships: [
          {
            foreignKeyName: "surfaces_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      system_connection_points: {
        Row: {
          connection_id: string;
          point_order: number;
          project_id: string;
          x_mm: number;
          y_mm: number;
          z_mm: number;
        };
        Insert: {
          connection_id: string;
          point_order: number;
          project_id: string;
          x_mm: number;
          y_mm: number;
          z_mm: number;
        };
        Update: {
          connection_id?: string;
          point_order?: number;
          project_id?: string;
          x_mm?: number;
          y_mm?: number;
          z_mm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "system_connection_points_connection_id_project_id_fkey";
            columns: ["connection_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "system_connections";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "system_connection_points_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      system_connections: {
        Row: {
          created_at: string;
          created_by: string;
          from_element_id: string;
          id: string;
          project_id: string;
          specification: Json;
          system_id: string;
          to_element_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          from_element_id: string;
          id?: string;
          project_id: string;
          specification?: Json;
          system_id: string;
          to_element_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          from_element_id?: string;
          id?: string;
          project_id?: string;
          specification?: Json;
          system_id?: string;
          to_element_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "system_connections_from_element_id_project_id_fkey";
            columns: ["from_element_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_elements";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "system_connections_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_connections_system_id_project_id_fkey";
            columns: ["system_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "technical_systems";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "system_connections_to_element_id_project_id_fkey";
            columns: ["to_element_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_elements";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      technical_system_elements: {
        Row: {
          created_at: string;
          element_id: string;
          project_id: string;
          role: Database["public"]["Enums"]["system_element_role"];
          system_id: string;
        };
        Insert: {
          created_at?: string;
          element_id: string;
          project_id: string;
          role: Database["public"]["Enums"]["system_element_role"];
          system_id: string;
        };
        Update: {
          created_at?: string;
          element_id?: string;
          project_id?: string;
          role?: Database["public"]["Enums"]["system_element_role"];
          system_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "technical_system_elements_element_id_project_id_fkey";
            columns: ["element_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_elements";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "technical_system_elements_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "technical_system_elements_system_id_project_id_fkey";
            columns: ["system_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "technical_systems";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      technical_systems: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          kind: Database["public"]["Enums"]["technical_system_kind"];
          name: string;
          project_id: string;
          status: Database["public"]["Enums"]["technical_system_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          kind: Database["public"]["Enums"]["technical_system_kind"];
          name: string;
          project_id: string;
          status?: Database["public"]["Enums"]["technical_system_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["technical_system_kind"];
          name?: string;
          project_id?: string;
          status?: Database["public"]["Enums"]["technical_system_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "technical_systems_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      work_dependencies: {
        Row: {
          created_at: string;
          predecessor_id: string;
          project_id: string;
          successor_id: string;
        };
        Insert: {
          created_at?: string;
          predecessor_id: string;
          project_id: string;
          successor_id: string;
        };
        Update: {
          created_at?: string;
          predecessor_id?: string;
          project_id?: string;
          successor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_dependencies_predecessor_id_project_id_fkey";
            columns: ["predecessor_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "work_dependencies_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_dependencies_successor_id_project_id_fkey";
            columns: ["successor_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      work_item_targets: {
        Row: {
          created_at: string;
          element_id: string | null;
          level_id: string | null;
          project_id: string;
          space_id: string | null;
          work_item_id: string;
        };
        Insert: {
          created_at?: string;
          element_id?: string | null;
          level_id?: string | null;
          project_id: string;
          space_id?: string | null;
          work_item_id: string;
        };
        Update: {
          created_at?: string;
          element_id?: string | null;
          level_id?: string | null;
          project_id?: string;
          space_id?: string | null;
          work_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_item_targets_element_id_project_id_fkey";
            columns: ["element_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_elements";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "work_item_targets_level_id_project_id_fkey";
            columns: ["level_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_levels";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "work_item_targets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_item_targets_space_id_project_id_fkey";
            columns: ["space_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "building_spaces";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "work_item_targets_work_item_id_project_id_fkey";
            columns: ["work_item_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "work_items";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      work_items: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          project_id: string;
          rule_version_ids: string[];
          status: Database["public"]["Enums"]["work_status"];
          title: string;
          trade: Database["public"]["Enums"]["work_trade"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          project_id: string;
          rule_version_ids?: string[];
          status?: Database["public"]["Enums"]["work_status"];
          title: string;
          trade: Database["public"]["Enums"]["work_trade"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          project_id?: string;
          rule_version_ids?: string[];
          status?: Database["public"]["Enums"]["work_status"];
          title?: string;
          trade?: Database["public"]["Enums"]["work_trade"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_cad_plan: {
        Args: {
          p_plan: Json;
          p_space_id?: string | null;
        };
        Returns: {
          space_id: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      app_locale: "ca" | "es" | "en";
      building_element_kind:
        | "wall"
        | "floor"
        | "ceiling"
        | "roof"
        | "door"
        | "window"
        | "opening"
        | "column"
        | "beam"
        | "lining"
        | "fixture"
        | "equipment"
        | "terminal"
        | "other";
      building_space_kind:
        | "bathroom"
        | "kitchen"
        | "bedroom"
        | "living_room"
        | "hallway"
        | "utility"
        | "exterior"
        | "other";
      element_host_face: "interior" | "exterior" | "top" | "bottom" | "axis";
      element_lifecycle: "existing" | "to_remove" | "new" | "modified";
      existing_surface_finish:
        "paint" | "tile" | "plaster" | "drywall" | "concrete" | "wood" | "unknown" | "other";
      geometry_confirmation: "estimated" | "confirmed";
      geometry_source: "manual" | "plan" | "scan" | "import";
      measurement_operation: "add" | "subtract";
      organization_role: "owner" | "admin" | "member";
      project_status: "draft" | "active" | "completed" | "archived";
      room_kind: "bathroom" | "kitchen" | "bedroom" | "living_room" | "hallway" | "other";
      space_footprint_kind: "rectangle" | "polygon";
      surface_condition: "good" | "minor_damage" | "damaged" | "damp" | "unknown";
      surface_kind: "wall" | "floor" | "ceiling" | "other";
      surface_work_type:
        | "paint"
        | "tile"
        | "plaster"
        | "wallpaper"
        | "repair"
        | "waterproof"
        | "replace"
        | "leave_as_is"
        | "other";
      system_element_role: "source" | "terminal" | "intermediate";
      technical_system_kind:
        | "electrical"
        | "lighting_control"
        | "cold_water"
        | "hot_water"
        | "drainage"
        | "ventilation"
        | "heating"
        | "cooling"
        | "data"
        | "other";
      technical_system_status: "draft" | "confirmed" | "installed" | "tested" | "commissioned";
      water_exposure: "dry" | "occasional" | "wet";
      work_status:
        | "draft"
        | "confirmed"
        | "ready"
        | "in_progress"
        | "installed"
        | "tested"
        | "accepted"
        | "blocked"
        | "cancelled";
      work_trade:
        | "demolition"
        | "masonry"
        | "waterproofing"
        | "electrical"
        | "lighting"
        | "plumbing"
        | "drainage"
        | "ventilation"
        | "climate"
        | "joinery"
        | "finishes"
        | "painting"
        | "coordination";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_locale: ["ca", "es", "en"],
      building_element_kind: [
        "wall",
        "floor",
        "ceiling",
        "roof",
        "door",
        "window",
        "opening",
        "column",
        "beam",
        "lining",
        "fixture",
        "equipment",
        "terminal",
        "other",
      ],
      building_space_kind: [
        "bathroom",
        "kitchen",
        "bedroom",
        "living_room",
        "hallway",
        "utility",
        "exterior",
        "other",
      ],
      element_host_face: ["interior", "exterior", "top", "bottom", "axis"],
      element_lifecycle: ["existing", "to_remove", "new", "modified"],
      existing_surface_finish: [
        "paint",
        "tile",
        "plaster",
        "drywall",
        "concrete",
        "wood",
        "unknown",
        "other",
      ],
      geometry_confirmation: ["estimated", "confirmed"],
      geometry_source: ["manual", "plan", "scan", "import"],
      measurement_operation: ["add", "subtract"],
      organization_role: ["owner", "admin", "member"],
      project_status: ["draft", "active", "completed", "archived"],
      room_kind: ["bathroom", "kitchen", "bedroom", "living_room", "hallway", "other"],
      space_footprint_kind: ["rectangle", "polygon"],
      surface_condition: ["good", "minor_damage", "damaged", "damp", "unknown"],
      surface_kind: ["wall", "floor", "ceiling", "other"],
      surface_work_type: [
        "paint",
        "tile",
        "plaster",
        "wallpaper",
        "repair",
        "waterproof",
        "replace",
        "leave_as_is",
        "other",
      ],
      system_element_role: ["source", "terminal", "intermediate"],
      technical_system_kind: [
        "electrical",
        "lighting_control",
        "cold_water",
        "hot_water",
        "drainage",
        "ventilation",
        "heating",
        "cooling",
        "data",
        "other",
      ],
      technical_system_status: ["draft", "confirmed", "installed", "tested", "commissioned"],
      water_exposure: ["dry", "occasional", "wet"],
      work_status: [
        "draft",
        "confirmed",
        "ready",
        "in_progress",
        "installed",
        "tested",
        "accepted",
        "blocked",
        "cancelled",
      ],
      work_trade: [
        "demolition",
        "masonry",
        "waterproofing",
        "electrical",
        "lighting",
        "plumbing",
        "drainage",
        "ventilation",
        "climate",
        "joinery",
        "finishes",
        "painting",
        "coordination",
      ],
    },
  },
} as const;
