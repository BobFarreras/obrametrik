import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CadWorkspace } from "./cad-workspace";

afterEach(cleanup);

vi.mock("../app/[locale]/dashboard/projects/[projectId]/actions", () => ({
  createCadSpace: vi.fn(),
}));

const messages = {
  cadEditor: "Editor técnico",
  cadEditorHelp: "Ayuda",
  mode2d: "Planta 2D",
  mode3d: "Vista 3D",
  selectTool: "Seleccionar",
  doorTool: "Puerta",
  windowTool: "Ventana",
  lightTool: "Punto de luz",
  socketTool: "Enchufe",
  waterTool: "Punto de agua",
  coldWaterTool: "Agua fría",
  hotWaterTool: "Agua caliente",
  drainTool: "Desagüe",
  switchTool: "Interruptor",
  fitPlan: "Encuadrar plano",
  zoomIn: "Ampliar",
  zoomOut: "Reducir",
  componentWidthMm: "Anchura",
  componentHeightMm: "Altura",
  componentElevationMm: "Cota vertical",
  deleteComponent: "Eliminar componente",
  selectedComponent: "Componente seleccionado",
  rectangleShape: "Rectángulo",
  lShape: "Forma L",
  uShape: "Forma U",
  spaceName: "Nombre",
  spaceHeightMm: "Altura",
  savePlan: "Guardar",
  planObjects: "Objetos",
  planCoordinates: "Geometría",
  noPlanObjects: "Sin objetos",
  savedSpaces: "Guardados",
  unsavedPlan: "Espacio nuevo",
  millimetresUnit: "mm",
  bathroom: "Baño",
  kitchen: "Cocina",
  bedroom: "Dormitorio",
  livingRoom: "Salón",
  hallway: "Pasillo",
  other: "Otros",
};

describe("CadWorkspace", () => {
  it("switches between the 2D editor and the 3D projection", () => {
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[]}
        elements={[]}
        messages={messages}
      />,
    );

    expect(screen.getByRole("button", { name: "Planta 2D" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Vista 3D" }));
    expect(screen.getByRole("button", { name: "Vista 3D" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("img", { name: "Vista 3D" })).toBeTruthy();
  });

  it("offers professional shape templates and millimetre inputs", () => {
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[]}
        elements={[]}
        messages={messages}
      />,
    );

    expect(screen.getByRole("button", { name: "Forma L" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Forma U" })).toBeTruthy();
    expect((screen.getByLabelText("Altura") as HTMLInputElement).value).toBe("2500");
  });

  it("offers fitted navigation and distinct technical systems", () => {
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[]}
        elements={[]}
        messages={messages}
      />,
    );

    expect(screen.getByRole("button", { name: "Encuadrar plano" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agua fría" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agua caliente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desagüe" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Interruptor" })).toBeTruthy();
  });

  it("opens an editable inspector for a persisted technical component", () => {
    const space = {
      id: "space-1",
      projectId: "project-1",
      levelId: "level-1",
      name: "Baño",
      kind: "bathroom" as const,
      footprint: { kind: "rectangle" as const, widthMm: 3000, depthMm: 2000 },
      clearHeightMm: 2500,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual" as const,
      confirmation: "confirmed" as const,
    };
    const wall = {
      id: "wall-1",
      projectId: "project-1",
      spaceId: "space-1",
      hostElementId: null,
      hostFace: null,
      kind: "wall" as const,
      name: "wall_1",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      dimensionsMm: { width: 3000, height: 2500, depth: 100 },
      specification: { wallIndex: 0 },
      lifecycle: "new" as const,
      confirmation: "confirmed" as const,
    };
    const socket = {
      ...wall,
      id: "socket-1",
      hostElementId: "wall-1",
      hostFace: "interior" as const,
      kind: "terminal" as const,
      name: "socket",
      transform: {
        position: { x: 1200, y: 0, z: 350 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      dimensionsMm: { width: 80, height: 80, depth: 50 },
      specification: { terminalKind: "socket" },
    };
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[space]}
        elements={[wall, socket]}
        messages={messages}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Baño/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Enchufe" }).at(-1)!);
    expect(screen.getByLabelText("Anchura")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar componente" })).toBeTruthy();
  });
});
