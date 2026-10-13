import type { PluginViewChoice } from "@t3tools/client-runtime/state/plugins";

import type { PluginAppSurface } from "~/rightPanelStore";

const fileName = (path: string) =>
  path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1) || path;

const viewKey = (choice: PluginViewChoice) =>
  [choice.pluginId, choice.view.server, choice.view.tool].map(encodeURIComponent).join("/");

/** The tab id of one view, and of one workspace file in it. */
const fileSurfaceId = (choice: PluginViewChoice, file?: string): PluginAppSurface["id"] =>
  `plugin:${viewKey(choice)}${file === undefined ? "" : `:${encodeURIComponent(file)}`}`;

/**
 * The right-panel tab for a plugin view. One tab per view, and per file for a
 * view that opens files, so opening the same thing again focuses its tab.
 */
export function pluginAppSurface(choice: PluginViewChoice, file?: string): PluginAppSurface {
  const { view } = choice;
  return {
    id: fileSurfaceId(choice, file),
    kind: "plugin-app",
    pluginId: choice.pluginId,
    server: view.server,
    tool: view.tool,
    title: file === undefined ? view.title : fileName(file),
    resourceUri: view.resourceUri,
    arguments: {},
    ...(file === undefined ? {} : { file }),
  };
}

/**
 * The tab for a view an agent opened through its tool (`cad_open`): the view
 * reruns the call with the agent's arguments, one tab per path it names. A
 * path inside the workspace (`file`, workspace-relative) shares the tab that
 * opening the file from Files gives, so one model never gets two tabs.
 */
export function agentViewSurface(
  choice: PluginViewChoice,
  args: Record<string, unknown>,
  path: string | null,
  file: string | null = null,
): PluginAppSurface {
  const { view } = choice;
  const id: PluginAppSurface["id"] =
    file !== null
      ? fileSurfaceId(choice, file)
      : `plugin:${viewKey(choice)}:agent:${encodeURIComponent(path ?? JSON.stringify(args))}`;
  return {
    id,
    kind: "plugin-app",
    pluginId: choice.pluginId,
    server: view.server,
    tool: view.tool,
    title: path === null ? view.title : fileName(path),
    resourceUri: view.resourceUri,
    arguments: args,
  };
}
