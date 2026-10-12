# Pawvera homepage section mapping

Ordering-only pass against Figma Desktop 47306:8476, file G7y5fdxzoVS9pDqslTl1Pp. Matching means reusable section role, not finished visual fidelity. Header/footer are section groups outside index. Section contents/settings/resources preserved; no component code changed in this pass.

| Design order | Design role | Index instance | Figma node | State |
| --- | --- | --- | --- | --- |
| 1 | Hero banner | pawvera_hero | 47302:8426 | Existing Image cards (three columns) |
| 2 | Logo list | perky_logos | 47306:8677 | Reuse existing logo marquee; artwork/layout pending |
| 3 | Featured collection with tabs | peekoo_featured_07 | 47309:8702 | Reuse product collection; tabs/layout pending |
| 4 | Countdown timer | countdown_timer | 47309:8843 | Existing split banner with countdown |
| 5 | Collection list | perky_age_collections | 47309:9001 | Existing Collection list |
| 6 | Featured collection with image + product list | wofyn_kibble_banner | 47309:8867 | Existing Featured collection banner; list/layout pending |
| 7 | Collection list / two image cards | peekoo_image_cards | 47317:14668 | Existing Image cards; collection bindings/copy pending |
| 8 | Featured collection carousel | pawvera_featured_collection | 47343:1527 | Implemented Toys carousel; see pawvera-featured-collection.md |
| 9 | Hotspot | pawvera_hotspot_grid | 47317:14622 | Implemented with extended Hotspot Gallery |
| 10 | Scrolling text | scrolling_text | 47309:9053 | Existing marquee |
| 11 | Featured product | peekoo_featured_product | 47309:9074 | Existing Featured product |
| 12 | Testimonials | perky_testimonials | 47317:14767 | Existing Testimonials cards; layout pending |
| 13 | Blog post | peekoo_blog_posts | 47317:14798 | Existing Blog posts |
| 14 | Scrolling text | pawvera_footer_marquee | 47317:14834 | Copied existing marquee before footer |

Hidden existing instances (preserved, disabled, placed after active instances): `peekoo_icon_text`, `wofyn_rich_text`, `wofyn_promo_grid`, `wofyn_image_with_text`, `wofyn_toys_banner`, `wofyn_gallery`, `wofyn_services`.

New duplicate instances retain their source content/resources as temporary values; no Pawvera-specific copy or resource was invented. Hotspot grid now sits between the second standard product carousel and the first scrolling text.

Validation: PASS JSON section limit (20 total, 13 active, 7 hidden); PASS unchanged original section settings/content/resources; PASS git diff --check; Theme Check 0 errors; PASS live storefront DOM matches all 13 active instances in order and excludes hidden instances. Theme Editor lifecycle not re-tested in this ordering-only pass.
