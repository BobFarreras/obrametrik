import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveCadSpace } from "../app/[locale]/dashboard/projects/[projectId]/actions";
import { CadWorkspace } from "./cad-workspace";

afterEach(cleanup);

vi.mock("../app/[locale]/dashboard/projects/[projectId]/actions", () => ({
  saveCadSpace: vi.fn().mockResolvedValue({
    status: "saved",
    spaceId: "space-1",
    updatedAt: "2026-07-27T06:00:00Z",
  }),
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
  savePending: "Cambios pendientes",
  savingPlan: "Guardando",
  planSaved: "Guardado",
  saveFailed: "Error al guardar",
  undo: "Deshacer",
  redo: "Rehacer",
  selectedComponents: "Componentes seleccionados",
  deleteSelectedComponents: "Eliminar la selección",
  copyComponents: "Copiar",
  pasteComponents: "Pegar",
  duplicateComponents: "Duplicar",
  millimetresUnit: "mm",
  bathroom: "Baño",
  kitchen: "Cocina",
  bedroom: "Dormitorio",
  livingRoom: "Salón",
  hallway: "Pasillo",
  other: "Otros",
};

describe("CadWorkspace", () => {
  it("undoes and redoes the complete CAD document", async () => {
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[]}
        elements={[]}
        messages={messages}
      />,
    );

    expect(screen.getByText("12.00 m²")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Forma L" }));
    expect(screen.queryByText("12.00 m²")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(screen.getByText("12.00 m²")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Rehacer" }));
    expect(screen.queryByText("12.00 m²")).toBeNull();

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(screen.getByText("12.00 m²")).toBeTruthy();
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(screen.queryByText("12.00 m²")).toBeNull();
  });

  it("restores the persisted plan automatically when reopening a project", async () => {
    const space = {
      id: "space-restored",
      projectId: "project-1",
      levelId: "level-1",
      name: "Cuina guardada",
      kind: "kitchen" as const,
      footprint: {
        kind: "polygon" as const,
        vertices: [
          { x: 0, y: 0 },
          { x: 5200, y: 0 },
          { x: 5200, y: 3100 },
          { x: 0, y: 3100 },
        ],
      },
      clearHeightMm: 2780,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotationDegrees: { x: 0, y: 0, z: 0 },
      },
      geometrySource: "manual" as const,
      confirmation: "confirmed" as const,
    };

    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[space]}
        elements={[]}
        messages={messages}
      />,
    );

    await waitFor(() =>
      expect((screen.getByLabelText("Altura") as HTMLInputElement).value).toBe("2780"),
    );
    expect(screen.getByDisplayValue("Cuina guardada")).toBeTruthy();
  });

  it("keeps the returned space identity after the first atomic save", async () => {
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[]}
        elements={[]}
        messages={messages}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(saveCadSpace).toHaveBeenCalledOnce());
    expect(await screen.findByText("Guardado")).toBeTruthy();
  });

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
    const secondSocket = {
      ...socket,
      id: "socket-2",
      transform: {
        ...socket.transform,
        position: { x: 1800, y: 0, z: 350 },
      },
    };
    render(
      <CadWorkspace
        locale="es"
        projectId="project-1"
        spaces={[space]}
        elements={[wall, socket, secondSocket]}
        messages={messages}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Baño/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Enchufe" }).at(-1)!);
    expect(screen.getByLabelText("Anchura")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar componente" })).toBeTruthy();

    const socketButtons = screen.getAllByRole("button", { name: "Enchufe" }).slice(-2);
    fireEvent.click(socketButtons[0]!);
    fireEvent.click(socketButtons[1]!, { shiftKey: true });
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar la selección" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Duplicar" }));
    expect(screen.getAllByRole("button", { name: "Enchufe" })).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    fireEvent.click(screen.getByRole("button", { name: "Pegar" }));
    expect(screen.getAllByRole("button", { name: "Enchufe" })).toHaveLength(7);
  });
});
