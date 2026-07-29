import { describe, expect, it } from "vitest";
import type { ControlCheckpoint, QualityEvidence } from "./quality-model";
import { hasRequiredEvidence } from "./quality-model";
import { assertWorkTransition, canTransitionWork } from "./work-model";

describe("work lifecycle", () => {
  it("requires installed work to be tested before acceptance", () => {
    expect(canTransitionWork("installed", "accepted")).toBe(false);
    expect(canTransitionWork("installed", "tested")).toBe(true);
    expect(canTransitionWork("tested", "accepted")).toBe(true);
  });

  it("rejects invalid lifecycle jumps", () => {
    expect(() => assertWorkTransition("draft", "accepted")).toThrow(RangeError);
  });
});

describe("quality evidence", () => {
  const checkpoint: ControlCheckpoint = {
    id: "checkpoint-1",
    projectId: "project-1",
    workItemId: "work-1",
    targetRefs: [{ entityType: "element", entityId: "pipe-1" }],
    phase: "pre_cover",
    controlType: "test",
    methodReference: "PLUMBING-PRESSURE-TEST@1",
    acceptanceCriteria: { source: "confirmed-procedure" },
    requiredRole: "installer",
    holdPoint: true,
    requiredEvidenceKinds: ["reading", "photo"],
  };

  it("requires every configured evidence kind", () => {
    const evidence: QualityEvidence[] = [
      {
        id: "evidence-1",
        projectId: "project-1",
        checkpointId: checkpoint.id,
        kind: "reading",
        storageObjectId: null,
        value: 6,
        unit: "bar",
        capturedBy: "user-1",
        capturedAt: "2026-07-26T10:00:00.000Z",
        checksum: null,
      },
    ];

    expect(hasRequiredEvidence(checkpoint, evidence)).toBe(false);
    const photoEvidence: QualityEvidence = {
      id: "evidence-2",
      projectId: "project-1",
      checkpointId: checkpoint.id,
      kind: "photo",
      storageObjectId: "private/test/photo.jpg",
      value: null,
      unit: null,
      capturedBy: "user-1",
      capturedAt: "2026-07-26T10:00:00.000Z",
      checksum: "sha256:test",
    };
    expect(hasRequiredEvidence(checkpoint, [...evidence, photoEvidence])).toBe(true);
  });

  it("does not accept evidence from another checkpoint", () => {
    const evidence: QualityEvidence[] = checkpoint.requiredEvidenceKinds.map((kind, index) => ({
      id: `evidence-${index}`,
      projectId: "project-1",
      checkpointId: "checkpoint-other",
      kind,
      storageObjectId: null,
      value: null,
      unit: null,
      capturedBy: "user-1",
      capturedAt: "2026-07-26T10:00:00.000Z",
      checksum: null,
    }));

    expect(hasRequiredEvidence(checkpoint, evidence)).toBe(false);
  });
});
