# Pawvera footer

Figma: G7y5fdxzoVS9pDqslTl1Pp, desktop 47562:10848, mobile 47562:12923.

## Composition and ownership

The existing Footer section in the footer section group remains the global surface. Its width, scheme, gaps and desktop/mobile padding controls are unchanged. Saved Groups compose three Menu blocks and a newsletter, followed by divider, copyright, localization and payments. Content and links remain individually editable. There is no template Custom CSS.

The newsletter reuses the Shopify customer Email signup form, and Social links consumes global social URLs. Payments and country/currency use Shopify runtime data. Small reusable extensions add the Figma Send icon, an 8px email input radius, square icon-only signup controls, and opt-in compact/country-currency/mobile-language localization controls. Existing localization defaults remain unchanged.

## Saved design values

Scheme 3 supplies navy #201d47, white text and yellow #fcc93d. Desktop top/bottom padding is 64/36px; mobile is 40/32px. Desktop footer content is 1400px at a 1920px viewport. The newsletter is 512px wide at that size. Its Group uses a 540px width cap including 28px left padding, alongside the 100px parent gap, to produce the design's 128px separation using existing controls. Mobile removes that left padding and stacks the groups. Menu columns have 40px desktop and zero mobile gaps.

The form uses 48px desktop / 44px mobile fields and submit buttons, 12px gap and 8px corners. Mobile menus reuse the native disclosure kernel and scheme border. Footer-to-credits spacing is 56px desktop / 40px mobile; divider-to-credits spacing is 32px.

## Verification and remaining configuration

- Shopify Theme Check passed for all changed footer files; targeted development-theme upload succeeded.
- Storefront QA at 1920px and 375px: menu structure, newsletter dimensions, colors, mobile disclosure toggle, and no horizontal overflow confirmed.
- Theme Editor: existing Footer settings verified; newsletter Heading selected directly from the preview canvas. Save remained disabled, and unsaved-session restoration was not invoked.
- No signup was submitted and no localization selection was changed.
- Nunito remains the theme's shared typography rather than Figma's Gabarito/Mulish. Copyright retains 2026. Payment brands reflect the store's enabled methods rather than the static Figma list.
- Facebook, X and Instagram URLs are not configured in Theme settings. The Social links block is present and selectable in the editor; storefront icons appear when those URLs are supplied. Mission & Values, Careers and Accessibility have editable labels with blank URLs pending merchant configuration.
- Tablet width and live selection of the newsletter Text/Form blocks were not separately verified.

Screenshots: `output/pawvera/footer/desktop.png`, `mobile.png`, `editor-heading.png`.
