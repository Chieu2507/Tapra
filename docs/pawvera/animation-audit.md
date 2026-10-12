# Pawvera animation audit — 12 October 2026

Scope: all 14 active homepage sections, their configured blocks, product/collection/blog/review cards, hover zoom, carousel/tab lifecycle and hotspot popovers. This is an audit and proposal; the shared motion runtime has not been retuned.

## Current behavior

- Global block animation and image zoom are enabled. Hero media, headline and CTA explicitly use None, which keeps the first screen immediate.
- Product, collection and blog cards use slide-bottom (opacity + translateY 24px). Shop Deals cards use scale (.94 → 1). Testimonials default to fade. Most compound headers/groups have no entrance.
- The shared block runtime prevents nested parent/child entrances and resets tab scopes when deactivated. Reduced motion cancels running entrances and releases pending visibility; keyboard focus reveals a pending target.
- Shared runtime entrances last at least 650ms despite the slow CSS token being 420ms. Auto card staggering currently uses 140ms, from 180ms to 600ms. Inline products request 75ms intervals, but the runtime's minimum 150ms delay collapses the first three requested delays (0/75/150) to 150ms. These two card families do not currently share one timing contract.
- `data-component-reveal="fade-up"` is a hook; the runtime reads `data-block-animation` for the effect and otherwise falls back to slide-bottom. The attribute name should not be mistaken for a distinct implemented effect.
- Hotspot rings pulse every 2.4s; popovers use the shared standard token (280ms). Their reduced-motion CSS disables rings and motion.
- Brand and text marquees use their own continuous movement. No additional entrance should be stacked onto their tracks.

## Proposed single concept: quiet, friendly motion

Historical proposal: the subsequent user request for stronger, synchronized entrances was implemented in [animation-implementation.md](animation-implementation.md), including hero motion and revised timing.

| Area | Proposed motion | Reason |
| --- | --- | --- |
| Hero | None | Immediate first-screen content; avoid delaying the main image/headline. |
| Brand row | Existing continuous marquee; no reveal | Preserve the row's steady movement. |
| Featured Products tabs, toys carousel, collection cards, inline products | A: fade + slide-up 16–24px | One consistent commerce-card entrance; stagger 75ms per visible row and replay only on tab activation. |
| Section headers, countdown copy, featured-product details, blog header | A: fade + short slide-up | Introduce content as a group; children use None to avoid double animation. Product controls stay immediately usable. |
| Product banner photo, Shop Deals images, hotspot photos | B: subtle scale .98 → 1 + fade | A softer emphasis for editorial photography; animate the whole image group once. |
| Testimonial cards | Fade only | Prioritize reading; avoid moving long quotes or avatars independently. |
| Product/collection/blog image hover | Scale to 1.02–1.03 on hover-capable devices | Restrained interactive feedback; no hover zoom on touch or reduced motion. |
| Hotspot dots/popovers | Keep pulse and short fade/scale; pause pulse while open | Preserve interaction feedback without another scroll entrance on each dot. |
| Navy/shipping marquees | Existing continuous motion; pause/reduced-motion behavior | Keep them separate from A/B entrances. |

Suggested contract: A/B 420–500ms with one standard easing; 75ms card stagger; no long initial delay. Keep Swiper-owned wrapper/slide transforms under the carousel controller, and reveal an inner card wrapper. Rotate-words and large side slides are unnecessary for this homepage. Implementing this proposal requires changing shared runtime timing, so it should be a separate scoped change rather than silently altering every template during the Pawvera catalog audit.

Validation: 20 relevant lifecycle/card/spacing/testimonial tests pass. Real browser tab switching was checked at 375px; New and Sale expose real collection products. Runtime reduced-motion behavior is covered by the existing automated fixtures; no OS-level reduced-motion toggle was changed.
