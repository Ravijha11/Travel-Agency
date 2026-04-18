# Branding

## Brand kit (default)
If you don’t have a finalized brand kit yet, this repo currently uses:
- **Name**: Lahar connect
- **Tagline**: Shared rides between Lahar and Gwalior — find drivers and call instantly.
- **Logo**: `public/lahar-connect-logo.png` (referenced as `LOGO_PATH` in `lib/branding.ts`)
- **Primary color**: green (theme color already set to `#166534`)
- **Tone**: simple, practical, safety-first, “coordination only”

You can evolve this into a proper company brand by deciding:
- logo + app icon
- typography and spacing rules
- marketing imagery (hero/banner)
- support contact details (email/phone)

## Where branding is configured
- Global metadata: `[f:/LahartoGwalior/app/layout.tsx](f:/LahartoGwalior/app/layout.tsx)`
- Web app manifest: `[f:/LahartoGwalior/app/manifest.ts](f:/LahartoGwalior/app/manifest.ts)`
- Styling tokens (CSS variables): `[f:/LahartoGwalior/app/globals.css](f:/LahartoGwalior/app/globals.css)`

## Asset naming rules
Prefer short consistent names in `public/`, e.g. `public/lahar-connect-logo.png`.

Avoid long filenames with spaces, because they are harder to reference and reuse.

