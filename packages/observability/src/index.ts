export type SafeLogEvent = {
  event: string;
  requestId: string;
  durationMs?: number;
  errorCode?: string;
};
export interface ObservabilityPort {
  record(event: SafeLogEvent): void;
}
export const noopObservability: ObservabilityPort = { record: () => undefined };
