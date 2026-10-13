import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import type { PluginViewChoice } from "@t3tools/client-runtime/state/plugins";
import { type EnvironmentId, ThreadId } from "@t3tools/contracts";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { selectThreadRightPanelState, useRightPanelStore } from "~/rightPanelStore";
import { agentViewSurface, pluginAppSurface } from "./pluginSurfaces";

const ref = scopeThreadRef("env-1" as EnvironmentId, ThreadId.make("thread-A"));
const cad = {
  pluginId: "text-to-cad",
  pluginName: "CAD",
  view: { server: "cad", tool: "cad_open", title: "CAD", resourceUri: "ui://cad" },
} as unknown as PluginViewChoice;

beforeEach(() => {
  useRightPanelStore.setState({
    byThreadKey: {},
    threadPanelVisibilityByThreadKey: {},
    userActionRevisionByThreadKey: {},
    closeRevisionByThreadKey: {},
  });
});

const surfaces = () =>
  selectThreadRightPanelState(useRightPanelStore.getState().byThreadKey, ref).surfaces;

describe("plugin view tabs", () => {
  it("gives a file the agent opens the tab opening it from Files gives", () => {
    const store = useRightPanelStore.getState();
    store.openPluginApp(ref, pluginAppSurface(cad, "parts/bracket.step"));
    const agent = agentViewSurface(
      cad,
      { path: "/work/parts/bracket.step" },
      "/work/parts/bracket.step",
      "parts/bracket.step",
    );
    store.openProactive(ref, agent, store.getUserActionRevision(ref));
    expect(surfaces()).toHaveLength(1);
  });

  it("shows an agent's new arguments in the tab it already opened", () => {
    const store = useRightPanelStore.getState();
    const open = (args: Record<string, unknown>) =>
      store.openProactive(
        ref,
        agentViewSurface(cad, args, "/elsewhere/a.step"),
        store.getUserActionRevision(ref),
      );
    open({ path: "/elsewhere/a.step" });
    open({ path: "/elsewhere/a.step", part: "lid" });
    expect(surfaces()).toHaveLength(1);
    expect(surfaces()[0]).toMatchObject({ arguments: { part: "lid" } });
  });
});
