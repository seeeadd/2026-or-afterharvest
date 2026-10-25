# Ana's offer pages: the real pictures we need from Ana, and where every image goes

SOP 3C and Module 3 ("Graphics decision framework") say: a real person, a real product screen or a real result is
never invented. Those are the pictures only Ana can give us. Everything else is our own drawing: the example screens
on both pages are drawn in HTML (`../offer-ui.css`), from an example newsletter, Back to Work, and labelled Example.
There is no example person behind them.

## What to ask Ana for (in order of impact)

| # | Ask Ana for | Where it goes | Why it matters | Until then |
|---|---|---|---|---|
| 1 | **The offer video**: her Day 2 offer section, cut the night of Wed Nov 18 (the spec's "Offer video") | /program hero, the video block inside the draft | The page is built to be watched first. Spec item, due Wed Nov 18 | Her real frame as the poster, "The recording goes up the night of Wed Nov 18" |
| 2 | **3 to 5 high-res photos of her**: one looking into the camera (landscape 16:9), one at her desk or laptop at home in Greece, one wider lifestyle shot of the village, one portrait for the letter. Real, not AI | /program letter photo, hero byline, video poster; /join "Guided by" card | Every real photo we have is a 405 × 720 frame from her YouTube Shorts: sharp small, soft large. Her other images (cabin, kitchen, Paris, sea, VSL) are AI, which we agreed not to show as her | YouTube Shorts frames |
| 3 | **A screenshot of the Day 1 or Day 2 call in gallery view** (attendees blurred, or with their OK) | /program hero video poster (corpus "hero option B": creator in front of a Zoom grid) | Real proof the room exists | Her frame alone, no invented attendees |
| 4 | **Screenshots of her Circle** (10K Launch Lab or community), names and faces blurred, members' OK | a "the room" screen in /program's December, /join "The Circle room" | Spec 5b: real screenshots, or a mock labelled "illustration" with no invented member results | Mentioned in words only |
| 5 | **A real screenshot of Ana AI Coach** (the actual tool, one real question and answer) | /program Day 1 screen, /join bonus card | It's a product: SOP says product screens are real | Our drawing of an example chat, labelled Example |
| 6 | **A real daily task** from the 10K Launch Lab (one day's task as students see it) | /program December and the calendar ("Round 1 · Day 3: send your one question") | Shows the work is small and real | Our example task names |
| 7 | **One proof card she chooses**: her Substack or Stripe dashboard, numbers blurred where she likes | /program letter, next to "$1.4M" (spec section 8) | Show-then-tell on the $1.4M | Her photo |
| 8 | **Screenshots of the two posts**: the 771-likes post that made $0 and the 82-likes post that made $120 | /program "My most-liked post made $0." | The page states those numbers; a real screenshot makes them believable | Two stats cards redrawn from the numbers, titles left blank |
| 9 | **Real student results, with OK**: 2 or 3 screenshots of a past student's first sale, a reply thread or a launch email that worked | /join "What you walk away with", /program December | SOP: "every component has proof". Real results would sit next to (or replace) the example screens | The example screens, labelled Example |
| 10 | **The missing testimonials**: Jill Hart, Nate Solon, Neera Mahajan (named in the spec) as text + photo + newsletter name, and more to reach 12 to 20 in total. Original screenshots (DMs, comments, emails) are even better | /join proof wall; /program quotes by section | SOP wants 12 to 20; we have 11. Amaya has no photo (shows an "A") | 11 quotes from her site and wall |
| 11 | **A sample of the Day 2 bonus**: one AI-assisted offer audit (blurred) | /join "Live bonus" card | Fladlien: "no proof, no bonus" | Name and deadline only |
| 12 | **The Forbes mention**: the link or a screenshot of the line where Forbes called How We Grow a must-subscribe | /program letter ("Forbes called How We Grow a must-subscribe") | It's quoted from her About page; we should hold the source | Her About-page wording |
| 13 | Optional: **her handwritten signature** (a photo of "Ana" on paper) | /program letter sign-off | A real signature beats a font | "Ana" in Instrument Serif italic |

## Image audit (every image in the folder, viewed)

| File | Size | What it is | Real? | Use |
|---|---|---|---|---|
| img/real/ana-live-a.webp | 1280 × 720 | Shorts still, painting wall, her vertical video over a blurred fill | Real | Spare |
| img/real/ana-live-b.webp | 1280 × 720 | Shorts still, kitchen, same treatment | Real | Spare |
| img/real/ana-real-a.webp | 405 × 720 | Sharp vertical centre, painting wall, smiling, hands together | Real | /program letter photo |
| img/real/ana-real-b.webp | 405 × 720 | Sharp vertical centre, kitchen, talking to camera | Real | /program hero byline and video poster, the post-stats avatars; /join host card |
| img/real/ana-real-c.webp | 405 × 720 | Second kitchen still | Real | Spare |
| img/ana-hat.webp | 520 × 520 | Yellow wall, black hat | Looks real, confirm with Ana | Not used |
| img/vsl.webp, ana-cabin, ana-kitchen, ana-paris, ana-sea | various | Her AI-generated portraits | AI | Not used on the offer pages |
| img/av/*.webp | 80 × 80 | Testimonial avatars from her site | Real | Quotes |
| img/mark.png | 256 × 256 | The How We Grow sunflower mark | Hers | Bar, receipt, the coach's avatar in the example screens |

The example screens are not image files any more: they are HTML (`../offer-ui.css`, `../offer-ui.js`), so they stay
sharp at any size and act out what they show. When a Gemini hands photo arrives (`GEMINI-PROMPTS.md`), the matching
screen is captured from the page and put into the photo's green screen.

## Image map

- **/join**: host card = ana-real-b · week cards = the inbox, the sales page and emails, the checkout, launch morning
  (example screens) · coach card = the Ana AI Coach chat (example screen) · proof wall = avatars.
- **/program**: hero = the offer as a draft in an editor, byline and video poster = ana-real-b · "My most-liked post
  made $0." = two redrawn stats cards · December = six example screens (coach chat, inbox, page and emails,
  checkout, Christmas lock screen and calendar, launch morning) · the hours it fits into = an example calendar day ·
  letter = ana-real-a · quotes = avatars by section · price = a ruler of her real prices and the order as a receipt.
