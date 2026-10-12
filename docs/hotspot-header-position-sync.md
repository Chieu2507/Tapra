# Hotspot Gallery Header position sync

2026-10-12. Scope: propagate only Header position to the other template remote branches, origin/main and theme-base/dev. The active Pawvera checkout and its uncommitted work remain untouched. No Shopify publish or theme upload was performed.

| Remote branch | Commit | Theme Check errors | Warnings |
| --- | --- | --- | --- |
| origin/Fluxstep-template | d57ee9a3 | 0 | 40 |
| origin/Peeko-template | afd4a1fc | 0 | 38 |
| origin/Perky-template | 16dff7b1 | 0 | 50 |
| origin/Strideo-template | ce41d1b9 | 0 | 41 |
| origin/Wofyn-template | 886b457f | 0 | 39 |
| origin/stroken-theme | c3519c4f | 0 | 40 |
| origin/main | 5ea51922 | 0 | 36 |
| theme-base/dev | 4eec049e | 0 | 7 |

Each commit changes only sections/hotspot-gallery.liquid. Header position uses the same merchant label as Featured collection banner, with Above section / Beside images choices. Blank or invalid data preserves Beside images; the current templates are not rewritten. Above uses a single grid column and disables sticky positioning for that header. One existing Header static ID, product callout, resources, mobile stacking and background/spacing contracts are preserved. theme-base/dev retains section-content-scope and the section-content-slot renderer. The literal label/options follow the current Featured collection banner schema as the documented peer exception.

PASS: schema/default/option consistency, single Header, Liquid rendering of both choices and missing/invalid fallback on all8 branches; git diff --check on each; full Theme Check on each; successful normal fast-forward push (atomic for the7 origin branches). New checks introduced no error. Per-branch storefront/Theme Editor QA NOT TESTED; the equivalent setting was previously checked in Pawvera. Existing active worktrees were not reset or fast-forwarded because they belong to ongoing work. Their remote tracking refs now include the fix.
