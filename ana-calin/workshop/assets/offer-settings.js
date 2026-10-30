/* ---- the offer pages' settings, one place for both /join and /program. Theia fills these in. ---- */
window.OFFER = {
  PROGRAM:       'The Exit Lab',  // working name; Ana may rename it after the survey (agreed Oct 23). Changes it everywhere.
  CHECKOUT_FULL: '',              // Stripe (or ThriveCart) link, $1,500 paid in full. Empty = demo.
  CHECKOUT_PLAN: '',              // the link for 2 payments of $850
  PAY2_DATE:     '',              // e.g. 'Thu Dec 31'. Empty = "in 30 days".
  LIVE_CALLS:    'A live call with me every week, except Christmas week',  // spine v28, approved by Ana Oct 29. Empty = no live calls shown anywhere.
  HOURS:         '',              // e.g. 'about 4 hours a week'. Empty = "built for the evenings you have".
  BONUS2_NAME:   'The audit: my notes on your offer, price and first ask',  // [Ana confirms] the one live bonus: 50 seats, Day 2 buyers first, last seats Thu Nov 19, 11:59 pm New York (spine v23)
  BONUS2_SEATS:  '50',            // e.g. 50. Empty = no seat count shown.
  BONUS3_NAME:   '',              // [revealed live on Day 3] Empty = no Day 3 bonus tile.
  BONUS3_SEATS:  '',
  SAFETY_TITLE:  'My do-the-work promise',  // spine v28 wording, approved by Ana Oct 29. Empty = the promise block and its line stay hidden.
  SAFETY_TEXT:   'Do the daily tasks and come to the calls. If by Dec 30 you don\'t have your offer, your price and your launch ready to send, email me. We fix it with you first, and if you still want out, you get a full refund. No tasks done, no refund.',
  SAFETY_LINE:   'my do-the-work promise',  // one line under the button
  SKIP_TEXT:     '',              // for 10K Launch Lab students: which days they can skip. Empty = row hidden.
  VIDEO_SRC:     '',              // the offer video (long page), cut from Day 2 the night of Wed Nov 18
  METHOD:        'Find it, price it, ask it',  // the method name in spine v28, approved by Ana Oct 29. Empty = "How it works".
  BACKUP_PAY_URL:  '',            // a second way to pay (PayPal or similar) if a card fails. Empty = the line stays hidden.
  BACKUP_PAY_TEXT: '',            // e.g. 'Card not going through?' (that's the default)

  /* ---- the long page (/program) only. Each one stays hidden until it's filled in. In Ana's words, first person. ---- */
  SENTENCE:      '',              // [Ana] the real last sentence of her 82-like post, word for word. Empty = "What I sell, and where to get it."
  ANA_PART:      '',              // [Ana] what she does herself, e.g. 'I read your sentence and your sales page myself, and I'm in the Circle room every weekday.'
  WHERE:         '',              // [Ana] where it happens, e.g. 'In the Circle room: one task a day, with the coach linked from each one.'
  KEEP:          'The tasks and the three workshop recordings stay yours, and my AI coach stays open for a full year.',  // spine v28 bonuses (AI coach for a full year)
  TOOLS:         '',              // [Ana] what people need set up, e.g. 'Your newsletter and a free Stripe account.'
  RESULTS:       []               // [Ana, with each student's OK] e.g. { result: 'First paid offer, 14 buyers in a week', quote: '...', name: 'Jill Hart', where: 'Writer, The Second Act', photo: '../img/av/jill.webp' }
};
