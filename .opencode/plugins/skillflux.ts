import { buildOpenCodeHarnessRequest } from "../../packages/adapters/opencode/src/index.ts";

export const SkillFluxOpenCodePlugin = {
  name: "skillflux-plugin",
  async buildHarnessRequest(request: Record<string, unknown>) {
    return buildOpenCodeHarnessRequest(request);
  }
};
