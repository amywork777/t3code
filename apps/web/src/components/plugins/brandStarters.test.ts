import type { InstalledPlugin } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { brandStarterPrompts, readBrandStarters } from "./brandStarters";

const plugin = (skills: string[], enabled = true) =>
  ({ enabled, skills, starterPrompts: [] }) as unknown as InstalledPlugin;

const starters = readBrandStarters(
  JSON.stringify([
    { prompt: "Check this bracket under load", skill: "fea" },
    { prompt: "Route this board", skill: "pcb" },
    { prompt: "Check this part for CNC machining", skill: "dfm" },
    { prompt: "Design a bracket", skill: "cad" },
  ]),
);

describe("brand starters", () => {
  it("offers only the jobs an enabled plugin has the skill for", () => {
    expect(brandStarterPrompts(starters, [plugin(["cad", "dfm"])], 4)).toEqual([
      "Check this part for CNC machining",
      "Design a bracket",
    ]);
    expect(brandStarterPrompts(starters, [plugin(["fea", "pcb"], false)], 4)).toEqual([]);
  });

  it("keeps the brand's order up to the limit", () => {
    expect(brandStarterPrompts(starters, [plugin(["cad", "dfm", "fea", "pcb"])], 2)).toEqual([
      "Check this bracket under load",
      "Route this board",
    ]);
  });

  it("leaves the plugins' own starters when the brand has none", () => {
    expect(brandStarterPrompts([], [plugin(["cad"])], 3)).toBeNull();
    expect(readBrandStarters(undefined)).toEqual([]);
    expect(readBrandStarters("not json")).toEqual([]);
  });
});
