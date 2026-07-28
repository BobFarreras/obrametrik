import { createSupabaseBuildingModelRepository } from "@obrametrik/database";
import { supabase } from "../lib/supabase";

export const mobileBuildingModelRepository = createSupabaseBuildingModelRepository(supabase);
