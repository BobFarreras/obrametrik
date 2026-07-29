import { describe, expect, it, vi } from "vitest";
import { SaveCadPlanUseCase } from "./use-cases/save-cad-plan";

const plan = {
  projectId: "project-1",
  name: "Bany",
  kind: "bathroom" as const,
  vertices: [
    { x: 0, y: 0 },
    { x: 3000, y: 0 },
    { x: 3000, y: 2000 },
  ],
  clearHeightMm: 2500,
  components: [],
};

describe("SaveCadPlanUseCase", () => {
  it("keeps the stable space identity when updating atomically", async () => {
    const saver = {
      saveCadPlan: vi.fn().mockResolvedValue({
        spaceId: "space-1",
        updatedAt: "2026-07-27T06:00:00Z",
      }),
    };

    await new SaveCadPlanUseCase(saver).execute(plan, "space-1");

    expect(saver.saveCadPlan).toHaveBeenCalledWith(plan, "space-1");
  });

  it("validates before calling persistence", async () => {
    const saver = { saveCadPlan: vi.fn() };
    await expect(
      new SaveCadPlanUseCase(saver).execute({
        ...plan,
        components: [{ kind: "door", point: { x: 0, y: 0 }, wallIndex: 7 }],
      }),
    ).rejects.toThrow("unknown wall");
    expect(saver.saveCadPlan).not.toHaveBeenCalled();
  });
});
