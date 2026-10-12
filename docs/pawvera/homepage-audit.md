# Pawvera homepage audit — 12 October 2026

Branch: Pawvera-template. Store: layouthub-template-v2.myshopify.com. Development theme: 192069828907. Figma file G7y5fdxzoVS9pDqslTl1Pp, desktop 47306:8476 and mobile frame within Pawvera 47614:18267. Scope: 14 active index sections; footer work retained separately.

## Layout measurements

Measurements taken after lazy components/carousels initialized, at 1920px and 375px. Heights include section padding; approximate differences below 1px are rounding. Tablet 768px and desktop 1440px also checked: no horizontal page overflow, margins 30px/40px respectively. Mobile margin 16px; configured max page width 1480px, giving 1400px content at 1920px. Product media inset is 0.

| Section | Figma desktop | Preview desktop | Figma mobile | Preview mobile |
| --- | ---: | ---: | ---: | ---: |
| Hero | 703 | 703 | 676 | 712 |
| Brands | 180 | 180 | 156 | 156 |
| Collection tabs | 617 | 606.99 | 555.5 | 546.90 |
| Countdown | 594 | 593.99 | 507 | 507 |
| Collection list | 434 | 433.59 | 520 | 519.80 |
| Food product banner | 1032 | 1032 | 1432.17 | 1432.16 |
| Shop Deals | 786 | 786 | 884.33 | 884.33 |
| Toys carousel | 617 | 587.40 | 439.5 | 445.90 |
| Hotspot gallery | 639.67 | 639.66 | 1094.33 | 1094.33 |
| Navy marquee | 53 | 53 | 53 | 53 |
| Featured product | 861 | 840 | 1344 | 1312 |
| Testimonials | 835 | 742.59 | 1175 | 1170.39 |
| Blog cards | 711 | 710.60 | 1362.75 | 1362.75 |
| Shipping marquee | 53 | 53 | 53 | 53 |

### Changes applied

- Created and selected Pawvera collections in index; collection card display omits the Pawvera suffix while retaining it in Admin.
- Hero, sale buttons, banner and hotspot CTAs now target Pawvera collection resources.
- Banner heading changed from lg to xl (38px desktop/30px mobile). With all six real products, banner matches both reference section heights.
- Testimonials mobile padding changed 64 to 80px, header gap 28 to 32px, section header-to-card gap 36 to 40px; quote/content mobile alignment centered.
- New tab bound to New Arrivals Pawvera and its first four products are the four newly created products.
- Bed hotspot bound to Cozy Bolster Dog Bed; adjacent accessory hotspot bound to existing Magic Link after user confirmed actual image shows a leash. Corrected image alt that previously said grooming brush.
- No active index placeholder resource remains. Disabled banner header still contains preset placeholder copy but is not rendered.

### Remaining visual differences and content concerns

- Hero mobile is 36px taller: Nunito wraps the headline into three lines. Nunito is intentionally retained from the theme; Figma uses Gabarito/Mulish. Changing spacing to hide this typography difference would not achieve faithful wrapping.
- Collection/toy/featured-product heights differ partly because the Figma has review rows and the catalog has no genuine review metafields. No fabricated review data was added to force the height.
- Testimonials desktop navigation is hidden when two cards fit the two-column layout; Figma includes a navigation row. Retained the theme's no-inert-controls contract instead of duplicating reviews for arrows.
- Testimonials mobile author still appears before the quote; Figma puts it after the quote. A mobile order setting on the review content would be needed for an editor-friendly exact match; it was not added during this audit.
- Review statistics (18,000+ / 96% / 400.000+) and testimonial quotes are existing Figma demo copy, not verified store analytics.
- “Up to 50% OFF Top Gear” matches the design but current catalog discounts reach approximately 38.46% (Twin Falcon), not 50%. Recommend “Save on Top Gear” unless a genuine 50% offer is configured.
- The Figma wet-food title says Pate while its reference can says Chicken & Sweet Potato Chopped Recipe. Exact design title retained; description documents actual label wording.
- Premium Dog Kibble is the curated Figma food list, including treats/topper/wet food; it is not a strict kibble taxonomy collection.
- Blog cards reuse the existing Wofyn articles, which match design titles/excerpts. No new articles were requested or created. Header/announcement/menu and footer still contain some Wofyn links/resources outside the index binding changes; footer remains ongoing separate work.

## Catalog result

Four products created, each with four READY WebP images in catalog → product life → angle → detail order. Every product has grounded description, custom.summary (multi_line_text_field), New tag, one default variant, catalog variant image, custom.secondary_image (file_reference) pointing to product life, approved sale/compare-at prices and stock 20 at Shop location. No extra Color/Size selectors were added.

Eleven manual Pawvera collections have representative images and are published to Online Store:
Walks 1; Bowls 1; Beds 1; Toys 6; Foods 7; Top Picks 4; Premium Dog Kibble 6; Shop All 18; Sale 16; New Arrivals 16; Grooming 1.

Twelve existing product compare-at prices were updated only after user approved the exact demo values; their sale prices and inventory were preserved. They are shared Wofyn resources, so the price metadata is also visible when those products are used elsewhere.

Automatic review initially rejected adding those twelve to Sale; a subsequent explicit user approval authorized the membership change and it succeeded. A later rejection prevented adding the new bed/brush to Sale under that narrower approval. Safe alternative: bed/brush created in topical, All and New collections, excluded from Sale; no action remains blocked.

## Verification

- Admin readback confirms all four products ACTIVE/published, four READY images each, stock 20, summary and secondary image, one default option and correct categories.
- All eleven collections have an image and Online Store availability; resource membership and New ordering read back.
- Browser: New/Sale tab switching, actual images and product links; bed hotspot opens correct product/price; no horizontal overflow at 375, 768, 1440 and 1920px.
- Theme Check: 0 errors, 104 warnings. Diff whitespace check passes.
- Existing 20 lifecycle/card/spacing/testimonial tests passed. Broader related batch: 30 of 32 passed; two unchanged collection-thumbnail tests in heading-size-sync.test.cjs fail because the test harness does not support Shopify content_for. The test and thumbnail implementation have no diff in this task.
- Theme Editor interactive reordering/selection was not re-tested; changes are existing settings/resource bindings only, with no new schema.
- No theme publication and no Git commit/push during this audit.

See animation-audit.md for the proposed A/B concept. Admin IDs, URLs and immutable readbacks: content-receipt.json and content-verified.json. Raw measurements: desktop-spacing-audit.json / mobile-spacing-audit.json.
