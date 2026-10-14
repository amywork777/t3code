import { describe, expect, it } from "vite-plus/test";

import {
  CHAT_DOCK_DEFAULT_WIDTH,
  CHAT_DOCK_MIN_WIDTH,
  WORKBENCH_MIN_WIDTH,
  chatDockWidth,
  workbenchPanelWidth,
} from "./workbenchLayout";

describe("workbench layout", () => {
  it("gives the viewer everything the docked chat leaves", () => {
    expect(workbenchPanelWidth(1400, 400)).toBe(1000);
    // A wider window widens the viewer; the dock keeps its width.
    expect(workbenchPanelWidth(1800, 400)).toBe(1400);
  });

  it("keeps the dock wide enough for the composer", () => {
    expect(chatDockWidth(1400, 200)).toBe(CHAT_DOCK_MIN_WIDTH);
    expect(workbenchPanelWidth(1400, 200)).toBe(1400 - CHAT_DOCK_MIN_WIDTH);
  });

  it("keeps the viewer at its floor when the dock is dragged wide", () => {
    expect(workbenchPanelWidth(1400, 1300)).toBe(WORKBENCH_MIN_WIDTH);
  });

  it("lets the dock yield when the row cannot fit both floors", () => {
    expect(workbenchPanelWidth(600, 400)).toBe(WORKBENCH_MIN_WIDTH);
  });

  it("falls back to the default dock for a width that is not a number", () => {
    expect(chatDockWidth(1400, Number.NaN)).toBe(CHAT_DOCK_DEFAULT_WIDTH);
  });
});
