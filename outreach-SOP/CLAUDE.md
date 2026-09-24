# Outreach Thumbnail Factory: instructions for Claude

This folder turns one cold-outreach lead into the pictures and numbers for a Canva deck that opens a Loom video
("YOUR 3-DAY EVENT"). Per lead, Canva gets 6 pictures (p1 thumbnail, p2 slide, p2 landing 1, p2 landing 2, last
youtube) plus the revenue calculator text. Claude does the research and writing, a person adds a few real pictures
and approves the revenue number, and local scripts build everything else at 0 Claude tokens.

You are most likely working with the team's designer. She is not technical: keep messages plain, short and concrete,
tell her exactly what to click or drop where, and never ask her to edit JSON or run Python. Sean or Theia approve the
Day 1 headlines; whoever runs the batch approves each revenue number.

## Commands

| command | what it does |
|---|---|
| `/outreach-batch <names or slugs>` | the whole routine for a list of leads: status, research (one subagent per lead), one stop for the humans, build, Canva batch |
| `/outreach-lead <name or slug>` | every Claude-judgment step for ONE lead, ends with what the human must approve or drop in; safe to re-run |
| `/outreach-build <slug ...>` | runs the build scripts for ready leads, reviews, makes the Canva batch, gives open commands |
| `python3 scripts/status.py [slug ...] [--json]` | read-only checklist per lead with the next step (no slugs = every real lead) |
| `python3 scripts/doctor.py [--quick]` | read-only check that this Mac can run everything; prints the fix for each problem |
| `bash setup.sh [--check]` | one-time install (the human runs it; safe to run again) |

The skills hold the detailed procedure: `.claude/skills/outreach-lead/SKILL.md`, `.claude/skills/outreach-build/SKILL.md`,
`.claude/skills/outreach-batch/SKILL.md`. Follow them rather than improvising.

## Scripts and their exact argument forms (tested; the form matters)

Run every command from this folder. Folder names contain spaces: always quote paths.

| script | arguments | notes |
|---|---|---|
| `scripts/build_lp.py` | `leads/<slug>` (folder path only) `[--slide-slug SLUG]` | landing page; one failing lead stops a multi-lead call, so run one lead per call. A slide folder with only a PNG (a Canva slide, e.g. a sheet batch) works: faces come from the lead's site in brand.json, and with no video frame the headshot stands in on the iPhone |
| `scripts/build_thumb.py` | `leads/<slug> [leads/<slug2> ...]` (folder or lead.json path) `[--force] [--svg-only]` | page 1; a bare slug prints FAIL; `--selftest` is maintenance only |
| `scripts/build_page2.py` | `<slug> [...]` or `leads/<slug>` | page 2 pieces; `--selftest` and `--template` are maintenance only. A slide cropped from the designer's Canva thumbnail (PNG, no html) already has that thumbnail's webcam, so ours is off (lead.json `page2.webcam: true` adds it); with no video frame the webcam is a face crop of the headshot |
| `scripts/make_pointing.py` | `<slug> [...] [--force] [--parallel 4]` (bare slugs only) | pointing cutout via Codex, spends ChatGPT plan usage. Runs Codex at LOW reasoning (about 2-5 min per lead); the account default is xhigh, which took 5-16 min per lead |
| `scripts/build_youtube.py` | `<slug> [...] [--month "Sep 2026"]` (bare slugs only) | last page; needs the pitch.csv row and the pointing cutout |
| `scripts/make_canva_batch.py` | `<slug> [...] [--name <batch>] [--no-open]` (bare slugs only) | Canva batch folder, sheet on the clipboard, opens Finder |
| `scripts/capture.py` | `"<out folder>" "<url>[::css=..|::text=..|::y=..]" ... [--full] [--brand <json>] [--force] [--start N]` | screenshots at 2880x1800, 0 tokens |
| `scripts/build_site.py` | `<slug> [...]` (bare slugs) `[--base URL] [--reply ADDR] [--open]` | the hosted page: DELETES `site/<slug>/` and re-copies `leads/<slug>/lp/`, injects `window.SITE`, runs `make_favicon.py`, versions assets. 0 tokens, over 2 min here. Re-run it after every `build_lp`, or the page is the old landing page. It also rewrites `site/index.html` from only the slugs in that one call, so the last call of a session lists every lead you want browsable |
| `scripts/deploy_site.sh` | `"<commit message>"` | pushes `site/` to `seeeadd/2026-or-afterharvest`; Vercel publishes to `https://2026-or-afterharvest.vercel.app/<slug>/`. Takes about 2 min on this Mac |
| `scripts/check_page.py` | `<slug> [...]` (bare slugs) `[--widths 1440,390]` | measures a built hosted page: text clipped in a keep card, colliding column headers, sideways scroll, "Concept" leaking, missing favicon, cards all one kind, no thread between two cards, another lead's proper nouns on this page. Exits non-zero, so it can gate a build. 0 tokens, about 20 s |
| `scripts/build_vip.py` | `<slug> [...]` (bare slugs) | the VIP upsell hero at `site/<slug>/vip/` from `templates/lp/vip.*` + lp.json `site.vip`; needs the built hosted page, refuses a still that is the registration page's picture. `build_site.py` runs it at the end. About 1 s, 0 tokens. SOP section 19 |
| `scripts/make_favicon.py` | `<slug> [...]` (bare slugs) | the lead's emblem as favicon.png, favicon-32.png, apple-touch-icon.png. `build_site.py` calls it. **One picture in `leads/<slug>/favicon/` wins** and is used instead of the drawn emblem, squared on its centre and resized to all three (same rule as `logo/`) |
| `scripts/pick_screenshots.py` | `<links.json> <slug> [...]` (links.json = prompt 1 output, e.g. `out/_DELETES-screenshot-links/links.json`) | captures up to 7 ranked links, rejects walls, errors and near-empty pages, crops each to its content, keeps the top 3 distinct. Never pads a slot. 0 tokens |
| `scripts/launch_collage.py` | `<slug> [...] [--out DIR]` (bare slugs) | the 3 current-launch screenshots as one tilted, transparent cluster from layer L35 of master.svg. Refuses a lead with fewer than 3 shots. 0 tokens |
| `scripts/sheet_batch.py` | `[slug ...] [--rows <json>] [--thumbs <dir>] [--thumbmap <json>] [--out DIR] [--copy]` | Canva batch for a sheet batch: numbered by team-sheet row (044...), the designer's Canva thumbnails as p1, `images/` flat + `by lead/NNN Name/` with the complete landing page, `MISSING.txt`. Safe to re-run as pieces land. 0 tokens |
| `scripts/import_thumbs.py` | `"<folder of exported thumbnails>" [--dry]` | the designer's Canva thumbnails into a sheet batch: matches files to leads by name (typos and "(2)" copies forgiven, newest wins), re-crops the Day 1 slide only when it changed (never over a real html slide) and rebuilds that lead's landing page + page 2, reads every thumbnail's price with the Mac's text recognition (`scripts/ocr_text.swift`) and lists the ones that differ from the sheet, then runs sheet_batch. 0 tokens, about 10 s plus rebuilds |
| `scripts/brand_from_lp.py` | `<slug> [...] [--force]` | lead.json colors.banner from the built landing page, for leads whose thumbnail was made in Canva (else every YouTube board is the template navy) |
| `scripts/frame_candidates.py` | `<slug> [--channel URL] [--videos 12]`, then `<slug> --shortlist A B C` (A B C are candidate numbers from the contact sheet), then `<slug> --use N` (N is 1, 2 or 3, the position in shortlist.jpg; with no shortlist it falls back to candidate cN) | 3 real stills from the lead's own YouTube for the video frame, 0 tokens; the human picks, Claude runs `--use` |

Order for one lead: build_lp, then build_thumb and build_page2 (both need the landing page PNGs), make_pointing (any
time after the headshot), build_youtube (after the pointing cutout and the approved pitch.csv row), make_canva_batch.

Helpers that live with the skills (`.claude/skills/outreach-lead/`, all run from this folder):

| helper | use |
|---|---|
| `new_lead.py <slug> "<Full Name>" [...]` | make the lead folder from `leads/_new-lead-template` (iCloud-safe) |
| `sheet_row.py` | not used (the team's lead sheet is ignored, decided 2026-09-20); kept for history |
| `pitch_calc.py check <slug>` / `target <slug> <amount> [--write]` / `approve <slug>` | the calculator formula, caps, and the approval write (pitch.csv row + lead.json price) |
| `pixel_mode.py <png> <x> <y> <w> <h>` / `contrast <hex> <hex>` | confirm brand hexes from real pixels, contrast ratios |
| `slide_check.py "<slide.html>"` | all measurable Day 1 slide gates, PASS/FAIL, no screenshot reading |
| `slide_shot.py "<slide.html>" "<out.png>" <dsf> <still> [nopattern]` | render the slide (final PNG: dsf 2, still 1) |

## Folder map

```
CLAUDE.md, START HERE.md       this file; the designer's guide
setup.sh, requirements.txt     one-time install
pitch.csv                      approved revenue rows only (slug, 8 calculator inputs, totals, notes)
prompts/                       the team's prompts, saved word for word: read them, never edit them
scripts/                       the build scripts (above), status.py, doctor.py, and make_ship.sh (zips this folder
                               for another Mac: `bash scripts/make_ship.sh [--no-leads]`)
template/, templates/lp/       the Canva-matched layouts (page 1 master.svg, page 2, YouTube, landing page v4)
assets/fonts/, bin/            price font and glyphs; Apple Vision helpers (rebuilt by setup.sh when needed)
reference/                     pose-reference-pointing.png (used by make_pointing) and design references
leads/_new-lead-template/      copied for every new lead
leads/katie-hunt/              the worked example: look here for the shape of every file
leads/<slug>/
  1 headshot/                  ONE photo from the lead's own site + SOURCE.txt (page URL)
  logo/                        OPTIONAL: one PNG or SVG of the lead's real logo (build_site uses the first
                               image here on the hosted page; with none, their emblem is drawn instead)
  2 video frame/               ONE real frame from one of their videos (a person puts it here)
  3 gemini figures/            ONE 16:9 Gemini image with 3 figures (a person puts it here)
  4 current launch screenshots/ 1-3 PNGs from capture.py, first 3 by name are used
  5 day 1 slide/              <slug>-day1.html + <slug>-day1.png, nothing else
  6 landing page full/        written by build_lp (<slug>-lp.png, -lp-top.png, -lp-bottom.png)
  7 pointing cutout/          written by make_pointing (pointing.png)
  8 youtube/                  written by build_youtube (both go into the Canva batch: <slug>-youtube.png; -yt-thumb.png
                               is the board on its own, a spare that no step uses; _ files are temporary)
  current-launch.md, brand.json, revenue-estimate.md, pitch-proposed.csv, lead.json, lp.json
  gemini-kit/                  photos + prompt.txt for the Gemini app
  lp/, page2/, pointing/       build outputs and work files
  video-frame-candidates/      frame_candidates.py: c1-c9.jpg, contact-sheet.jpg, shortlist.jpg, candidates.json
  slide-work/, _not-used/      scratch and rejected files (never delete them; both stay out of the ship zip)
out/                           <slug>-thumb.png and parts; canva-batch-<name>/ (the folder the designer drags from)
```
In `leads/katie-hunt/` ignore `calculator.csv`, `colors.json` (its label `#f2685b` was rejected; lead.json holds
the shipped colors), `price.txt`, `kit-research.json`, `sheet-row.md` (the lead sheet is no longer used),
`lp-from-scratch/` and `6 landing page full/from-scratch/`: they are leftovers from the first test, never copy their
shape. Her `current-launch.md` predates the VIDEO FRAME CANDIDATES section.
Not part of the pipeline: `leads/lindy-alexander` and `leads/nicolas-gorrono` (old demo shells; their pitch.csv rows
are an acceptance test and a demo), `leads/_lp-test-*` and `leads/_page2-test-lindy` (test fixtures), `leads.csv`,
`scripts/make_canva_sheet.py`, `scripts/xlsx_incell_images.py`, `scripts/lp_compare.py` (experiments),
`templates/lp-v2-backup`, `templates/lp-v3-jay-backup`, `templates/lp-v4-final` (frozen copy of templates/lp).

## One lead, start to finish

Two deliverables come out of one lead: the **Canva deck** (6 pictures plus the calculator text) and the **hosted
page** (a link you send them). Steps 0 to 9 and D serve the deck; E and F publish the page. They share everything
up to the landing page build, so never treat the page as a second project.

| # | who | step | output |
|---|---|---|---|
| PRE | person | `bash setup.sh`, then `python3 scripts/doctor.py` until it is clean. Once per Mac, plus `codex login` | a Mac that can run every step |
| 0 | Claude | lead folder | `leads/<slug>/` |
| 1 | Claude | current launch research, prompt 1; put their channel in lead.json `youtube_channel`, then `frame_candidates.py <slug>` and `--shortlist A B C` | `current-launch.md`, `video-frame-candidates/` |
| 2 | Claude | screenshots, capture.py (or `pick_screenshots.py` from prompt 1's links.json) | `4 current launch screenshots/` |
| 3 | Claude | brand colors from pixels | `brand.json`, lead.json colors |
| 4 | Claude | headshot from the lead's own site, and a SECOND photo for the page video if their YouTube gives no frame | `1 headshot/` + `SOURCE.txt`, maybe `2 video frame/` |
| P | script | `make_pointing.py <slug>` in the background: it only needs the headshot, and it is the long pole (2 to 5 min) | `7 pointing cutout/pointing.png` |
| 5 | Claude | revenue estimate, prompt 5, then `pitch_calc.py check <slug>` | `revenue-estimate.md`, `pitch-proposed.csv` |
| 6 | Claude | Day 1 slide, prompt 4; `slide_check.py` until it passes, at most 3 rounds | `5 day 1 slide/<slug>-day1.html` + `.png` |
| 7 | Claude | landing page copy, lp-fields, plus the lead's real logo if their site shows one | `lp.json`, maybe `logo/` |
| 7b | Claude | the hosted-page fields in `lp.json` `"site"`: `time_zone`, `keep`, `keep_title`. The format and the rules are SOP section 18 | `lp.json` `"site"` |
| 7v | Claude | validate: the one-liner in outreach-lead step 7. An `ERROR:` line stops the build | lp.json that builds |
| H1 | person | picks 1 of the 3 frames (Claude runs `frame_candidates.py <slug> --use N`, which writes SOURCE.txt too) | `2 video frame/` |
| H2 | person | approve the revenue number (and brand pick) | then Claude runs `pitch_calc.py approve` |
| 8 | Claude | Gemini prompt + photo kit, prompts 2 and 3. Only after H1: the prompt describes their real room | `gemini-kit/`, prompt on the clipboard |
| H3 | person | Gemini app, one 16:9 image | `3 gemini figures/` |
| A | script | `build_lp.py leads/<slug>` | `lp/`, `6 landing page full/` |
| B | scripts | `build_thumb.py` and `build_page2.py` (both need A's PNGs), then `build_youtube.py` (needs P and the approved row) | the deck pictures |
| 9 | Claude | review the thumbnail, tune `hero_zoom` + `hero_dx` together | rebuilt thumbnail |
| D | script | `make_canva_batch.py` (refuses while any output is STALE) | `out/canva-batch-<name>/` |
| E | script | `build_site.py <slug>` (over 2 min here), then the gates in SOP section 18 | `site/<slug>/` |
| E' | Claude | measure the page at `http://localhost:8765/<slug>/`. DOM rects, never the pane | a page that holds up on a phone |
| V | Claude | VIP hero: lp.json `site.vip` with a DIFFERENT still from `video-frame-candidates/_stills/`, then `build_vip.py <slug>` and measure `/<slug>/vip/` (SOP section 19). No hand-lettered notes on it | `site/<slug>/vip/` |
| F | script | `deploy_site.sh "<message>"`, then re-measure the live URL | `https://2026-or-afterharvest.vercel.app/<slug>/` |
| H4, H5 | person | check the pictures, then Canva Sheet + Bulk Create | the decks |

Measured times: build_thumb 7-9 s (22 s the first time), build_lp 13 s warm and up to about 50 s cold,
build_page2 3-6 s, build_youtube about 8 s, build_site over 2 min, deploy_site about 2 min,
make_pointing 2-5 min per lead at low reasoning (measured 2026-09-21: 100-280 s, 4 at a time; the account's
default xhigh took 300-960 s) and about 55K ChatGPT tokens per lead. Claude: roughly 450K to 850K tokens per lead, the slide
being about half. Warn the user before anything long.

**The hosted page is the step that gets skipped.** `make_canva_batch` is the pipeline's only automatic gate and it
knows nothing about `site/`, so a lead can finish the deck with no page at all, or with a page built from an older
landing page. `status.py` does not check it either. Until one of them does, E and F are on whoever runs the lead.

## Rules

**Facts and research**
- Public pages only. Never subscribe, join, opt in, buy, fill a form, click consent, DM or email anyone.
- Every fact on a lead's pages comes from a page you opened, with its URL. Unknown stays out.
- Never invent names, registrant counts, ratings, dates, testimonials, prices, launches, scarcity or "limited spots".
- Never call the pitched event their first event if they already run live events.
- Prefer the lead's own pages over third-party write-ups; when their own pages disagree, use the defensible number.

**Price and calculator** (one formula everywhere: `scripts/make_canva_batch.py` calc, used by pitch_calc.py)
```
registrants = ROUND(list_size x reg_rate)          vip = ROUND(registrants x vip_rate)
attendees   = ROUND(registrants x show_rate)       buyers = ROUND(attendees x buyer_rate)
course      = buyers x offer_price x pp_factor     total = vip x vip_price + course
headline    = "+$" + ROUND(total / 1000) + "K"  and lead.json price = headline + "?"   (ROUND = half away from zero)
              from $1M up: "+$" + millions to one decimal + "M" (+$1.4M, +$3M), asked for 2026-09-21
```
- Headline cap: +$550K (asked for 2026-09-21). A lead above it is brought down to +$550K with the list and the 20%
  registration kept, lowering the buyer rate first; `pitch_calc.py approve` refuses a total above $550,499.
- Caps: registration 25%, show-up 45%, VIP 15%, buyer 15 / 10 / 7 / 4% for offers up to $500 / $501-2,000 /
  $2,001-5,000 / above $5,000. Medians (FLOOR): 10%, 30%, 5%, buyer 5 / 3 / 2 / 1%. Defaults: pp 92, VIP $47.
- list_size and offer_price are facts, never raised. One currency per lead (lead.json `currency`), never mixed.
- lead.json `currency` is the DISPLAY SYMBOL every script prints as a prefix ("$", "A$", "£", "€"), never an ISO code.
  Leave it out for US dollars (every script defaults to "$"). Writing "USD" prints "+USD110K?" on the thumbnail and
  "USD222,750" on the YouTube board.
- The PITCH number from prompt 5 is the recommendation, FLOOR is a sanity check. A person approves the number before
  it is written anywhere; `pitch_calc.py approve` then writes pitch.csv and lead.json together, so the thumbnail,
  calculator page, YouTube board (with cents) and YouTube title all agree.
- In pitch.csv rates are percent numbers (18 = 18%). Write 1% or less as a fraction (0.01, 0.005): the scripts read
  any value of 1 or less as a fraction. The `target_override` column is a note only; no script reads it.

**Photos**
- Real photos of the same person only, never a lookalike. Headshot from the lead's own site or socials with its URL
  in `1 headshot/SOURCE.txt`; never from Sean's AfterHarvest Kit or a Google Images guess.
- Video frame: a real frame, checked for AI metadata (OpenAI, gpt-image, c2pa). A person confirms it.
- The landing page VSL (the iPhone video) never shows the same photo as the fit-check portrait (the headshot).
  `2 video frame/` takes, best first: the lead photo the designer used as the Canva thumbnail background (the
  original file, dropped in by the designer), a still from their own video (`frame_candidates.py`), or a second,
  different photo from their own site or socials with its URL in `2 video frame/SOURCE.txt`. The copy agents look
  for that second photo while they find the headshot. build_lp flags a page whose VSL is the headshot (asked for
  2026-09-21; the 59-lead sheet batch shipped with the headshot in both places and was left as is).
- One image per input folder. Rejected files go to `leads/<slug>/_not-used/`. Never delete lead data.

**Copy** (everything a lead or client sees)
- No em dashes (grep new copy for the character before shipping). No "X, not Y". No triple short-sentence stacks.
- Sentence case. Day labels in numerals (Day 1). No emoji, no decorative sparkles, stars or twinkles (the orange
  spark-lines in the thumbnail template are part of the Canva design and stay).
- Headlines use hand-set line breaks in nowrap spans, never browser wrapping.
- The landing page is a CONCEPT with no working form: no dollar figures, "revenue" or "guarantee" on it.
- The HOSTED page (the link version) never says "concept": the lead should read it as already theirs.

**Fonts and brand**
- Banned unless provably the lead's own: Playfair, Montserrat, Lato, Open Sans, Roboto, Poppins, Raleway, Oswald,
  Bebas, Nunito, Source Sans, Merriweather, Inter.
- Fontshare, one `<link>` per family; check the family exists; prove it loaded with a width probe.
- The landing page always uses the Day 1 slide's own faces, never a stand-in for the website font.
  Exception: a Day 1 slide made in Canva (PNG only) has no faces to read, so build_lp takes the lead's own site faces
  from capture's page dump in brand.json (Google Fonts or Fontshare; a Fontshare stand-in only when the site face is on
  neither). Sheet batches use `"pattern": "dots"`: a grid boosted to pass the visibility test reads heavy.
  build_lp also darkens (or lightens) the body ink in its own hue when it reads under 7:1 on the ground: a thumbnail
  crop can sample its ink from a pale grid line (7 pages at 2-3:1 on 2026-09-21). lp.json style.colors.ink overrides.
- Brand hexes are sampled from pixels, never picked by eye. Slides keep the ground tone, one dominant accent, one
  hand-drawn mark.
- The landing page ground is calm, whatever the slide's ground is. A bright or mid slide colour (yellow, blue, orange)
  becomes an off-white warmed toward it, and the colour moves into the accents (headline mark, buttons, checks, day
  numbers). A deep brand colour (navy, plum, teal, forest) stays the ground, a shade deeper (value 0.20, same hue):
  never near-black, which took away the brand's personality. Black and calm off-white grounds stay. build_lp does
  this (`calm_ground`), unless lp.json style.colors.ground is set (asked for 2026-09-21; the deep-colour version was
  picked from three builds of Evan Fisher).

**Canva pictures replace frames**
- Each picture is a plain piece: cropped from the top to its frame's shape, not tilted, not pre-positioned,
  transparent only where the shape is not a rectangle. Position, size and tilt live in the Canva template.
- Exactly 6 pictures per lead go into the Canva Sheet: the 5 page pictures plus `last_yt_thumb`, the YouTube
  board on its own (the user asked for it on 2026-09-20; the last deck page uses both). `page2/page2-preview.png`
  is a check picture, never uploaded.

**Locked design decisions** (do not reopen)
- Sean's circle photo is hidden on the thumbnail (`"show_host": true` in lead.json brings it back).
- Money marks on page 1 (`scripts/money_mark.py`, run inside render_thumb, no extra command, approved 2026-09-20):
  figure 3's cash gets a thin hand-drawn loop and a band behind it; figure 2's single note gets the template's red
  loop (#e7191f), which says the current launch is the small number. The loop colour is worked out from the lead's
  own accent, turned just short of its exact complement (0.455 of the wheel, about 164 degrees, so it lands on teal
  rather than pure blue), because a fourth mark in the brand orange disappears into the price glow, the underline and
  the spark lines. The cash is found by hue (banknote green, 70-148 degrees), so teal props are not circled.
  lead.json can carry `"money_mark": false`, or
  `{"style": "loop|underline|arrow", "color": "#hex", "small": false, "small_color": "#hex",
  "with_underline": true, "swipe": true, "swipe_color": "accent", "mark": true, "dx": 0, "dy": 0, "scale": 1.0}`
  (`swipe` is the band behind the cash, `mark` the loop itself, so either can be turned off alone;
  `swipe_color: "accent"` makes the band use the brand accent instead of the mark colour).
- The YouTube board shows the approved total with cents, the red calculator note and Sean's caption with the lead's
  first name. Landing page v4 is frozen: Jay's layout only, landscape iPhone for the video, the Day 1 slide on a
  MacBook, a sleek premium finish. The page 2 slide frame takes the brand color, the webcam border stays green.

**AI services**
- No Gemini API, ever: a person uses the Gemini app on the team's Pro account. Do not suggest the paid API.
- The pointing cutout goes through the Codex CLI on the ChatGPT plan (`make_pointing.py`), never a browser session,
  Atlas or the OpenAI image API. `codex login` is done once by the human, never by you.
- make_pointing passes `-c model_reasoning_effort=low` to `codex exec`: the job is one image_gen call. Never remove
  it. The ChatGPT account's own Codex default is xhigh, and at xhigh each cutout spent 5-16 minutes thinking first.
- One Mac, one heavy thing at a time: 10 agents each building pages in Chromium while 4 Codex jobs ran pushed the
  load average past 400 on 2026-09-21 and slowed every step. In a batch, agents write copy and fetch headshots
  only; the builds run afterwards in one pass (build_lp, brand_from_lp, build_page2, build_youtube, sheet_batch).
- Screenshots, cutouts, room erase, figure split and every assembly step are local scripts. Never screenshot with AI.

**Files, runtime and hand-off**
- Python 3.9: no `match` statements, no `X | Y` type unions. Run scripts from this folder.
- The folder may live in iCloud Drive: copy files with `read_bytes` / `write_bytes`, never `shutil.copy2` (an
  "online only" file times out). Never create a venv or cache inside this folder.
- Pass explicit slug lists. Never use `leads/*`.
- Screenshots: never capture a privacy policy, terms, cookie notice, legal or refund page, a login or account page,
  a contact form, a loading or "connecting" page, a bot wall ("verify you are human", captcha, "just a moment") or
  an error page. `pick_screenshots.py` enforces this. Worth capturing, best first: a dated live event or countdown,
  an open sales page with price and deadline, a waitlist with a date, a newsletter archive with dated issues, a
  recent post with views, a community page with a member count. The full list is in the SOP.
- Audience is every channel, not one number. An owned list or paid community counts at full weight whether or
  not their offer is open today: who you can invite and what you charge are separate questions.
- A lifetime total is never an audience channel: "customers to date", "students enrolled", "businesses served",
  "over 7 years". Those people are mostly already on the email list. Paid members means a live, current count
  (a Skool or Circle member count, a membership page). On 2026-09-21 Todd Herman's 19,935 businesses and Damini
  Tripathi's 10,000 students had been counted as paid members; the census now marks such numbers
  `lifetime_buyers_not_counted`.
- A batch from the team sheet: its offer and price columns are claims to verify, never facts. Many rows price the
  lead at a proposed cohort they do not sell. Verify on the lead's own page first, then price. The runbook is the
  SOP section "Screenshots and pricing for a sheet batch".
- lead.json: `"youtube_channel"` is the lead's own YouTube channel URL (frame_candidates.py); `"youtube"` is a dict
  for the YouTube page color. Do not put a URL in `"youtube"`.
- Never publish or send anything, and never write to Google Sheets (you cannot); tell the human what to update.
- Every hand-off ends with a bash block of `open "<full path>"` commands for the folders the human needs (run `pwd`
  once to get this Mac's path). make_canva_batch opens its images folder by itself.
- The hosted page is all template: `templates/lp/site.css` + `site.js` + the two build scripts. Never hand-author
  a lead's page. If a lead needs something the template cannot express, extend the template so every lead gets it.
  The design record is `docs/hosted-page-design-spec.md`; read it before changing the hosted page.
- **A lead's own hosted-page data is three optional fields in `lp.json` `"site"`**: `time_zone` (an IANA zone, or
  the page tells them their event runs on New York time), `keep` (the three documents in "What you keep") and
  `keep_title`. Plus `leads/<slug>/logo/` for a real logo. The format, the tones and the gates are SOP section 18.
  Anything set in `site.json`'s own `site` object covers every lead, and a lead still overrides it.
- **`keep` is the only place the page can read as a template, so it has its own method: `docs/lp-keep-kit.md`.**
  Inventory the ATTENDEE (not the lead: their units are usually opposite), five candidates, four kill tests
  including banned structures, a length budget, then `scripts/check_page.py`. Written after a stress test in which
  two of three leads produced the same three shapes while avoiding every banned word. Card kinds are `brief`,
  `table`, `sheet` and `tracker`; an unknown kind silently falls back to a bullet list.
- `build_lp.validate` lifts its no-currency rule for anything under `.site`, because a margin worksheet needs
  prices and `build_lp` never renders `site`. Em dashes, emoji and "revenue" are still refused there.
- **Looking at the hosted page.** The launch config `outreach-site` serves `site/`, NOT the repo root, so the page
  is `http://localhost:8765/<slug>/`. `python3 scripts/build_site.py <slug>` takes over two minutes on this Mac
  (iCloud), so while iterating on the template, copy the three files it would copy and bust the cache instead:
  `cp templates/lp/{site.css,site.js,lp.css} site/<slug>/` then rewrite the `?v=` hashes in that `index.html`.
  Run the real `build_site.py` before deploying so the built folder is not a hand-patched one.
- **Judge it by measuring the DOM, not by the pane.** The in-app browser pane returns blank or wrong-viewport
  screenshots here, and it reports `innerWidth` 0 until you set a size. Set the viewport, then read rects with
  `getBoundingClientRect()` and computed styles. For a picture, use `python3 scripts/capture.py <outdir>
  "http://localhost:8765/<slug>/::css=#takeaway"`, which gives a real 1440x900 at 2x. After `deploy_site.sh`,
  re-measure on the live URL: a local copy proves nothing about what shipped.
- **The hero device size lives in two files.** `.iphone` in `lp.css` (currently 516x340) and `PHONE_W`/`PHONE_H`
  in `scalePhone()` in `site.js`. Change one and you must change the other, or the `.hvid` box stops matching
  the drawing. It used to hardcode 248 in the JS, which is exactly how that drifts.
- Say when something will take long before starting it. Ship a visible result fast. If the user asks for the plan,
  give the plan before doing anything.

## Saving tokens

- Several leads per session, one subagent per lead for the research: the main session keeps only the short return
  blocks. The Gemini prompts for a batch are written in one pass so the 67 KB prompt 2 is read once.
- Read prompt files from `prompts/` when a step needs them; never paste them into the chat, never read them "just in case".
- Reuse the scripts and helpers instead of re-deriving: capture.py for every screenshot, pixel_mode.py for colors,
  slide_check.py for the slide gates, pitch_calc.py for every number, status.py for "where are we".
- Never read big files whole: capture's brand JSON (grep it),
  Katie's slide (only lines 1-136 and 719-812 hold the page contract).
- Look at a picture only when judging it: each screenshot once, the final slide once, each thumbnail once.
- Cap research: prompt 1 is "just the links", about 10 to 15 minutes; the Gemini photo search about 10 minutes;
  at most 3 slide fix rounds.
- Never re-run make_pointing without `--force` being needed; it spends the team's ChatGPT usage. Never run it at
  all for `katie-hunt`: her cutout is the checked example.

## When something breaks

- Run `python3 scripts/doctor.py` and do what its FIX lines say (installs are the human's job: `bash setup.sh`).
- `ModuleNotFoundError` from a script: `python3` is not Apple's Python. Use `/usr/bin/python3` for the same command
  and tell the human to run `bash setup.sh` again.
- A script hangs, times out or prints `[Errno 60] Operation timed out`: iCloud has the file "online only". Run
  `bash setup.sh` (its step 7 downloads them), or ask the human to move the factory folder into their home folder,
  then run again.
- `Codex is not installed` or a FAILED pointing line: the human runs `bash setup.sh`, then `codex login` in Terminal.

## Older docs

`README.md` and `CONTRACT.md` are out of date and say so in their first line (README's hardcoded path, "open
lead.json in TextEdit", `leads/*`, its page 2 layer section; CONTRACT's in/ + auto/ folders, calc.py, render.py,
run_all.py and leads.csv were never built this way). This file and the skills win, and the designer's guide is
`START HERE.md`. The living SOP doc (link in `SOP-LINK.md`) is Sean's record of every decision;
if you change the process, say so in your hand-off so it can be logged there.

- **Never write a lead's own vocabulary or a pronoun for the host into templates/lp/site.js.** Every sentence about
  the work comes from that lead's days (dayLine/prepAnswer/fitCopy); the host is named by first name. Katie's
  wholesale wording and "She runs the three days herself" shipped on every lead until 2026-09-23.
- **Small print is measured, not eyeballed.** --muted carries a 4.5:1 floor against the lead's ground (fade() in
  scripts/build_lp.py). Measure ink over the element's own panel colour with an element screenshot (element.screenshot
  scrolls it into view; a page-coordinate clip of anything below the fold returns blank and reads as 1.00:1).
