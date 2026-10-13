import {
  pluginFollowTarget,
  workspaceRelativePath,
} from "@t3tools/client-runtime/state/pluginFollow";
import type {
  EnvironmentId,
  OrchestrationV2ProjectedTurnItem,
  ScopedThreadRef,
} from "@t3tools/contracts";
import { useEffect } from "react";

import {
  type PluginAppSurface,
  selectThreadRightPanelState,
  useRightPanelStore,
} from "~/rightPanelStore";
import { pluginEnvironment } from "~/state/plugins";
import { useEnvironmentQuery } from "~/state/query";
import { agentViewSurface, pluginAppSurface } from "./pluginSurfaces";

interface ThreadFollowState {
  /**
   * Runs seen in progress while this client was open, each with the panel's
   * user-action revision when it was first seen. Only their items are followed.
   */
  readonly liveRuns: Map<string, number>;
  readonly followed: Set<string>;
}

// Per thread for the session, so a remount or a thread switch never replays an item,
// and opening an old thread never opens what its finished runs wrote.
const followByThread = new Map<string, ThreadFollowState>();

function followState(threadKey: string): ThreadFollowState {
  let state = followByThread.get(threadKey);
  if (state === undefined) {
    state = { liveRuns: new Map(), followed: new Set() };
    followByThread.set(threadKey, state);
  }
  return state;
}

/**
 * Shows plugin views beside a thread as its agent works, the way Backplane
 * redraws the board as the agent saves:
 * - an agent's call to a view's tool (text-to-cad's `cad_open`) opens that
 *   view with the call's arguments, as Codex opens the tab it asked for;
 * - with `followFiles`, when a run writes a file a view claims (a `.step`)
 *   and none of that plugin's views is open yet, the file opens in one. An
 *   open view refreshes itself and the agent switches it (`cad_show`), and a
 *   panel choice made during the run wins.
 */
export function usePluginFollow(input: {
  readonly environmentId: EnvironmentId;
  readonly threadRef: ScopedThreadRef | null;
  readonly threadKey: string | null;
  readonly runningRunId: string | null;
  readonly items: ReadonlyArray<OrchestrationV2ProjectedTurnItem>;
  /** The thread's working directory, to make the agent's absolute paths workspace-relative. */
  readonly workspaceRoot: string | null;
  readonly followFiles: boolean;
}) {
  const { environmentId, threadRef, threadKey, runningRunId, items, workspaceRoot, followFiles } =
    input;
  const list = useEnvironmentQuery(
    threadRef === null ? null : pluginEnvironment.list({ environmentId, input: {} }),
  );
  const plugins = list.data?.plugins;

  useEffect(() => {
    if (threadRef === null || threadKey === null || runningRunId === null) return;
    const { liveRuns } = followState(threadKey);
    if (!liveRuns.has(runningRunId)) {
      liveRuns.set(runningRunId, useRightPanelStore.getState().getUserActionRevision(threadRef));
    }
  }, [threadRef, threadKey, runningRunId]);

  useEffect(() => {
    if (threadRef === null || threadKey === null || plugins === undefined) return;
    const state = followState(threadKey);
    if (state.liveRuns.size === 0) return;
    // An agent's own call opens over anything; a followed file yields to the user.
    let next: { readonly surface: PluginAppSurface; readonly revision: number | null } | null =
      null;
    for (const { item } of items) {
      const runRevision = item.runId === null ? undefined : state.liveRuns.get(item.runId);
      if (runRevision === undefined) continue;
      if (item.status !== "completed" || state.followed.has(item.id)) continue;
      state.followed.add(item.id);
      const target = pluginFollowTarget(plugins, item);
      if (target === null) continue;
      if (target.kind === "agent") {
        next = {
          surface: agentViewSurface(target.choice, target.arguments, target.path),
          revision: null,
        };
        continue;
      }
      if (!followFiles) continue;
      const file = workspaceRelativePath(target.path, workspaceRoot);
      if (file !== null)
        next = { surface: pluginAppSurface(target.choice, file), revision: runRevision };
    }
    if (next === null) return;
    const panels = useRightPanelStore.getState();
    const open = selectThreadRightPanelState(panels.byThreadKey, threadRef).surfaces;
    const pluginId = next.surface.pluginId;
    if (
      next.revision !== null &&
      open.some((surface) => surface.kind === "plugin-app" && surface.pluginId === pluginId)
    ) {
      return;
    }
    panels.openProactive(
      threadRef,
      next.surface,
      next.revision ?? panels.getUserActionRevision(threadRef),
    );
  }, [threadRef, threadKey, plugins, items, workspaceRoot, followFiles]);
}
