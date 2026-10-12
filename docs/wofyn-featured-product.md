# Featured product — Wofyn

Reference: Figma G7y5fdxzoVS9pDqslTl1Pp, node 47309:9074. Implementation on the current Pawvera-template branch; only the existing Featured product composition is edited. Existing development watcher targets 192069828907 on layouthub-template-v2.myshopify.com.

## Composition and ownership

Reuse the static Product media / Product details blocks and existing Group, Text, product title/price/description/inventory, variant picker, quantity, checkout and shop payment primitives. The editable Sleep Well label is a Group + Text composition. Product prices, images, stock, options and review availability remain Shopify data. No catalog or review records were changed.

Section settings add opt-in Adapt to details width (576px in this instance) and vertical alignment. Existing column modes and their default middle alignment are retained. The shared media block adds an opt-in square main image frame and separate desktop thumbnail gap; other gallery instances retain original aspect ratio and derived gap defaults. New scoped editor labels are literal English, following existing section-specific label conventions; existing aspect-ratio option translations are reused. No block files were added.

At a 1920px viewport, the existing page-width system provides 1400px of content: gallery 744px, main square image 648px, information 576px, gap 80px. Thumbnail size/gap are 80px/8px and radius 8px. Section padding is 96px top/bottom, mobile 64px top/bottom. Stock typography uses the existing heading font role at 18px; the bar is 5px high and its fill is actual inventory divided by the low-stock threshold, clamped at 100%. The reusable inventory snippet now supplies this percentage for every eligible inventory bar.

Variants retain the shared input and focus behavior, with local product composition sizing/spacing. Buy buttons retain their shared theme visual contract. Accelerated checkout is disabled at the user’s request; the static block and settings are preserved so it can be enabled again in Theme Editor. Add to cart remains available. Secure Payment is its own details Group, horizontal on desktop and stacked on mobile. The deferred component CSS bundle is regenerated using the existing build script.

## Verification

- PASS: Shopify development preview and fresh Theme Editor show the saved layout, 576px Details width, 96/64px padding, square gallery frame and separate 8px thumbnail gap. Fresh editor Save is disabled. The pre-existing unsaved-session restore prompt was left untouched.
- PASS: Desktop main image is 648 × 648px; gallery/details are aligned at the top. All five product media and active thumbnail remain resource-owned. No broken loaded images in the section.
- PASS: White Gate / M selected; $768/$808 and stock 12 retained; Add to cart enabled. Quantity increases from 1 to 2. Mobile thumbnail 2 activates the matching main slide and retains a square frame.
- PASS: Section and details have no horizontal overflow at 390, 767, 768, 1149, 1150 and 1920px. Mobile padding is 64px; tablet/desktop padding is 96px.
- PASS: Schema JSON parses and template block_order maps to existing children. Shared static block IDs remain absent from block_order. git diff --check passes. Shopify Theme Check reports zero errors, 104 advisory warnings in the full workspace scan (including non-shipping theme copies under output).
- NOT TESTED: cart submission, checkout transaction, exhaustive editor duplicate/remove/reorder and empty-resource cases. No JavaScript was changed.

## Visual limits

The existing theme font choices are retained, as previously agreed in docs/wofyn-design-system.md; Figma specifies Gabarito/Mulish. There are no real product reviews, so the storefront omits the five-star/24-review example. Payment icons follow the shop's six enabled methods. The stock bar is 60% for actual stock 12 / threshold 20. Source product images are rendered dynamically rather than replaced with flattened design art.

Proof: output/wofyn-featured-product/desktop.png and mobile.png. No commit, push or theme publication was performed; the user's existing development watcher remains running.
