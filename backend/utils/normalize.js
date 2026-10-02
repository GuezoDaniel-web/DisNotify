/* ============================================================
   DisNotify — utils/normalize.js
   Pure functions, no I/O. The easiest place in the codebase to write
   real unit tests — do it, because services/matching.js is only as
   good as these.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   slugify(name)              'RTX 4070 SUPER 12GB' -> 'rtx-4070-super-12gb'
                              Used to generate products.id.

   normalizeBrand(s)          'GIGABYTE TECHNOLOGY' -> 'Gigabyte'
                              Keep an explicit alias map; fuzzy-matching
                              brands invents new ones forever.

   normalizeCategory(raw)     Map each retailer's category strings onto
                              YOUR list in frontend/js/config.js.
                              'Video Cards & Video Devices' -> 'gpu'

   extractSpecs(title, cat)   Pull structured facts out of a title:
                              '...12GB GDDR6X...' -> { vram: '12GB GDDR6X' }
                              Per-category regexes. These become the
                              tie-breakers in matching.js.

   toCents(n) / fromCents(n)  Do arithmetic in integer cents. Floating
                              point money is how you end up alerting at
                              R13 998,9899999999. Most SA hardware
                              prices are whole rands, but PSUs,
                              peripherals and games are not -- so do
                              not assume integers and skip this.

   sameProduct(a, b)          Cheap pre-filter before the expensive
                              similarity check.
   ============================================================ */
throw new Error('utils/normalize.js is a scaffold.');
