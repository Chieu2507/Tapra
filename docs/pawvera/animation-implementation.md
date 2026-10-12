# Pawvera animation implementation

Implemented on `Pawvera-template`, 2026-10-12. Supersedes the earlier motion proposal in `animation-audit.md`.

## Entrance concept

- Shared easing remains `cubic-bezier(.22,1,.36,1)`. Entrance duration is at least 700ms, with 32px travel for slide effects.
- Headers lead the content. Heading, description and CTA use ordered delays; an animated Group owns its children to avoid nested transforms.
- Product, collection and blog cards use fade + slide-up with 75ms staggering within a layout row. Each later row starts its own sequence. Explicit merchant delay remains an additive offset.
- Blog heading starts at 0ms; the three desktop cards start at 150/225/300ms. On mobile, stacked cards reveal separately as they enter the viewport.
- Hero media enters from left/right at 0/100ms and remains opaque throughout. Eyebrow, heading and CTA start at 100/200/350ms. Image cards now expose an editable Delay setting.
- Countdown heading/copy/timer/CTA use 0/100/200/300ms. Featured-product summary/purchase/payment groups use 0/200/300ms.
- Testimonials use opacity-only entrances, leaving carousel transforms untouched. Marquees and hotspot interactions retain their existing motion.

## Runtime fixes

- Added the actual blog-list container to card staggering.
- Removed the 150ms minimum that collapsed different merchant delays into the same timing.
- Measure stable layout wrappers instead of animated card transforms when grouping rows.
- Recompute staggering after responsive resize without replaying visible cards.
- Tab deactivation cancels and rearms its own content; activation recomputes geometry and reveals it.
- Animation None, animated-parent ownership, Theme Editor selection and reduced-motion handling remain supported.

## Validation

- 34 automated tests passed across block lifecycle, card animation, component stylesheet and slideshow image fixtures. Includes distinct zero/75ms delays, blog header/card order, merchant offsets, mobile rows, hero opacity, fade transform ownership, tab replay, changing settings and reduced-motion preference changes.
- JavaScript syntax and `git diff --check` passed. Shopify Theme Check: zero errors.
- Real preview checked at 1440px and 375px. New/Sale switching plays staggered card entrances; mobile has no horizontal document overflow. Blog cards resolve to 150/225/300ms on desktop and separate 150ms row starts on mobile. Browser console: no errors observed.
- Theme Editor opened successfully: hero image-card Type = Slide from right and Delay = 100ms. No editor save was needed for this read-only check. Dynamic setting changes are covered by lifecycle fixtures; an OS-level reduced-motion toggle was not changed.
- Final hero screenshot: `output/pawvera/catalog-audit/animation-hero-final.png`.
