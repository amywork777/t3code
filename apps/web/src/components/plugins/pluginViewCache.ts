import type { PluginViewDocument } from "@t3tools/contracts";

import { readPluginViewsBridge } from "./pluginViewHost";

interface CachedView {
  readonly document: PluginViewDocument;
  /** Desktop: the staged URL, kept so the view keeps its origin and storage. */
  staged: Promise<string> | null;
}

/** Views kept across tab switches; the oldest is dropped (and released) past this. */
const MAX_CACHED_VIEWS = 8;

// Switching tabs remounts a view's frame. Keeping its document (and, on desktop,
// its staged URL) means a remount neither reruns the tool nor resends the HTML,
// which for the CAD viewer is several MB over a relay or tunnel.
const views = new Map<string, CachedView>();

function release(entry: CachedView) {
  const bridge = readPluginViewsBridge();
  if (bridge === null || entry.staged === null) return;
  void entry.staged.then(
    (url) => bridge.release(url),
    () => undefined,
  );
}

export function cachedPluginView(key: string): PluginViewDocument | null {
  const entry = views.get(key);
  if (entry === undefined) return null;
  views.delete(key);
  views.set(key, entry);
  return entry.document;
}

export function cachePluginView(key: string, document: PluginViewDocument): void {
  const previous = views.get(key);
  if (previous !== undefined) {
    views.delete(key);
    if (previous.document !== document) release(previous);
  }
  views.set(key, { document, staged: previous?.document === document ? previous.staged : null });
  while (views.size > MAX_CACHED_VIEWS) {
    const [oldest, entry] = views.entries().next().value!;
    views.delete(oldest);
    release(entry);
  }
}

/** Drops a view so the next open runs its tool again ("Try again", "Reopen"). */
export function forgetPluginView(key: string): void {
  const entry = views.get(key);
  if (entry === undefined) return;
  views.delete(key);
  release(entry);
}

/**
 * The staged URL for a cached document, staging it on first use. Null when the
 * document is no longer cached, so the caller stages and releases its own.
 */
export function stagedPluginViewUrl(
  key: string,
  document: PluginViewDocument,
  stage: () => Promise<string>,
): Promise<string> | null {
  const entry = views.get(key);
  if (entry === undefined || entry.document !== document) return null;
  if (entry.staged === null) {
    entry.staged = stage();
    entry.staged.catch(() => {
      if (views.get(key) === entry) entry.staged = null;
    });
  }
  return entry.staged;
}
