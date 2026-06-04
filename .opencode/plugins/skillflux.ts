import { buildOpenCodeHarnessRequest } from "../../packages/adapters/opencode/src/index.ts";

export const SkillFluxOpenCodePlugin = {
  name: "skillflux-plugin",
  commands: {
    "legal-writer": {
      description: "Invoke the SkillFlux legal-writer harness",
      async handler(request: Record<string, unknown>) {
        return buildOpenCodeHarnessRequest(request, { explicit: true });
      }
    }
  }
};