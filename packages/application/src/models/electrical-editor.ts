import {
  wiringForRouteRole,
  type ElectricalCircuitCode,
  type ElectricalRouteRole,
} from "@obrametrik/calculations";
import type { Point2Mm } from "@obrametrik/domain";

export type ElectricalConnectionTopology =
  "continuous" | "simple" | "two_way" | "intermediate" | "push_button";

export function measuredPolylineLengthMm(points: readonly Point2Mm[]): number {
  return Math.round(
    points.slice(1).reduce((total, point, index) => {
      const previous = points[index]!;
      return total + Math.hypot(point.x - previous.x, point.y - previous.y);
    }, 0),
  );
}

export function defaultRouteConfiguration(input: {
  circuitCode: ElectricalCircuitCode;
  role: ElectricalRouteRole;
}) {
  return {
    conductors: wiringForRouteRole(input),
    conduit: {
      system: "embedded-tube" as const,
      diameterMm: input.circuitCode === "C1" || input.circuitCode === "C11" ? 16 : 20,
    },
  };
}

export function requiredControlCount(topology: ElectricalConnectionTopology): {
  minimum: number;
  maximum?: number;
} {
  if (topology === "continuous") return { minimum: 0, maximum: 0 };
  if (topology === "simple" || topology === "push_button") return { minimum: 1 };
  if (topology === "two_way") return { minimum: 2, maximum: 2 };
  return { minimum: 3 };
}
