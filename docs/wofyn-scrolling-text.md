# Wofyn Scrolling text

Section Build Plan: existing scrolling_text/text-marquee-custom content section after Flash Sale. Reuse Marquee → Marquee item → Text/Icon kernels. No new markup/schema or Custom CSS. Section owns full width, scheme3/navy201D47, padding16/16 desktop/mobile. Marquee owns gap40 both sizes, existing speed1 and direction forward (rightward keyframes = left to right). Text item owns16px horizontal padding; Text owns14px sm body typography, uppercase saved content “PAWVERA REPEAT EVERYTHING YOUR PET NEEDS”, inherits white. Icon item owns custom Figma heart SVG20×20, no extra padding. Five editable text/icon pairs repeat through existing marquee runtime.

Design source read in browser Dev Mode: section47155:13346, Container13347 gap40, wrapper13348 padding0 16, text13349 Mulish14/500 line-height150%, SVG13350 copied from visible Inspect source. Mobile root audit section47557:6034 height53/padding16; same flow. Nunito retained per user; Text base weight400 differs from Figma500. Existing speed retained because Figma only annotates left-to-right, no exact velocity. Runtime uses existing duplicated tracks/editor lifecycle/reduced-motion support.

QA: scoped JSON equality, schema coverage, Theme Check, desktop/mobile height53px, heart20px, text14px, gap40, moving transform in correct direction, no page overflow. No Git commit/push.

Verified local preview at 1280px and 375px: section height53, mobile document width375 (no overflow), text14, icon20, background rgb(32,29,71), marquee-scroll-right transform advances rightward. Theme Check: 0 errors, 36 existing warnings. git diff --check passed. Proof: /private/tmp/wofyn-scrolling-text.jpg.


## Before-footer shipping strip — 2026-10-12

Reference: Figma node 47317:14834. Existing `pawvera_footer_marquee` keeps the reusable Marquee → Marquee item → Text/Icon composition, its ten item IDs, and saved speed/direction. Only this instance changes to scheme-4 (#faf1ec background, #201d47 text) and five editable “FREE SHIPPING FOR ORDERS OVER $100” messages, alternating with the original 20×20 shipping icon. Gap remains 40px, text wrapper inline padding 16px, section vertical padding 16px, total height 53px. The earlier navy marquee is preserved.

The shipping node 47360:2120 was exported unchanged with Figma exportAsync(SVG_STRING) to `assets/wofyn-shipping.svg`. Shared Icon adds an opt-in Express shipping library choice referencing that asset through asset_url; existing shipping/truck render paths are preserved. The SVG retains its root dimensions and original navy fill. The text retains the agreed theme Nunito body typography rather than Figma Mulish Medium, as with the earlier marquee.

Architecture audit: no section placement, block allow-list, nesting, block-order, or block budget changes. Text and Icon content remain editable and draggable through existing items; shared marquee cloning, hover pause, static/reduced-motion and editor load/unload logic remain intact. The new icon option and schema translation resolve; asset source and rendered geometry were verified.

QA: desktop 1280px and mobile 390px both show height53px, font14px, icon20×20 and loaded SVGs. Mobile document width390px confirms no horizontal page overflow. Animation is marquee-scroll-right with gap40px. Existing marquee tests pass3/3 and Theme Check reports zero errors. Featured product has no Shopify payment button; Add To Cart remains visible. Interactive Theme Editor checks were unavailable in this turn; underlying composition and schema coverage were inspected on disk.

Proof: output/wofyn-footer-scrolling-text/desktop.png and mobile.png. Changes synchronize via the existing development watcher; no theme publication or Git commit/push.
