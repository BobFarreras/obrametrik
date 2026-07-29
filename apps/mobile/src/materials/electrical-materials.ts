import {
  buildElectricalProjectCircuits,
  GenerateElectricalPlanBillUseCase,
  GenerateElectricalProjectTakeoffUseCase,
} from "@obrametrik/application";
import type { Json } from "@obrametrik/database";
import { mobileBuildingModelRepository } from "../cad/repository";
import { supabase } from "../lib/supabase";

export async function regenerateElectricalMaterials(projectId: string): Promise<void> {
  const elements = await mobileBuildingModelRepository.findElementsByProject(projectId);
  const [circuitsResult, assignmentsResult, segmentsResult] = await Promise.all([
    supabase.from("electrical_circuits").select("id,code,status").eq("project_id", projectId),
    supabase
      .from("electrical_circuit_terminals")
      .select("circuit_id,terminal_element_id")
      .eq("project_id", projectId),
    supabase
      .from("electrical_route_segments")
      .select(
        "id,circuit_id,length_mm,conductor_configuration,conduit_system,conduit_diameter_mm,status",
      )
      .eq("project_id", projectId),
  ]);
  const result =
    !circuitsResult.error && !assignmentsResult.error && !segmentsResult.error
      ? new GenerateElectricalProjectTakeoffUseCase().execute({
          elements,
          circuits: buildElectricalProjectCircuits({
            circuits: circuitsResult.data,
            assignments: assignmentsResult.data,
            segments: segmentsResult.data,
          }),
        })
      : new GenerateElectricalPlanBillUseCase().execute(elements);
  const { error } = await supabase.rpc("save_electrical_takeoff", {
    p_project_id: projectId,
    p_status: result.status,
    p_rule_version: result.ruleVersion,
    p_input_snapshot: {
      source: "confirmed-cad-components",
      sourceComponentCount: result.sourceComponentCount,
      sourceEntityIds: [...new Set(result.lines.flatMap((line) => line.sourceEntityIds))],
      missingInputs: result.missingInputs,
    } as unknown as Json,
    p_warnings: result.warnings as unknown as Json,
    p_lines: result.lines.map((line) => ({
      category_id: line.categoryId,
      specification: line.specification,
      source_entity_ids: line.sourceEntityIds,
      quantity_base: line.quantityBase,
      reserve_quantity: line.reserveQuantity,
      waste_factor: line.wasteFactor,
      quantity_with_waste: line.quantityWithWaste,
      purchase_quantity: line.purchaseQuantity,
      unit: line.unit,
      formula: line.formula,
      calculation_rule_id: line.calculationRuleId,
      source_ids: line.sourceIds,
      assumptions: line.assumptions,
      confidence: line.confidence,
      price_source: "none",
      price_low_cents: null,
      price_high_cents: null,
      price_checked_at: null,
    })) as unknown as Json,
  });
  if (error) throw error;
}
