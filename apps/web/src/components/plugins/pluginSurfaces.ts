import type { PluginViewChoice } from "@t3tools/client-runtime/state/plugins";

import type { PluginAppSurface } from "~/rightPanelStore";

const fileName = (path: string) =>
  path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1) || path;

/**
 * The right-panel tab for a plugin view. One tab per view, and per file for a
 * view that opens files, so opening the same thing again focuses its tab.
 */
export function pluginAppSurface(choice: PluginViewChoice, file?: string): PluginAppSurface {
  const { view } = choice;
  const key = [choice.pluginId, view.server, view.tool].map(encodeURIComponent).join("/");
  return {
    id: `plugin:${key}${file === undefined ? "" : `:${encodeURIComponent(file)}`}`,
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
