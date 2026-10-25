/* ---- the offer pages' settings, one place for both /join and /program. Theia fills these in. ---- */
window.OFFER = {
  PROGRAM:       'The Exit Lab',  // working name; Ana may rename it after the survey (agreed Oct 23). Changes it everywhere.
  CHECKOUT_FULL: '',              // Stripe (or ThriveCart) link, $1,500 paid in full. Empty = demo.
  CHECKOUT_PLAN: '',              // the link for 2 payments of $850
  PAY2_DATE:     '',              // e.g. 'Thu Dec 31'. Empty = "in 30 days".
  LIVE_CALLS:    '',              // e.g. 'A weekly live call with me, recorded'. Empty = no live calls shown anywhere.
  HOURS:         '',              // e.g. 'about 4 hours a week'. Empty = "built for the evenings you have".
  BONUS2_NAME:   'An AI-assisted audit of your offer',  // [Ana confirms] the Day 2 bonus (ends Wed Nov 18, 11:59 pm New York)
  BONUS2_SEATS:  '',              // e.g. 50. Empty = no seat count shown.
  BONUS3_NAME:   '',              // [revealed live on Day 3] Empty = no Day 3 bonus tile.
  BONUS3_SEATS:  '',
  SAFETY_TITLE:  '',              // Ana's safety promise (B6). Empty = the promise block and its line stay hidden.
  SAFETY_TEXT:   '',
  SAFETY_LINE:   '',              // one line under the button, e.g. 'my do-the-work promise'
  SKIP_TEXT:     '',              // for 10K Launch Lab students: which days they can skip. Empty = row hidden.
  VIDEO_SRC:     '',              // the offer video (long page), cut from Day 2 the night of Wed Nov 18
  METHOD:        '',              // [Ana names it] the name of the one reader / one sentence / one ask method. Empty = "How it works".
  BACKUP_PAY_URL:  '',            // a second way to pay (PayPal or similar) if a card fails. Empty = the line stays hidden.
  BACKUP_PAY_TEXT: '',            // e.g. 'Card not going through?' (that's the default)

  /* ---- the long page (/program) only. Each one stays hidden until it's filled in. In Ana's words, first person. ---- */
  SENTENCE:      '',              // [Ana] the real last sentence of her 82-like post, word for word. Empty = "What I sell, and where to get it."
  ANA_PART:      '',              // [Ana] what she does herself, e.g. 'I read your sentence and your sales page myself, and I'm in the Circle room every weekday.'
  WHERE:         '',              // [Ana] where it happens, e.g. 'In the Circle room: one task a day, with the coach linked from each one.'
  KEEP:          '',              // [Ana] what's kept after Dec 30, e.g. 'The tasks stay yours, and Ana AI Coach stays open until Mar 31.'
  TOOLS:         '',              // [Ana] what people need set up, e.g. 'Your newsletter and a free Stripe account.'
  RESULTS:       []               // [Ana, with each student's OK] e.g. { result: 'First paid offer, 14 buyers in a week', quote: '...', name: 'Jill Hart', where: 'Writer, The Second Act', photo: '../img/av/jill.webp' }
};
