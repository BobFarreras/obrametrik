import type { SpatialEntityRef } from "./building-model";

export type ControlPhase = "incoming" | "execution" | "pre_cover" | "final" | "handover";
export type ControlType = "inspection" | "measurement" | "test" | "document";
export type TestResult = "pass" | "fail" | "inconclusive" | "not_applicable";

export type ControlCheckpoint = Readonly<{
  id: string;
  projectId: string;
  workItemId: string | null;
  targetRefs: readonly SpatialEntityRef[];
  phase: ControlPhase;
  controlType: ControlType;
  methodReference: string;
  acceptanceCriteria: Readonly<Record<string, unknown>>;
  requiredRole: string;
  holdPoint: boolean;
  requiredEvidenceKinds: readonly EvidenceKind[];
}>;

export type EvidenceKind =
  | "photo"
  | "video"
  | "reading"
  | "instrument_capture"
  | "data_file"
  | "drawing"
  | "record"
  | "certificate"
  | "signature"
  | "manufacturer_document";

export type QualityEvidence = Readonly<{
  id: string;
  projectId: string;
  checkpointId: string;
  kind: EvidenceKind;
  storageObjectId: string | null;
  value: number | string | boolean | null;
  unit: string | null;
  capturedBy: string;
  capturedAt: string;
  checksum: string | null;
}>;

export type TestRun = Readonly<{
  id: string;
  projectId: string;
  checkpointId: string;
  targetRefs: readonly SpatialEntityRef[];
  performedBy: string;
  performerRole: string;
  instrumentIds: readonly string[];
  evidenceIds: readonly string[];
  result: TestResult;
  performedAt: string;
}>;

export type NonConformity = Readonly<{
  id: string;
  projectId: string;
  testRunId: string;
  targetRefs: readonly SpatialEntityRef[];
  severity: "minor" | "major" | "critical";
  status: "open" | "correction_planned" | "corrected_pending_test" | "closed";
  description: string;
  blocking: boolean;
}>;

export function hasRequiredEvidence(
  checkpoint: ControlCheckpoint,
  evidence: readonly QualityEvidence[],
): boolean {
  const availableKinds = new Set(
    evidence.filter((item) => item.checkpointId === checkpoint.id).map((item) => item.kind),
  );
  return checkpoint.requiredEvidenceKinds.every((kind) => availableKinds.has(kind));
}
