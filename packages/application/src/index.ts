export type {
  BuildingModelRepository,
  BuildingElementWriter,
  BuildingElementReader,
  BuildingSpaceReader,
  BuildingSpaceWriter,
  DefaultBuildingLevelProvider,
  CadPlanSaver,
  SavedCadPlan,
} from "./ports/building-model-repository";
export { CreateCadPlanUseCase } from "./use-cases/create-cad-plan";
export {
  cadComponentVariants,
  defaultCadComponentVariant,
  isCadComponentVariant,
} from "./models/cad-plan";
export {
  buildElectricalProjectCircuits,
  type ElectricalCircuitRecord,
  type ElectricalRouteSegmentRecord,
  type ElectricalTerminalAssignmentRecord,
} from "./models/electrical-project-plan";
export {
  defaultRouteConfiguration,
  measuredPolylineLengthMm,
  requiredControlCount,
  type ElectricalConnectionTopology,
} from "./models/electrical-editor";
export {
  buildElectricalLayout,
  projectElectricalPoint,
  type ElectricalConductorColor,
  type ElectricalJunctionBox,
  type ElectricalLayout,
  type ElectricalLayoutRun,
  type ElectricalLayoutTerminal,
  type ElectricalLayoutView,
  type ElectricalPoint3Mm,
} from "./models/electrical-layout";
export type {
  CadComponentDraft,
  CadComponentKind,
  CadPlacementSurface,
  CadComponentVariant,
  CadPlanDraft,
  DoorSwing,
} from "./models/cad-plan";
export { SaveCadPlanUseCase } from "./use-cases/save-cad-plan";
export { CreateBuildingSpaceUseCase } from "./use-cases/create-building-space";
export { CreateProjectSpaceUseCase } from "./use-cases/create-project-space";
export { GenerateElectricalTakeoffUseCase } from "./use-cases/generate-electrical-takeoff";
export { GenerateElectricalPlanBillUseCase } from "./use-cases/generate-electrical-plan-bill";
export { GenerateElectricalProjectTakeoffUseCase } from "./use-cases/generate-electrical-project-takeoff";
