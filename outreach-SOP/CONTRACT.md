> Old technical notes for Sean, out of date since 2026-09-20. Designers: open START HERE.md instead.

# Outreach Thumbnail Factory: shared contract

Goal: turn the hand-built Canva "YOUR 3-DAY EVENT" outreach thumbnail (see `reference/lindy-finished.webp`,
blank layout in `reference/template-blank.webp`) plus the page-2 revenue calculator (`reference/calculator-sheet.png`)
into a batch pipeline: 20 leads = one command, zero AI screenshotting, zero Canva placement.

Runtime: macOS, `python3` = 3.9 (no `match`, no `X | None` annotations evaluated at runtime), stdlib + `playwright`
(sync API, chromium installed) + `PIL`. `openpyxl` may be installed with `python3 -m pip install --user openpyxl`.
No other third-party deps unless optional and guarded by try/except with a clear message.
All scripts run from the factory root: `python3 scripts/<name>.py [slug ...]` (no slugs = every row in leads.csv).
Every script is idempotent, skips work whose output exists unless `--force`, and prints one status line per lead.

## Folder layout

```
leads.csv                 lead facts + look (one row per lead)
pitch.csv                 calculator inputs per lead (pasted from the pitch-number prompt output)
leads/<slug>/in/          HUMAN inputs (always win over auto/)
leads/<slug>/auto/        SCRIPT outputs
assets/                   constants (host.png = circle face top-right, fonts, textures)
template/thumbnail.html   the compositor page
scripts/                  capture.py, figma_export.py, calc.py, avatars.py, render.py, run_all.py
prompts/                  pitch-number.md (pricing SOP prompt), avatar-prompts.md
out/                      <slug>-thumb.png, <slug>-calculator.png, index.html (contact sheet)
reference/                screenshots of the current hand-made versions
```

Asset resolution order for every slot: `in/<name>.*` > `auto/<name>.*` > placeholder (dashed box labelled
`MISSING: <name>`). Image extensions accepted: png, jpg, jpeg, webp.

| slot | in/ (human) | auto/ (script) | producer |
|---|---|---|---|
| hero photo (center portrait, also blurred as background) | photo.* | photo.* (best candidate) | capture.py |
| scene background (blurred behind everything; their filming room) | background.* | background.jpg (latest YouTube thumbnail) or falls back to photo | capture.py |
| webcam inset face on the slide | face.* | falls back to photo with top crop | - |
| current-launch collage (1-4 shots) | launch-1..4.* | launch-1..4.png | capture.py |
| Day 1 slide | slide.* | resolved by slug, see below | Day 1 slide factory |
| landing page (right side) | lp.* | lp.png | figma_export.py or manual Figma export |
| avatar, "before/struggle" pose | avatar-before.* | avatar-before.png (transparent) | avatars.py |
| avatar, "after/win" pose | avatar-after.* | avatar-after.png (transparent) | avatars.py |
| brand tokens | - | brand.json | capture.py |
| calculator | - | calc.json, calculator.png, calculator.xlsx | calc.py |
| per-lead layout nudges | tweaks.json | - | human |

**Human drop folders (designer-friendly, any filename works):** `in/1 headshot/` (photo), `in/2 room background/`
(background), `in/3 avatar before/`, `in/4 avatar after/`, `in/5 current launch screenshots/` (all images, sorted by name),
`in/6 landing page full/` (lp, full-length; the pipeline cuts it into the two halves). A subfolder beats a flat
`in/<name>.*` file. Fixed template elements live in `assets/fixed elements/<n name>/` plus
`assets/fixed elements/fonts - type the font names here.txt`. Low-res crops taken from the reference screenshots
are in `reference/` as fallbacks only.

Slide resolution when no `in/slide.*`: first existing of
`~/Documents/Day 1 Slides/outputs/<slug>-day1.png`, `~/Documents/Outreach Slides/outputs/<slug>-day1.png`,
`~/Documents/outputs/<slug>-day1-title.png`, `~/Documents/outputs/<slug>-day1.png`.

## leads.csv columns

`slug,name,website,launch_urls,youtube,niche_props,banner_hex,accent_hex,label_hex,currency,figma_frame`

- `launch_urls`: space-separated URLs of their CURRENT launch / sales / offer pages (the top-left "current launch" collage).
- `youtube`: optional channel URL; capture pulls the latest video's maxres thumbnail as a photo/background candidate.
- `niche_props`: short phrase for avatar props, e.g. `freelance writer: notebooks, laptop, magazine pages`.
- `banner_hex` (dark brand color for the "YOUR 3-DAY EVENT" brush banner), `accent_hex` (warm highlight for the
  price + underline scribble), `label_hex` (bg of the "here's how we'll do it:" label). Blank = derive from brand.json.
- `currency`: `$` default. One currency per lead, used everywhere (headline, calculator, VIP price). Never mix A$ and $.
- `figma_frame`: optional Figma frame name for figma_export.py (default: the slug).

## pitch.csv columns (rates are percent numbers: 18 means 18%; calc.py also accepts 0.18 and "18%")

`slug,offer_name,offer_type,list_size,reg_rate,show_rate,buyer_rate,vip_rate,offer_price,vip_price,pp_factor,floor_total,pitch_total,target_override,confidence,notes`

- The 8 calculator input cells: list_size, reg_rate, show_rate, buyer_rate, vip_rate, offer_price, vip_price, pp_factor.
- `offer_type`: existing / modified / PROPOSED NEW.
- `floor_total` / `pitch_total`: what the prompt computed (reference only; calc.py recomputes, it never trusts these).
- `target_override`: Sean's own guess. If set, calc.py SOLVES the four rate levers so the real formula lands on it.

## The calculator formula (must match the Google Sheet exactly; head counts rounded to whole people)

```
registrants    = ROUND(list_size * reg_rate)
vip_upgrades   = ROUND(registrants * vip_rate)
vip_revenue    = vip_upgrades * vip_price
attendees      = ROUND(registrants * show_rate)
buyers         = ROUND(attendees * buyer_rate)
course_revenue = buyers * offer_price * pp_factor
total          = vip_revenue + course_revenue
headline       = "+" + currency + round(total / 1000) + "K"     e.g. +$141K
```
Acceptance test: 10000, 18%, 40%, 5%, 10%, 4000, 47, 92% gives 1800 / 180 / 8460 / 720 / 36 / 132480 / 140940 / "+$141K".
The thumbnail headline ALWAYS comes from this formula output, never typed by hand.

## Benchmark bands (pitch case = upper half of band, never above cap). Shared by calc.py solver AND pitch prompt.

| lever | floor (median) | pitch cap | solver step |
|---|---|---|---|
| reg_rate (list+social reach to registrant) | 10% | 25% | 1% |
| show_rate (registrant to live attendee, 3-day event) | 30% | 45% | 1% |
| vip_rate (registrant buys VIP at registration) | 5% | 15% | 1% |
| buyer_rate, offer <= 500 | 5% | 15% | 0.5% |
| buyer_rate, offer 501-2000 | 3% | 10% | 0.5% |
| buyer_rate, offer 2001-5000 | 2% | 7% | 0.5% |
| buyer_rate, offer > 5000 | 1% | 4% | 0.5% |
| pp_factor | 0.92 | 1.00 | fixed, not a solver lever |

Solver: never touches list_size, offer_price, vip_price, pp_factor (those are facts / the offer). Searches the rate grid
from the given rates up to the caps, picks the combination whose total is closest to target (prefer landing within
+-2%, then prefer spreading "stretch" evenly across levers over maxing one lever). If the target is unreachable at caps,
it does NOT exceed caps: it reports `UNREACHABLE, max defensible = X` and uses the max-cap combination.

## calc.json (leads/<slug>/auto/calc.json)
```json
{"slug":"...","offer_name":"...","currency":"$",
 "inputs":{"list_size":10000,"reg_rate":0.18,"show_rate":0.40,"buyer_rate":0.05,"vip_rate":0.10,"offer_price":4000,"vip_price":47,"pp_factor":0.92},
 "outputs":{"registrants":1800,"vip_upgrades":180,"vip_revenue":8460,"attendees":720,"buyers":36,"course_revenue":132480,"total":140940},
 "headline":"+$141K","headline_number":141000,"mode":"as-given|solved","target":null,"reachable":true,
 "flags":["buyer_rate 5% within band 2-7% for $4000 offer"]}
```

## Compositor data (render.py builds this and injects it as window.LEAD before the page loads)
```json
{"slug":"...","name":"...","headline":"+$141K",
 "colors":{"banner":"#1f2a8a","accent":"#f3c96b","label":"#8595a8"},
 "images":{"photo":"file:///...","background":"file:///...","face":"file:///...","slide":"file:///...","lp":"file:///...",
           "launch":["file:///..."],"avatar_before":"file:///...","avatar_after":"file:///...","host":"file:///..."},
 "missing":["avatar_before"],"tweaks":{}}
```
Stage is 1920x1080, exported at device_scale_factor 2 (3840x2160) like the Day 1 slides.

## Demo leads (use these to test end to end)
- `lindy-alexander`: finished reference = `reference/lindy-finished.webp`; calculator = the acceptance test above.
- `nicolas-gorrono`: blank-layout reference = `reference/template-blank.webp` (headline there was +$102K).
- Demo `in/lp.png` files are CROPPED FROM THE REFERENCE and already tilted, so demo `in/tweaks.json` sets `{"lp_rotate":0}`.
  Real Figma exports are flat; the compositor applies the tilt.

## House rules
- No em dashes in anything that ends up on a thumbnail or in client-facing copy.
- No decorative sparkle/star/twinkle SVGs. The orange spark-lines near the win avatar ARE part of the reference, keep those.
- Fonts from Fontshare (`https://api.fontshare.com/v2/css?f[]=<slug>@<weights>&display=swap`), ONE <link> per family
  (multi-family links silently substitute). Verify faces by measuring width against fallback, not document.fonts.check().
- Verify layout with DOM rect math, not only screenshots.
