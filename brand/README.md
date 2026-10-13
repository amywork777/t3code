# brand

text-to-cad Studio's identity, read through `T3CODE_BRAND_DIR` (`scripts/studio.ts` sets it):
`brand.json` names the app and sets the accent, and the files beside it replace T3 Code's
favicons, its wordmark (`mark.svg`) and the desktop dock icon (`app-icon.png`).

Everything comes from text-to-cad's own brand kit, so nothing here is designed in this fork:
`mark.svg`, `app-icon.png` and `favicon.ico` are text-to-cad's `apps/docs/public/brand/logo-c.svg`,
`brand/logo-c.png` and `favicon.ico`; the accent is its docs site's `--brand` token
(`apps/docs/src/app/globals.css`). To refresh from a text-to-cad checkout at `$T`:

```sh
cp $T/apps/docs/public/brand/logo-c.svg brand/mark.svg
cp $T/apps/docs/public/brand/logo-c.png brand/app-icon.png
cp $T/apps/docs/public/favicon.ico brand/favicon.ico
for s in 16 32; do sips -z $s $s brand/app-icon.png --out brand/favicon-${s}x${s}.png; done
sips -z 180 180 brand/app-icon.png --out brand/apple-touch-icon.png
```
