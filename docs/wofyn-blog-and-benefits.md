# Wofyn Blog posts and final Icon with text

## Section Build Plan

- Role: editorial content (Blog posts), utility benefits (Icon with text).
- Placement: existing homepage Blog posts instance; new dynamic Icon text cards instance immediately afterward, before footer. Wofyn-template only.
- Context: retain Perky blog temporarily, as requested; benefits use editable text and Figma SVG icons.
- Ownership: section controls grid/container/scheme/padding; Blog list supplies article context; existing Blog card and Group/Icon/Heading/Text blocks own their content. Theme Settings retain fonts and tokens.
- Slots: existing static Blog header/list/card; remove Read more child. Benefits: three editable Groups, each containing a horizontal Group with Icon and text Group.
- Output/runtime: reuse blog-posts and icon-text-cards kernels, no new markup, JavaScript or Custom CSS.
- Responsive: Blog three columns desktop, one stacked column mobile; benefits three columns desktop/tablet, one mobile, centered desktop and left aligned mobile through outer Group alignment.
- QA: schema values/capacity, Theme Check, editor selection/reload, desktop/mobile storefront dimensions and overflow.

## Design mapping

Figma G7y5fdxzoVS9pDqslTl1Pp: Blog 47155:13622 / 47557:6269; benefits 47302:8210 / 47557:6297.
Blog heading, 4:3 media, 16px radius, 28px desktop / 32px mobile grid gaps, 20px media/content spacing, 8px title/excerpt gap, small title/body tokens; bottom padding 96px desktop / 64px mobile. Benefits scheme-4, 40px top/bottom, 32px gap, 24px SVG, icon/text gap16 and text gap6.
User authorized adding Badge position to Meta. Wofyn selects bottom-left; existing instances keep top-left. Both use the native 16px inset and 6px/16px padding; Figma uses 12px and 4px/10px. Retain medium date format rather than extending unrelated badge styling controls. Existing fonts retained per user preference.

## QA

PASS: git diff --check. Theme Check: 477 files, 0 errors, 104 existing warnings. Exact changed section settings validated against schema select/range constraints; 18 active sections. No Custom CSS added.
PASS: targeted upload to Wofyn template (Chieutt), theme 192149684523. Local dev watcher restarted on 9294 (session 57754), with Meta/locales added to the existing watch list.
PASS: storefront at 1280px and 375px. Three desktop Blog cards; mobile media 343×257.25 (4:3), radius16, no horizontal overflow. Benefits desktop 3 columns, mobile 1 column, height306px, 24px icons, gap32, padding40, background rgb(250,241,236).
PASS: Theme Editor loads Blog posts and Services; Meta selected, Badge position switched Top left then Bottom left, both live re-renders visually verified. Restored saved bottom-left state (Save disabled). Existing default remains top-left.
NOT TESTED: full add/duplicate/reorder/remove lifecycle, Auto ratio, horizontal/nested Meta compositions and all breakpoint boundary widths. No interaction/JS added.
Proof: /tmp/wofyn-blog-editor.png and /tmp/wofyn-blog-services-mobile.png. Viewport override reset. Git commit/push not performed.

## Blog post UI update — 2026-10-12

Reference: Figma `47317:14798`. Current `Pawvera-template` branch, existing `peekoo_blog_posts`, development theme `192069828907`. Keeps Wofyn blog, three actual articles and existing WebP images, title/excerpt content and article links. No article records or images were changed.

- Desktop/tablet padding becomes 96px top/bottom; mobile 64px. Existing three-column desktop / one-column mobile grid, 28px desktop / 32px mobile gaps, 4:3 media and 16px radius retained. Header/card gap remains 40px desktop / 36px mobile.
- Shared Meta gains opt-in Compact badge style: 12px image inset, 4px/10px surface padding, bold uppercase copy. Standard preserves the previous 16px inset, 6px/16px padding and typography. The new day/month/year date option keeps the semantic ISO time value and renders the native published date as 29 OCT 2025 in this composition.
- Fixed saved-zero spacing: Description's 0px bottom padding now overrides its 6px CSS fallback. Title's mobile CSS fallback matches desktop 0px when the saved top padding is zero; existing nonzero settings continue to emit their values.
- Section wrapper now applies the selected color-scheme background, including outer margins. No new block file, JavaScript or custom stylesheet. New Meta labels follow its existing literal-label convention.

QA:
- PASS: Desktop at 1920px renders three 448×336px images, 12px left/bottom badge inset, 4px/10px badge padding, heading/title/body roles and 20px image/content spacing. All three images load and the selected article URLs remain correct.
- PASS: No section horizontal overflow at 390, 767, 768, 1149, 1150 and 1920px. Mobile is one stacked column. Zero Title/Description padding verified at every tested band.
- PASS: Five Meta rendering tests, including opt-in Compact behavior, semantic dates, existing Standard/content compatibility and editor attribute identity. git diff --check and schema parsing pass.
- Development synchronization: explicitly uploaded only Meta, Blog posts and current index.json to theme 192069828907 after the watcher initially left the Compact field unapplied. The existing watcher subsequently synchronized the Title/Description spacing fixes. No publication or Git push.
- Retained theme typography (Nunito). Header's saved maximums remain the closest existing supported 770px desktop / 440px mobile to the design caps. Article/excerpt context and existing empty-state behavior retained.

Proof: output/wofyn-blog-posts/desktop.png and mobile.png. The existing requested development watcher remains running.
- PASS: Fresh Theme Editor exposes Compact/Standard badge styles, Bottom left position and selected 01 Dec 2000 date format; saved section padding is 96/64px and Save is disabled.
- PASS: Final Theme Check zero errors. Only peekoo_blog_posts changed in index.json; section order retained.
- NOT TESTED: exhaustive editor duplicate/remove/reorder lifecycle. Article URLs were verified, but the subsequent browser navigation check timed out; no navigation-runtime changes were made. The in-app browser also timed out on viewport cleanup; its unmarked temporary QA tab is left for automatic turn cleanup.
