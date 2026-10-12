# Hotspot and blog polish — 12 October 2026

- Pawvera blog card Corner radius set to Square using its existing setting; desktop card/media computed radius 0px. Schema unchanged.
- Shared hotspot product/custom-content popovers use the rounded token (8px in this theme). Placeholder and real prices explicitly align to start/flex-start, overriding the generic product-card centering.
- Gallery background image elements now occupy their actual cover dimensions, clipped by the existing media surface. Native lazy sizes=auto consequently selects adequate source resolution for landscape-to-portrait crops: at 1440px, bed source changes 480px → 1200px for a 446×520px frame. No sharpening/filter or regenerated asset was used; center crop preserved. Mobile page overflow remains 375px.
- Rebuilt deferred-template-components.css from owning assets; preview uses this bundle for later homepage sections.
- Browser QA PASS: 1440px desktop and 375px mobile hotspot price/radius, real bed popup, blog card/media square, no horizontal page overflow. Placeholder fixture rendered from the actual Liquid snippet with normal centered product-card defaults: price and title share the same left edge; price computed start/flex-start and popup 8px.
- Theme Check 0 errors; hotspot/image tests pass; diff whitespace check passes. No schema/editor controls changed; Theme Editor interactive lifecycle NOT TESTED. Shopify theme dev watcher retained; temporary fixture server/tab stopped/closed. No commit/push or theme publication.

Screenshots: output/pawvera/hotspot-fix/blog-square-desktop.png, hotspot-mobile.png and placeholder-fixed.png.
