"use client";

import { measuredPolylineLengthMm } from "@obrametrik/application";
import type { BuildingElement, BuildingSpace, Point2Mm } from "@obrametrik/domain";
import type { messages } from "@obrametrik/i18n";
import { useMemo, useState, type PointerEvent } from "react";
import {
  createElectricalCircuit,
  generateElectricalProposal,
  saveElectricalRoute,
  toggleElectricalTerminal,
} from "../app/[locale]/dashboard/projects/[projectId]/actions";

type Catalog = (typeof messages)[keyof typeof messages];
type Circuit = { id: string; code: string; name: string };
type Assignment = { circuit_id: string; terminal_element_id: string };
type ElectricalRouteRole =
  "distribution" | "light_feed" | "switch_feed" | "switch_return" | "travellers" | "control";
const CODES = ["C1", "C2", "C3", "C4", "C5", "C10", "C11"] as const;
const ROLES = [
  "distribution",
  "light_feed",
  "switch_feed",
  "switch_return",
  "travellers",
  "control",
] as const;

export function ElectricalEditor({
  assignments,
  circuits,
  elements,
  locale,
  messages: t,
  projectId,
  spaces,
}: {
  assignments: readonly Assignment[];
  circuits: readonly Circuit[];
  elements: readonly BuildingElement[];
  locale: string;
  messages: Catalog;
  projectId: string;
  spaces: readonly BuildingSpace[];
}) {
  const [selectedCircuitId, setSelectedCircuitId] = useState(circuits[0]?.id ?? "");
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaces[0]?.id ?? "");
  const [role, setRole] = useState<ElectricalRouteRole>("distribution");
  const [points, setPoints] = useState<readonly Point2Mm[]>([]);
  const space = spaces.find((item) => item.id === selectedSpaceId);
  const vertices = useMemo(() => (space ? verticesFromSpace(space) : []), [space]);
  const box = useMemo(() => fitViewBox(vertices), [vertices]);
  const terminals = elements.filter(
    (element) =>
      element.kind === "terminal" &&
      element.confirmation === "confirmed" &&
      ["light", "switch", "socket"].includes(String(element.specification.terminalKind)),
  );

  function addPoint(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPoints((current) => [
      ...current,
      {
        x: Math.round(box.x + ((event.clientX - bounds.left) / bounds.width) * box.width),
        y: Math.round(box.y + ((event.clientY - bounds.top) / bounds.height) * box.height),
      },
    ]);
  }

  return (
    <main className="electrical-editor-page">
      <header className="electrical-editor-heading">
        <span className="eyebrow">{t.electricalCircuits}</span>
        <h1>{t.electricalEditor}</h1>
        <p>{t.electricalEditorHelp}</p>
        <form action={generateElectricalProposal}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <button className="button button-primary" type="submit">
            {t.generateElectricalProposal}
          </button>
        </form>
      </header>

      <section className="electrical-editor-card">
        <h2>{t.newCircuit}</h2>
        <form
          action={async (formData) => {
            await createElectricalCircuit(formData);
          }}
          className="electrical-circuit-form"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <label>
            <span>{t.circuitName}</span>
            <input name="name" required maxLength={100} />
          </label>
          <label>
            <span>{t.circuitCode}</span>
            <select name="code" defaultValue="C1">
              {CODES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <button className="button button-primary" type="submit">
            {t.confirmCircuit}
          </button>
        </form>
      </section>

      <section className="electrical-editor-card">
        <h2>{t.electricalCircuits}</h2>
        {circuits.length === 0 ? (
          <p>{t.noCircuits}</p>
        ) : (
          <div className="electrical-choice-row">
            {circuits.map((circuit) => (
              <button
                aria-pressed={selectedCircuitId === circuit.id}
                className={selectedCircuitId === circuit.id ? "is-active" : ""}
                key={circuit.id}
                onClick={() => setSelectedCircuitId(circuit.id)}
                type="button"
              >
                {circuit.code} · {circuit.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedCircuitId ? (
        <>
          <section className="electrical-editor-card">
            <h2>{t.assignedPoints}</h2>
            <div className="electrical-terminal-grid">
              {terminals.map((terminal) => {
                const assignment = assignments.find(
                  (item) => item.terminal_element_id === terminal.id,
                );
                const selected = assignment?.circuit_id === selectedCircuitId;
                const unavailable = Boolean(assignment && !selected);
                return (
                  <form action={toggleElectricalTerminal} key={terminal.id}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="circuitId" value={selectedCircuitId} />
                    <input type="hidden" name="terminalId" value={terminal.id} />
                    <button
                      aria-pressed={selected}
                      className={selected ? "is-assigned" : ""}
                      disabled={unavailable}
                      type="submit"
                    >
                      <span>{terminalGlyph(terminal)}</span>
                      <strong>{terminal.name}</strong>
                      <small>{selected ? t.removeFromCircuit : t.assignToCircuit}</small>
                    </button>
                  </form>
                );
              })}
            </div>
          </section>

          <section className="electrical-editor-card electrical-route-editor">
            <div>
              <span className="eyebrow">{t.confirmedRoute}</span>
              <h2>{t.drawRoute}</h2>
            </div>
            <div className="electrical-choice-row">
              {spaces.map((item) => (
                <button
                  aria-pressed={selectedSpaceId === item.id}
                  className={selectedSpaceId === item.id ? "is-active" : ""}
                  key={item.id}
                  onClick={() => {
                    setSelectedSpaceId(item.id);
                    setPoints([]);
                  }}
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="electrical-choice-row">
              {ROLES.map((item) => (
                <button
                  aria-pressed={role === item}
                  className={role === item ? "is-active" : ""}
                  key={item}
                  onClick={() => setRole(item)}
                  type="button"
                >
                  {routeRoleLabel(item, t)}
                </button>
              ))}
            </div>
            <svg
              aria-label={t.drawRoute}
              className="electrical-plan-canvas"
              onPointerDown={addPoint}
              role="application"
              viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
            >
              <polygon points={vertices.map((point) => `${point.x},${point.y}`).join(" ")} />
              {points.length > 1 ? (
                <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
              ) : null}
              {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={70} />
              ))}
            </svg>
            <strong className="electrical-route-length">
              {(measuredPolylineLengthMm(points) / 1000).toLocaleString(locale)} m
            </strong>
            <form
              action={async (formData) => {
                await saveElectricalRoute(formData);
              }}
              className="electrical-route-actions"
            >
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="circuitId" value={selectedCircuitId} />
              <input type="hidden" name="spaceId" value={selectedSpaceId} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="points" value={JSON.stringify(points)} />
              <button type="button" onClick={() => setPoints([])}>
                {t.cancelRoute}
              </button>
              <button className="button button-primary" disabled={points.length < 2} type="submit">
                {t.finishRoute}
              </button>
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}

function terminalGlyph(element: BuildingElement) {
  if (element.specification.terminalKind === "light") return "☼";
  if (element.specification.terminalKind === "switch") return "◒";
  return "◉";
}

function verticesFromSpace(space: BuildingSpace): readonly Point2Mm[] {
  if (space.footprint.kind === "polygon") return space.footprint.vertices;
  return [
    { x: 0, y: 0 },
    { x: space.footprint.widthMm, y: 0 },
    { x: space.footprint.widthMm, y: space.footprint.depthMm },
    { x: 0, y: space.footprint.depthMm },
  ];
}

function fitViewBox(vertices: readonly Point2Mm[]) {
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const minX = Math.min(...xs, 0);
  const minY = Math.min(...ys, 0);
  const width = Math.max(Math.max(...xs, 1000) - minX, 1000);
  const height = Math.max(Math.max(...ys, 1000) - minY, 1000);
  const margin = Math.max(width, height) * 0.1;
  return {
    x: minX - margin,
    y: minY - margin,
    width: width + margin * 2,
    height: height + margin * 2,
  };
}

function routeRoleLabel(role: ElectricalRouteRole, t: Catalog) {
  return {
    distribution: t.distributionRoute,
    light_feed: t.lightFeedRoute,
    switch_feed: t.switchFeedRoute,
    switch_return: t.switchReturnRoute,
    travellers: t.travellersRoute,
    control: t.controlRoute,
  }[role];
}
