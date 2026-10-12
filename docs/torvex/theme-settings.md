# Torvex theme settings

Source: https://www.figma.com/design/8TfMPHykNFpsWYR8o3drHE/?node-id=43001-11865
Branch: Torvex-template. Changes are local; no Shopify upload or Git push performed.

## Layout and typography

Page width 1680px and desktop margin 40px follow the user's explicit values. Tablet margin remains 30px; mobile margin remains 16px.

Shopify's official font library confirms Outfit handles outfit_n4 (Regular) and outfit_n5 (Medium). Body uses Regular; headings and accent use Medium. Body line height is 1.5, heading tracking is zero, accent tracking is 0.5px.

| Role | Desktop | Tablet | Mobile | Line height |
| --- | --- | --- | --- | --- |
| H1 | 50 | 44 | 30 | 1.2 |
| H2 | 30 | 32 | 26 | 1.2 |
| H3 | 26 | 24 | 22 | 1.3 |
| H4 | 18 | 18 | 18 | 1.4 |
| H5 | 16 | 16 | 16 | 1.5 |

H6 has no sample in the supplied style guide and retains its existing values. Heading capitalization follows the sample text's actual Figma styling. Body sizes 12/14/16/24px use the existing shared scale.

## Color schemes and buttons

| Scheme | Background | Heading | Text | Primary button | Secondary button |
| --- | --- | --- | --- | --- | --- |
| 1 | #ffffff | #181818 | #6d6d6d | #265cc9 / white | #f0f0f0 / #1e1e1e |
| 2 | #f5f5f5 | #181818 | #6d6d6d | #265cc9 / white | #e5e5e5 / #1e1e1e |
| 3 | #181818 | white | white | white / #1e1e1e | transparent / white outline |
| 4 | #ebf2ff | #181818 | #6d6d6d | #f89f20 / white | white / #1e1e1e |

Buttons use Outfit 16px/500, height 48px desktop / 44px mobile, horizontal padding 24px, radius 6px, 1px primary/secondary borders. Tertiary buttons have no underline. Pixel radius presets now apply to icon buttons too; legacy pill/rounded/square icon behavior is preserved.

Hover colors match supplied default colors because the style guide does not specify hover states. Scheme overlay is #5a5a5a at 50% for light schemes and white at 50% for the dark scheme.

Generated/100 (#e6e6e6), Generated/300 (#b3b3b3) and Generated/500 (#808080) are confirmed by the homepage variable definitions. Generated/200 (#cccccc) is confirmed by the resolved border. Two values remain provisional: Generated/50 is mapped to #f2f2f2 and Generated/600 to #666666 by interpolation of the neutral ramp. The image-only scheme table names these tokens without numeric values; the Figma variables inspection API requires a Full seat even for this read. Verify these two values when their numeric definitions become accessible.

## Validation

- JSON/schema constraints for changed settings: PASS.
- Existing saved presets preserved: PASS.
- Liquid rendering for layout, radius and accent tracking: PASS.
- Existing radius tests: 3 PASS.
- git diff --check: PASS.
- Shopify Theme Check: 0 errors, 40 warnings (same count as before this change).
- Live Theme Editor, font loading and storefront visual QA: NOT TESTED; no target Torvex theme was specified.


## Form and overlay rounding audit

Figma nodes inspected: header 47251:2370, footer desktop 47251:2696, footer mobile 47251:4289, input atom 34187:1932, textarea atom 34187:1936. Reference screenshots were reviewed together with high-fidelity design context.

- Inputs/selects and textarea: 6px radius. Form height 48px desktop/tablet and 44px mobile, shared horizontal padding 16px. Header search retains its design-specific 20px outer spacing.
- Footer newsletter: inherit the shared 6px input radius; solid #4d4d4d background as Figma, medium height preset (48/44px). Existing footer composition remains a Pawvera starting point; the desktop Subscribe/mobile icon-button composition has not yet been rebuilt for Torvex.
- Popup/modal/popover and account dialogs already consume the shared drawer radius. Retain the existing 8px numeric radius; no separate popup design was present in the supplied Torvex page, so this is a consistency choice, not a measured popup Figma value.
- Mobile drawers: removed duplicate forced-zero overrides from critical.css and component-overlay.css. The inner edge uses 8px; the screen-attached edge remains square when the global mobile inset option is off.
- Bottom sheets: two top corners 8px, bottom corners square.
- Mobile collection filter drawer: uses the same edge-radius contract, mirrored for its left position.
- Header-attached search overlay: bottom corners use drawer radius; attached top corners remain square.
- Cart quantity outer shell: shared input radius. Its inner number field remains square so the segmented control has a single outline.
- Article comments: input and textarea follow shared radii, border and horizontal spacing; input height now follows the desktop/mobile settings.

Validation: 28 radius/overlay controller tests PASS; schema constraints PASS; git diff --check PASS; Theme Check 0 errors / 40 warnings. Browser checks use a local CSS fixture with the current compiled Liquid tokens and actual repository styles, not a deployed Shopify store. Verified computed radii at 375, 767, 768, 1149 and 1150px: input 6px, popup 8px, mobile inner drawer corners 8px, bottom sheet top corners 8px. Input height changes from 44px to 48px at 768px. Live Theme Editor and complete storefront visual QA remain NOT TESTED. The temporary browser tab and local QA server were closed.
