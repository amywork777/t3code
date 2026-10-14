import type { EnvironmentId, ThreadId } from "@t3tools/contracts";

/** One tool call a plugin view made of its own server, with what came back. */
export interface PluginViewCall {
  readonly environmentId: EnvironmentId;
  readonly threadId: ThreadId | null;
  readonly pluginId: string;
  readonly server: string;
  readonly name: string;
  readonly arguments: Record<string, unknown> | undefined;
  readonly result: unknown;
}

type Listener = (call: PluginViewCall) => void;
const listeners = new Set<Listener>();

/**
 * Hears every call a plugin view makes of its own server, as the frame relays
 * it: a host feature can follow what a view shows (text-to-cad's `cad_sync`)
 * without asking the server again. Returns the way to stop listening.
 */
export function onPluginViewCall(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportPluginViewCall(call: PluginViewCall) {
  for (const listener of listeners) {
    try {
      listener(call);
    } catch (error) {
      console.error("A plugin view call listener failed.", error);
    }
  }
}
