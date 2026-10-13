// @effect-diagnostics nodeBuiltinImport:off - a build plugin that reads a folder of brand files.
/**
 * A fork's identity, from the folder `T3CODE_BRAND_DIR` names (text-to-cad
 * Studio's `brand/`): `brand.json` gives the page title and the accent, and the
 * files beside it replace the favicons and the wordmark. The app's name itself
 * is `VITE_APP_BASE_NAME`. Without the variable the app stays T3 Code.
 */
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import type { Plugin } from "vite-plus";

export interface Brand {
  readonly dir: string;
  readonly name: string | null;
  readonly primary: {
    readonly light: string;
    readonly lightForeground: string;
    readonly dark: string;
    readonly darkForeground: string;
  } | null;
  /** The mark that stands in for the T3 wordmark, as a data URL. */
  readonly markUrl: string | null;
}

/** Icons a brand may replace, by the path the page asks for them at. */
const ICONS: Record<string, string> = {
  "/favicon.ico": "image/x-icon",
  "/favicon-16x16.png": "image/png",
  "/favicon-32x32.png": "image/png",
  "/apple-touch-icon.png": "image/png",
};

// T3 Code's splash accents in index.html, light then dark.
const SPLASH_ACCENTS = ['accent: "#4f46e5"', 'accent: "#818cf8"'] as const;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export function readBrand(dir: string | undefined): Brand | null {
  if (!dir) return null;
  const file = NodePath.join(dir, "brand.json");
  if (!NodeFS.existsSync(file)) throw new Error(`T3CODE_BRAND_DIR has no brand.json: ${dir}`);
  const raw = JSON.parse(NodeFS.readFileSync(file, "utf8")) as Record<string, unknown>;
  const primary = (raw.primary ?? {}) as Record<string, unknown>;
  const light = text(primary.light);
  const dark = text(primary.dark);
  const mark = NodePath.join(dir, "mark.svg");
  return {
    dir,
    name: text(raw.name),
    primary:
      light && dark
        ? {
            light,
            lightForeground: text(primary.lightForeground) ?? "#ffffff",
            dark,
            darkForeground: text(primary.darkForeground) ?? "#ffffff",
          }
        : null,
    markUrl: NodeFS.existsSync(mark)
      ? `data:image/svg+xml;base64,${NodeFS.readFileSync(mark).toString("base64")}`
      : null,
  };
}

/**
 * The accent for T3 Code's default look. A theme the user picks sets
 * `data-theme-id` and keeps its own colors.
 */
export function brandCss(brand: Brand): string {
  if (brand.primary === null) return "";
  const { light, lightForeground, dark, darkForeground } = brand.primary;
  return [
    `html:not([data-theme-id]),html[data-theme-id=""]{--primary:${light};--primary-foreground:${lightForeground}}`,
    `html.dark:not([data-theme-id]),html.dark[data-theme-id=""]{--primary:${dark};--primary-foreground:${darkForeground}}`,
  ].join("");
}

export function brandHtml(html: string, brand: Brand): string {
  let out = html;
  if (brand.name !== null) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${brand.name}</title>`);
  }
  if (brand.primary !== null) {
    out = out
      .replace(SPLASH_ACCENTS[0], `accent: "${brand.primary.light}"`)
      .replace(SPLASH_ACCENTS[1], `accent: "${brand.primary.dark}"`)
      .replace("</head>", `<style data-brand>${brandCss(brand)}</style></head>`);
  }
  return out;
}

const brandIcon = (brand: Brand, urlPath: string): string | null => {
  if (!(urlPath in ICONS)) return null;
  const file = NodePath.join(brand.dir, urlPath.slice(1));
  return NodeFS.existsSync(file) ? file : null;
};

export function brandPlugin(dir = process.env.T3CODE_BRAND_DIR?.trim()): Plugin | null {
  const brand = readBrand(dir);
  if (brand === null) return null;
  return {
    name: "t3code:brand",
    config: () => ({
      define: { "import.meta.env.VITE_APP_MARK_URL": JSON.stringify(brand.markUrl ?? "") },
    }),
    // Ahead of Vite's own static files, so the brand's icons win over public/.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url ?? "").split("?")[0] ?? "";
        const file = brandIcon(brand, urlPath);
        if (file === null) return next();
        res.setHeader("Content-Type", ICONS[urlPath]!);
        res.end(NodeFS.readFileSync(file));
      });
    },
    transformIndexHtml: (html) => brandHtml(html, brand),
    writeBundle(options) {
      if (!options.dir) return;
      for (const urlPath of Object.keys(ICONS)) {
        const file = brandIcon(brand, urlPath);
        if (file !== null) NodeFS.copyFileSync(file, NodePath.join(options.dir, urlPath.slice(1)));
      }
    },
  };
}
