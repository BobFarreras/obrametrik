"use server";

import {
  cadSpacePlanSchema,
  createMeasurementSchema,
  createRoomSchema,
  createSurfaceSchema,
  electricalCircuitSchema,
  electricalRouteSchema,
  localeSchema,
  uuidSchema,
} from "@obrametrik/validation";
import {
  buildElectricalProjectCircuits,
  defaultRouteConfiguration,
  GenerateElectricalPlanBillUseCase,
  GenerateElectricalProjectTakeoffUseCase,
  measuredPolylineLengthMm,
  SaveCadPlanUseCase,
} from "@obrametrik/application";
import { createSupabaseBuildingModelRepository, type Json } from "@obrametrik/database";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

function path(formData: FormData) {
  const locale = localeSchema.catch("ca").parse(formData.get("locale"));
  const projectId = uuidSchema.parse(formData.get("projectId"));
  return { locale, projectId, value: `/${locale}/dashboard/projects/${projectId}` };
}

export async function createRoom(formData: FormData) {
  const route = path(formData);
  const parsed = createRoomSchema.safeParse({
    projectId: route.projectId,
    name: formData.get("name"),
    kind: formData.get("kind"),
    lengthCm: formData.get("lengthCm"),
    widthCm: formData.get("widthCm"),
    heightCm: formData.get("heightCm"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("rooms").insert({
    project_id: parsed.data.projectId,
    created_by: data.user.id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    length_m: parsed.data.lengthCm / 100,
    width_m: parsed.data.widthCm / 100,
    height_m: parsed.data.heightCm / 100,
  });
  revalidatePath(route.value);
}

export async function createSurface(formData: FormData) {
  const route = path(formData);
  const parsed = createSurfaceSchema.safeParse({
    roomId: formData.get("roomId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    widthM: formData.get("widthM"),
    heightM: formData.get("heightM"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("surfaces").insert({
    room_id: parsed.data.roomId,
    created_by: data.user.id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    width_m: parsed.data.widthM,
    height_m: parsed.data.heightM,
  });
  revalidatePath(route.value);
}

export async function createMeasurement(formData: FormData) {
  const route = path(formData);
  const parsed = createMeasurementSchema.safeParse({
    surfaceId: formData.get("surfaceId"),
    label: formData.get("label"),
    operation: "subtract",
    widthM: Number(formData.get("widthCm")) / 100,
    heightM: Number(formData.get("heightCm")) / 100,
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("measurements").insert({
    surface_id: parsed.data.surfaceId,
    created_by: data.user.id,
    label: parsed.data.label,
    operation: parsed.data.operation,
    width_m: parsed.data.widthM,
    height_m: parsed.data.heightM,
  });
  revalidatePath(route.value);
}

export async function saveCadSpace(formData: FormData) {
  const route = path(formData);
  const serialized = String(formData.get("plan") ?? "");
  if (!serialized || serialized.length > 100_000) return { status: "error" as const };

  let input: unknown;
  try {
    input = JSON.parse(serialized);
  } catch {
    return { status: "error" as const };
  }
  const parsed = cadSpacePlanSchema.safeParse(input);
  if (!parsed.success || parsed.data.projectId !== route.projectId) {
    return { status: "error" as const };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const repository = createSupabaseBuildingModelRepository(supabase);
    const spaceIdValue = formData.get("spaceId");
    const spaceId =
      typeof spaceIdValue === "string" && spaceIdValue ? uuidSchema.parse(spaceIdValue) : undefined;
    const saved = await new SaveCadPlanUseCase(repository).execute(parsed.data, spaceId);
    await saveElectricalPlanBill(supabase, repository, route.projectId);
    revalidatePath(route.value);
    return { status: "saved" as const, ...saved };
  } catch {
    return { status: "error" as const };
  }
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type BuildingModelRepository = ReturnType<typeof createSupabaseBuildingModelRepository>;

async function saveElectricalPlanBill(
  supabase: ServerSupabaseClient,
  repository: BuildingModelRepository,
  projectId: string,
) {
  const elements = await repository.findElementsByProject(projectId);
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
  const lines = result.lines.map((line) => ({
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
    price_source: "none" as const,
    price_low_cents: null,
    price_high_cents: null,
    price_checked_at: null,
  }));
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
    p_lines: lines as unknown as Json,
  });
  if (error) throw error;
}

export async function createElectricalCircuit(formData: FormData) {
  const route = path(formData);
  const parsed = electricalCircuitSchema.safeParse({
    projectId: route.projectId,
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { status: "error" as const };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error" as const };
  const { error } = await supabase.from("electrical_circuits").insert({
    project_id: parsed.data.projectId,
    created_by: data.user.id,
    name: parsed.data.name,
    code: parsed.data.code,
    status: "confirmed",
  });
  if (error) return { status: "error" as const };
  revalidatePath(route.value);
  return { status: "saved" as const };
}

/**
 * Creates an editable first proposal from confirmed CAD terminals. It is a
 * planning aid: users can still move, delete or extend every generated route.
 */
export async function generateElectricalProposal(formData: FormData) {
  const route = path(formData);
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const repository = createSupabaseBuildingModelRepository(supabase);
  const [elements, existing] = await Promise.all([
    repository.findElementsByProject(route.projectId),
    supabase.from("electrical_circuits").select("id").eq("project_id", route.projectId).limit(1),
  ]);
  if (existing.error || existing.data.length > 0) return;
  const terminals = elements.filter(
    (element) =>
      element.kind === "terminal" &&
      element.confirmation === "confirmed" &&
      element.lifecycle !== "to_remove",
  );
  const groups = [
    { code: "C1" as const, name: "Il·luminació", kinds: new Set(["light", "switch"]) },
    { code: "C2" as const, name: "Endolls", kinds: new Set(["socket"]) },
  ];
  for (const group of groups) {
    const members = terminals.filter((element) =>
      group.kinds.has(String(element.specification.terminalKind)),
    );
    if (!members.length) continue;
    const { data: circuit, error: circuitError } = await supabase
      .from("electrical_circuits")
      .insert({
        project_id: route.projectId,
        created_by: userData.user.id,
        name: group.name,
        code: group.code,
        status: "confirmed",
      })
      .select("id")
      .single();
    if (circuitError || !circuit) throw circuitError ?? new Error("Circuit proposal failed");
    const assignments = members.map((element) => ({
      project_id: route.projectId,
      circuit_id: circuit.id,
      terminal_element_id: element.id,
      created_by: userData.user.id,
    }));
    const { error: assignmentsError } = await supabase
      .from("electrical_circuit_terminals")
      .insert(assignments);
    if (assignmentsError) throw assignmentsError;
    for (const member of members) {
      const target = { x: member.transform.position.x, y: member.transform.position.y };
      const origin = { x: 0, y: 0 };
      const points = [origin, { x: target.x, y: 0 }, target];
      const role = member.specification.terminalKind === "switch" ? "switch_feed" : "distribution";
      const configuration = defaultRouteConfiguration({ circuitCode: group.code, role });
      const { error: segmentError } = await supabase.from("electrical_route_segments").insert({
        project_id: route.projectId,
        circuit_id: circuit.id,
        space_id: member.spaceId,
        created_by: userData.user.id,
        name: `${group.name} · ${member.name}`,
        route_role: role,
        path: points,
        length_mm: measuredPolylineLengthMm(points),
        conductor_configuration: configuration.conductors,
        conduit_system: configuration.conduit.system,
        conduit_diameter_mm: configuration.conduit.diameterMm,
        status: "confirmed",
      });
      if (segmentError) throw segmentError;
    }
    if (group.code === "C1") {
      const lights = members.filter((member) => member.specification.terminalKind === "light");
      const switches = members.filter((member) => member.specification.terminalKind === "switch");
      for (const control of switches) {
        const load = lights
          .filter((light) => light.spaceId === control.spaceId)
          .sort(
            (a, b) =>
              Math.hypot(
                a.transform.position.x - control.transform.position.x,
                a.transform.position.y - control.transform.position.y,
              ) -
              Math.hypot(
                b.transform.position.x - control.transform.position.x,
                b.transform.position.y - control.transform.position.y,
              ),
          )[0];
        if (!load) continue;
        const { data: connection, error: connectionError } = await supabase
          .from("electrical_connections")
          .insert({
            project_id: route.projectId,
            circuit_id: circuit.id,
            load_terminal_id: load.id,
            topology: "simple",
            status: "confirmed",
            created_by: userData.user.id,
          })
          .select("id")
          .single();
        if (connectionError || !connection)
          throw connectionError ?? new Error("Connection proposal failed");
        const { error: controlError } = await supabase
          .from("electrical_connection_controls")
          .insert({
            project_id: route.projectId,
            connection_id: connection.id,
            control_terminal_id: control.id,
            sequence: 0,
            created_by: userData.user.id,
          });
        if (controlError) throw controlError;
        const target = { x: load.transform.position.x, y: load.transform.position.y };
        const origin = { x: control.transform.position.x, y: control.transform.position.y };
        const points = [origin, { x: target.x, y: origin.y }, target];
        const configuration = defaultRouteConfiguration({
          circuitCode: group.code,
          role: "switch_return",
        });
        const { error: returnError } = await supabase.from("electrical_route_segments").insert({
          project_id: route.projectId,
          circuit_id: circuit.id,
          space_id: control.spaceId,
          created_by: userData.user.id,
          name: `${group.name} · retorn ${control.name}`,
          route_role: "switch_return",
          path: points,
          length_mm: measuredPolylineLengthMm(points),
          conductor_configuration: configuration.conductors,
          conduit_system: configuration.conduit.system,
          conduit_diameter_mm: configuration.conduit.diameterMm,
          status: "confirmed",
        });
        if (returnError) throw returnError;
      }
    }
  }
  await saveElectricalPlanBill(supabase, repository, route.projectId);
  revalidatePath(route.value);
}

export async function toggleElectricalTerminal(formData: FormData) {
  const route = path(formData);
  const circuitId = uuidSchema.safeParse(formData.get("circuitId"));
  const terminalId = uuidSchema.safeParse(formData.get("terminalId"));
  if (!circuitId.success || !terminalId.success) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { data: existing } = await supabase
    .from("electrical_circuit_terminals")
    .select("circuit_id")
    .eq("project_id", route.projectId)
    .eq("terminal_element_id", terminalId.data)
    .maybeSingle();
  if (existing?.circuit_id === circuitId.data) {
    await supabase
      .from("electrical_circuit_terminals")
      .delete()
      .eq("project_id", route.projectId)
      .eq("terminal_element_id", terminalId.data);
  } else if (!existing) {
    await supabase.from("electrical_circuit_terminals").insert({
      project_id: route.projectId,
      circuit_id: circuitId.data,
      terminal_element_id: terminalId.data,
      created_by: data.user.id,
    });
  }
  revalidatePath(route.value);
}

export async function saveElectricalRoute(formData: FormData) {
  const route = path(formData);
  let points: unknown;
  try {
    points = JSON.parse(String(formData.get("points")));
  } catch {
    return { status: "error" as const };
  }
  const parsed = electricalRouteSchema.safeParse({
    projectId: route.projectId,
    circuitId: formData.get("circuitId"),
    spaceId: formData.get("spaceId"),
    role: formData.get("role"),
    points,
  });
  if (!parsed.success) return { status: "error" as const };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error" as const };
  const { data: circuit } = await supabase
    .from("electrical_circuits")
    .select("id,name,code")
    .eq("id", parsed.data.circuitId)
    .eq("project_id", route.projectId)
    .maybeSingle();
  if (!circuit) return { status: "error" as const };
  const circuitCode = electricalCircuitSchema.shape.code.safeParse(circuit.code);
  if (!circuitCode.success) return { status: "error" as const };
  const configuration = defaultRouteConfiguration({
    circuitCode: circuitCode.data,
    role: parsed.data.role,
  });
  const { error } = await supabase.from("electrical_route_segments").insert({
    project_id: route.projectId,
    circuit_id: circuit.id,
    space_id: parsed.data.spaceId,
    created_by: data.user.id,
    name: `${circuit.name} · ${parsed.data.role}`,
    route_role: parsed.data.role,
    path: parsed.data.points,
    length_mm: measuredPolylineLengthMm(parsed.data.points),
    conductor_configuration: configuration.conductors,
    conduit_system: configuration.conduit.system,
    conduit_diameter_mm: configuration.conduit.diameterMm,
    status: "confirmed",
  });
  if (error) return { status: "error" as const };
  await saveElectricalPlanBill(
    supabase,
    createSupabaseBuildingModelRepository(supabase),
    route.projectId,
  );
  revalidatePath(route.value);
  return { status: "saved" as const };
}

export async function addTakeoffLineToShoppingList(formData: FormData) {
  const route = path(formData);
  const lineId = uuidSchema.safeParse(formData.get("lineId"));
  if (!lineId.success) return;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { data: line } = await supabase
    .from("takeoff_lines")
    .select("id,project_id,category_id,specification,purchase_quantity,unit")
    .eq("id", lineId.data)
    .eq("project_id", route.projectId)
    .maybeSingle();
  if (!line) return;

  await supabase.from("shopping_list_items").upsert(
    {
      project_id: route.projectId,
      takeoff_line_id: line.id,
      created_by: userData.user.id,
      category_id: line.category_id,
      specification: line.specification,
      quantity: line.purchase_quantity,
      unit: line.unit,
    },
    { onConflict: "project_id,takeoff_line_id", ignoreDuplicates: true },
  );
  revalidatePath(route.value);
}

export async function toggleShoppingListItem(formData: FormData) {
  const route = path(formData);
  const itemId = uuidSchema.safeParse(formData.get("itemId"));
  const checked = formData.get("checked") === "true";
  if (!itemId.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", itemId.data)
    .eq("project_id", route.projectId);
  revalidatePath(route.value);
}
