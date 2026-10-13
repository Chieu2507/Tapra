# Mobile drawer audit — 2026-10-13

Global control: Theme settings → Overlay and layering → Mobile width
(`overlay_drawer_width_mobile`). Auto is the default floating geometry; Full
fills the mobile screen. Shared geometry comes from `css-variables.liquid` and
is consumed by Cart, Search, mobile menus and generic/collection drawers.
Bottom sheets keep their existing layout.

Final configuration (2026-10-14): Header Compact, Cart presentation Drawer,
mobile width Auto. Classic Search was restored to its original full-width,
content-height surface below the header; only Compact Search follows drawer
geometry. Search input backgrounds resolve in their local scheme so the icon
and placeholder remain visible.

Mobile corrections:

- Search measures the shell's actual inner width and available height. Removed
  the competing viewport-width cap that caused unequal margins in Full mode.
- Mobile drill-down panels remain absolute and slide horizontally for 300ms.
  Desktop panel resets/reveal animations are scoped to desktop. Layout is flushed
  before activating a newly opened details panel so the initial slide is visible.
- Removed phantom parent-row borders, normalized nested links to 44px rows and
  made the Compact menu surface fill its scroll area.
- The inert travelling Cart header strips `data-header-root`, which previously
  defeated the mobile account-hide selector. The cart visual now hides the
  account explicitly on mobile throughout opening and closing.

Observed in the actual localhost browser with clicks and screenshots:

- 390×844 Auto: menu/cart/search shell at x12, y16, 366×680, radius26.
- 390×844 Full: menu/cart/search shell fills 390×844, radius0.
- Search input margins are 17px on both sides in Full390 and Auto320/390/414;
  Auto320/414 have no horizontal page overflow.
- Shop and Keyboards drill-down opens with horizontal motion; Back uses the
  same 300ms transition. Keyboards has five 44px rows and no empty separators.
- Direct cart opening and menu→cart handoff hide the travelling account icon.
  Auto menu handoff captures the current 680px origin height.
- Temporary Full settings data was removed after QA; default Auto restored.

Validation: 46 related controller/motion/cart/account tests pass. Theme Check
reports zero errors (45 warning offenses); search JavaScript syntax and
`git diff --check` pass. Two existing theme-settings tests fail identically in
HEAD: legacy color-scheme output and obsolete footer block structure.

Not tested: Theme Editor save/reload UI, all generic drawer feature screens,
physical iOS safe-area/keyboard behavior or Shopify-hosted account UI.

Screenshots are in `output/header-motion-audit/`, including
`cart-mobile-no-account.jpg`, `search-full-centered.jpg`,
`search-auto-centered.jpg`, `submenu-shop-fixed.jpg` and
`submenu-keyboards-fixed.jpg`.

## Mobile header actions — option 2 preview

Search and Account stay visible while the Compact mobile menu is open, including
Shop and Keyboards drill-down. The action row sits above the submenu header;
the Back region reserves room for four 44px controls and truncates long labels.
Previously the submenu header covered the Cart hit target.

Menu → Search retains the shell and fades outgoing menu content for 200ms.
Nested details remain rendered during handoff. Search stays in charge of the
header close toggle after the outgoing menu finishes closing.
Menu → Account opens Shopify's native sheet over the current menu; closing it
returns to the same menu. Header Account remains displayed for its native open
lifecycle. Cross-surface Search close suppresses focus return so it cannot steal
focus from Account and dismiss the new sheet.

Runtime QA: Auto390 Cart clicks work from levels 2 and 3; Full390 level3 Cart
captures the 844px menu origin. Auto320 Back and Search rectangles do not overlap
and page width does not overflow. Menu → Search, Menu → Account, Account close
back to Menu, and Search → Account were clicked in the actual local browser.
Twelve related tests, JavaScript syntax and Theme Check pass (zero errors).
Temporary Full configuration was removed after QA. No login was submitted.

## Submenu handoff correction

The cart visual copy previously lost the active drawer ancestor and forced every
primary summary visible. Level3 → Cart briefly showed Shop/Collections/Sign in.
The snapshot now retains the active drill-down context, freezes each node's
rendered visibility/opacity/transform, and retains the current surface dimensions.
The container fade remains CSS-owned; closing restores the travelling pill logo.
Search retains the mobile flex layout and header padding during handoff. Logo
returns with a delayed fade instead of remaining hidden until menu cleanup.

Observed Auto390: reproduced the wrong primary rows before correction. Level3
Cart retains a 614px menu surface; parent summary visibility stays frozen. Logo
is visible on closing. Level2 and Level3 Search retain the same surface bounds
(x13, y81, 364×614) and keep parent navigation hidden. Forty-seven related tests
pass, including a regression preserving an intermediate submenu translateX.
Theme Check has zero errors; JS syntax and diff whitespace pass.

## Final mobile account policy

At the user's request, the header Account icon is hidden in every mobile state,
including Menu, submenu, Search and the travelling Cart visual. The earlier
option2 preview is superseded for Account; Search remains available in Menu.
The menu footer Sign in button remains the mobile login entry. Back reserves
space for three controls instead of four. Checked actual localhost menu and
search screenshots; desktop account styles are unchanged.
