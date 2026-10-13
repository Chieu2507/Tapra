# Tapra footer implementation

Reference: `/Users/chieutrinh/Downloads/Tapra_demo3_shatter-hero.html` and the supplied footer screenshot.

- Dedicated footer-group-only section, using existing Group, Heading, Text, Menu, menu-link and Shopify customer email-signup blocks. The old generic footer section remains available.
- Five fixed static slots: `brand`, `explore`, `newsletter`, `wordmark`, `credits`. No section-level dynamic Add block menu. Group slots intentionally retain the existing generic composition block catalogue; Explore retains the existing menu-link catalogue. Static slots are absent from `block_order`; hiding a slot removes its content, and remaining grid slots retain their layout positions.
- Merchant content, menu destinations, field copy, button, consent and credits are saved block data. Section controls cover width, background glow, scroll effect, scheme and padding. The Wordmark block owns text, text scale, font weight and gradient. Existing controls reuse canonical translation keys. Bespoke Tapra section/control labels are intentionally English literals, consistent with other custom section schemas.
- Scheme/background is applied to the Shopify wrapper; mobile padding inherits desktop unless its customization toggle is on, including zero values. Static content slots reuse documented blocks. One dedicated Wordmark Theme Block owns decorative typography; no additional nesting layers.
- Navy glow and gradient lettering reproduce the reference. Wordmark is decorative and hidden from assistive technology. Input and button use the shared email-signup and button foundations, including Shopify success/error states.
- Scroll reveal uses passive events and coalesced animation frames. Wordmark translates/fades with visible progress. Tall footers cap the reveal distance at viewport height so the animation finishes. Keyboard focus exposes the content; reduced motion disables transforms. Editor previews animate normally, pausing while a footer block is selected. Reload is idempotent; unload removes listeners, observers and pending animation frames.

Validation:

- PASS: `git diff --check`, `node --check assets/tapra-footer.js`.
- PASS: `shopify theme check --path .`: no errors, 44 warnings in existing files; no Tapra-footer findings.
- PASS: `node --test tests/tapra-footer-motion.test.cjs tests/footer-controls.test.cjs`: five tests.
- PASS: local Liquid render and Chrome layout at 390, 767, 768, 1149, 1150 and 1920px; no horizontal overflow, one email field, all five Explore links.
- PASS: Chrome checks for hidden/partial/full scroll progress, reduced motion, editor mode, keyboard focus, section unload and reinitialization.
- NOT TESTED: authenticated Shopify storefront/Theme Editor interactions and real newsletter submission. Local render simulates Shopify forms and theme font/token values, so it is not a live-store visual verification.
- NOT TESTED: existence of store pages `/pages/lookbook` and `/pages/faq`; destinations remain editable through the Explore block.
- No preview watcher was started, and no remote theme was uploaded or published.

Overall: PASS WITH FOLLOW-UPS for live Shopify validation.
