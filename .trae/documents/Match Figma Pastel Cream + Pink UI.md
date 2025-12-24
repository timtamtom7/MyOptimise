## Color Palette & Tokens
- Set `--background` to cream `#fff7e5` and `--card` to pastel pink `#ffd0ef`
- Add `--rose` text `#b8325c` and use it for headings, borders, and shadows
- Add sponsor blue tokens: `--cta-blue` `#cfe8ff`, `--cta-blue-border` `#468ccd`
- Update theme variables in `app/globals.css:86` and map to Tailwind colors via existing CSS variables

## Font Setup (Averia Libre)
- Add Google Font "Averia Libre" (italic, bold) with next/font
- Set `--font-display: 'Averia Libre', system-ui, sans-serif` so headings pick it up
- Apply italic + bold on major headings (`h1`, `h2`) and hero titles in `app/globals.css:189` and `components/blocks/*`

## Header Styling
- Keep sticky header but switch to cream background with rose foreground
- Use thick 4px border and sticker shadow
- Ensure header brand/title uses Averia Libre italic bold; keep nav links readable
- Update in `components/header/index.tsx:20` and `components/header/desktop-nav.tsx:17`

## Hero Cards (Three Variants Inspired by Figma)
- Build a reusable "PinkCard" wrapper (rounded-3xl, pastel pink, 2–4px rose border, offset shadow)
- Variant A (Welcome, Optimise!): left PinkCard with big headline and description + blue pill button; right darker-pink panel titled "Sponsor Meals:" with 3 cream slots
- Variant B (Welcome, Tommaso!): left PinkCard with headline and pink pill button; right panel titled "Your Volunteering:" with 3 cream slots
- Variant C (Help distribute meals…): single wide PinkCard with two CTAs (pink vs blue) separated by an "OR" label
- Implement as new block components under `components/blocks/hero/` or adapt `SectionHeader` with `colorVariant='primary'`

## Buttons & Pills
- Add two button variants with CVA in `components/ui/button.tsx:12`:
  - `rose-pill`: pastel pink fill, rose border, thick outline, offset shadow
  - `blue-pill`: sky-blue fill, blue border, same shadow
- Preserve active press-down effect and focus rings

## Card & Panel Styling
- Update `components/ui/card.tsx:10` to pastel pink background, rose border, sticker shadow
- Create a lightweight "CreamSlot" style (cream fill, rounded, inner shadow) for the right panel list items

## Content Logic
- Use `safeGetServerSession` to show "Welcome, {name}!" when logged in; otherwise show generic headline (Variant C)
- Keep copy configurable via Sanity (Section Header or new doc); fallback to hardcoded strings if missing

## Layout
- Use responsive grid: `grid-cols-12` with `col-span-8/4` for desktop; stack cards on mobile
- Consistent spacing and radii; avoid exact Figma measurements but match overall look

## Verification
- Run lint/typecheck; preview on `localhost:3001`
- Check light/dark contrast; ensure focus-visible outlines on CTAs

## Deliverables
- Updated theme tokens and fonts
- Styled header (cream + rose, Averia Libre)
- Three hero variants matching the Figma concept
- Button variants and card/panel styles

If this plan looks good, I’ll implement the palette, font, header, hero cards, and CTA variants in one pass and share a preview for review.