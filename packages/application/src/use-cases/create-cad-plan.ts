import type {
  BuildingElement,
  BuildingElementDraft,
  BuildingSpace,
  Point2Mm,
  SpaceKind,
} from "@obrametrik/domain";
import type {
  BuildingElementWriter,
  BuildingSpaceWriter,
  DefaultBuildingLevelProvider,
} from "../ports/building-model-repository";
import { CreateProjectSpaceUseCase } from "./create-project-space";

export type CadComponentKind =
  "door" | "window" | "light" | "switch" | "socket" | "cold_water" | "hot_water" | "drain";

export type CadComponentDraft = Readonly<{
  kind: CadComponentKind;
  point: Point2Mm;
  wallIndex: number;
  widthMm?: number | undefined;
  heightMm?: number | undefined;
  elevationMm?: number | undefined;
}>;

export type CadPlanDraft = Readonly<{
  projectId: string;
  name: string;
  kind: SpaceKind;
  vertices: readonly Point2Mm[];
  clearHeightMm: number;
  components: readonly CadComponentDraft[];
}>;

type CadPlanRepository = BuildingSpaceWriter & DefaultBuildingLevelProvider & BuildingElementWriter;

function defaultsForOpening(kind: "door" | "window"): number {
  return kind === "door" ? 900 : 1200;
}

function wallDraft(
  space: BuildingSpace,
  start: Point2Mm,
  end: Point2Mm,
  index: number,
): BuildingElementDraft {
  return {
    projectId: space.projectId,
    spaceId: space.id,
    hostElementId: null,
    hostFace: null,
    kind: "wall",
    name: `wall_${index + 1}`,
    transform: {
      position: { x: start.x, y: start.y, z: 0 },
      rotationDegrees: {
        x: 0,
        y: 0,
        z: Math.round((Math.atan2(end.y - start.y, end.x - start.x) * 180_000) / Math.PI) / 1000,
      },
    },
    dimensionsMm: {
      width: Math.round(Math.hypot(end.x - start.x, end.y - start.y)),
      height: space.clearHeightMm,
      depth: 100,
    },
    specification: { source: "cad", wallIndex: index },
    lifecycle: "new",
    confirmation: "confirmed",
  };
}

function componentDraft(
  space: BuildingSpace,
  wall: BuildingElement,
  component: CadComponentDraft,
): BuildingElementDraft {
  const defaultDimensions =
    component.kind === "door"
      ? { width: 900, height: 2100, depth: 100 }
      : component.kind === "window"
        ? { width: 1200, height: 1000, depth: 100 }
        : { width: 100, height: 100, depth: 50 };
  const dimensions = {
    ...defaultDimensions,
    width: component.widthMm ?? defaultDimensions.width,
    height: component.heightMm ?? defaultDimensions.height,
  };
  const defaultElevation =
    component.kind === "light"
      ? Math.max(100, space.clearHeightMm - 200)
      : component.kind === "socket"
        ? 350
        : component.kind === "switch"
          ? 1100
          : component.kind === "cold_water" || component.kind === "hot_water"
            ? 600
            : component.kind === "drain"
              ? 150
              : 0;
  const positionZ = component.elevationMm ?? defaultElevation;

  return {
    projectId: space.projectId,
    spaceId: space.id,
    hostElementId: wall.id,
    hostFace: "interior",
    kind: component.kind === "door" || component.kind === "window" ? component.kind : "terminal",
    name: component.kind,
    transform: {
      position: { ...component.point, z: positionZ },
      rotationDegrees: wall.transform.rotationDegrees,
    },
    dimensionsMm: dimensions,
    specification: { source: "cad", terminalKind: component.kind },
    lifecycle: "new",
    confirmation: "confirmed",
  };
}

export class CreateCadPlanUseCase {
  constructor(private readonly repository: CadPlanRepository) {}

  async execute(plan: CadPlanDraft): Promise<BuildingSpace> {
    const openingIntervals = new Map<number, Array<{ start: number; end: number }>>();
    for (const component of plan.components) {
      if (component.wallIndex >= plan.vertices.length) {
        throw new RangeError("CAD component references an unknown wall");
      }
      const componentHeight =
        component.heightMm ??
        (component.kind === "door" ? 2100 : component.kind === "window" ? 1000 : 100);
      if ((component.elevationMm ?? 0) + componentHeight > plan.clearHeightMm) {
        throw new RangeError("CAD component exceeds the host wall height");
      }
      if (component.kind === "door" || component.kind === "window") {
        const start = plan.vertices[component.wallIndex]!;
        const end = plan.vertices[(component.wallIndex + 1) % plan.vertices.length]!;
        const wallDx = end.x - start.x;
        const wallDy = end.y - start.y;
        const wallLength = Math.hypot(wallDx, wallDy);
        const offset =
          ((component.point.x - start.x) * wallDx + (component.point.y - start.y) * wallDy) /
          wallLength;
        const halfWidth = (component.widthMm ?? defaultsForOpening(component.kind)) / 2;
        if (offset < halfWidth || offset > wallLength - halfWidth) {
          throw new RangeError("CAD opening must fit inside its host wall");
        }
        const intervals = openingIntervals.get(component.wallIndex) ?? [];
        const interval = { start: offset - halfWidth, end: offset + halfWidth };
        if (
          intervals.some(
            (existing) => interval.start < existing.end && interval.end > existing.start,
          )
        ) {
          throw new RangeError("CAD openings must not overlap");
        }
        intervals.push(interval);
        openingIntervals.set(component.wallIndex, intervals);
      }
    }
    const space = await new CreateProjectSpaceUseCase(this.repository).execute({
      projectId: plan.projectId,
      name: plan.name,
      kind: plan.kind,
      footprint: { kind: "polygon", vertices: plan.vertices },
      clearHeightMm: plan.clearHeightMm,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual",
      confirmation: "confirmed",
    });

    const walls: BuildingElement[] = [];
    for (let index = 0; index < plan.vertices.length; index += 1) {
      walls.push(
        await this.repository.createElement(
          wallDraft(
            space,
            plan.vertices[index]!,
            plan.vertices[(index + 1) % plan.vertices.length]!,
            index,
          ),
        ),
      );
    }
    for (const component of plan.components) {
      const wall = walls[component.wallIndex];
      if (!wall) throw new RangeError("CAD component references an unknown wall");
      await this.repository.createElement(componentDraft(space, wall, component));
    }
    return space;
  }
}
