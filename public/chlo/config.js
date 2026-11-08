// ─────────────────────────────────────────────────────────────
//  EDIT ME 💌  Everything personal lives in this one file.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  herName: "Chloconut",
  hisName: "Kyle",
  anniversaryLabel: "Happy 1st Anniversary",
  togetherSince: "2025-11-09",  // the day Kyle asked her out

  // Optional. Leave "" to use the free keyless Street View embed.
  // With a key (Maps JavaScript API enabled) street names/addresses get hidden properly.
  googleMapsKey: "AIzaSyDsV4NEDmCtlP3RULU5B080ETo0pWN-vJU",

  puzzle: {
    photo: "assets/photos/us.jpg",
    caption: "Chongqing, 10 March 2026",
  },

  // GeoGuessr rounds — all Google Street View. heading = which way the camera faces at start (0 = north).
  // memory = optional note shown after guessing ("" = none).
  rounds: [
    {
      type: "streetview",
      title: "Round 1: drinks on your rich friend",
      lat: 3.11796, lng: 101.59473, heading: 0,     // Your Rich Friend's Apartment, Jalan PJU 1/39, Dataran Prima, PJ (Google, 2026-03)
      answer: "Your Rich Friend's Apartment, Petaling Jaya",
      memory: "",
    },
    {
      type: "streetview",
      title: "Round 2: home sweet home?",
      lat: 51.37629, lng: -2.37873, heading: 280,   // 8 St Kilda's Road, Bath (Google, 2024-08)
      answer: "8 St Kilda's Road, Bath",
      memory: "\"after cortado i am coming to st kilda's to annoy u\" and i did. every single day 😙",
    },
    {
      type: "streetview",
      title: "Round 3: irasshaimase",
      lat: 34.67097, lng: 135.48794, heading: 273,  // Sakuragawa, Naniwa-ku, Osaka: tree-lined street N of the station (Google, 2026-09)
      answer: "Sakuragawa, Osaka",
      memory: "matcha desserts and u getting stuck in a mall for 20 mins trying to find the exit 🤣",
    },
    {
      type: "streetview",
      title: "Round 4: balik kampung",
      lat: 3.17771, lng: 101.70709, heading: 300,   // Taman Tasik Titiwangsa, KL: lakeside path (Google, 2012-12)
      answer: "Titiwangsa, Kuala Lumpur",
      memory: "KL w u: 2am nasi lemak, teh tarik and ur mum's pickleball 🏓",
    },
    {
      type: "streetview",
      title: "Round 5: sun, sand, coconut 🥥",
      lat: 5.93771, lng: 80.47402, heading: 200,    // Mirissa, Sri Lanka: beach lane onto the sand, east end (Google, 2015-02; no Google coverage on the main beach)
      answer: "Thalaramba Beach (next to Mirissa), Sri Lanka",
      memory: "",
    },
  ],

  // The letter at the very end. Each new line = a new paragraph (one \n, not two).
  // DRAFT written from our texts — make it yours before she sees it.
  letter: `hi pumpkin
one year ago i said "yoo" and somehow u stuck around. u even said yes when i asked u out. still don't know how i pulled that off tbh
since then we've done virgil and nando's and the usual place, 2am nasi lemak in KL, hotpot and capybaras in chongqing, osaka, bath, and now london. i acc think u could turn anywhere into home. u definitely did for me
ok i'm gona say it properly because u always say my messages aren't sincere enough and need more text effects
I love you
I kinda am slightly (massively) in love with you, and every time u text me i still get a jump scare cos my heart races
u are my cutie patootie, my ganoush, my best travel buddy and my favourite person to lose at skyjo to (it's still rigged)
thank u for being patient with me, for roasting me, for being late to literally everything (11:30 means 11:59, i've tested it) and for being the best thing that's ever happened to me
one down, 217 more to go. ur stuck with me forever unfortunately
happy anniversary my chloconut 🥥
I love you so much 😙😙😙`,
};
