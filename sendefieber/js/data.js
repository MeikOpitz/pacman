// Sendefieber – Spieldaten (alle Namen, Sendungen und Firmen sind frei erfunden)

export const SLOTS = [
  { name: 'Frühschicht', start: 6, end: 9, pot: 0.55 },
  { name: 'Vormittag', start: 9, end: 12, pot: 0.34 },
  { name: 'Mittag', start: 12, end: 15, pot: 0.40 },
  { name: 'Nachmittag', start: 15, end: 18, pot: 0.48 },
  { name: 'Feierabend', start: 18, end: 21, pot: 0.44 },
  { name: 'Nacht', start: 21, end: 24, pot: 0.24 },
];

// fit: wie gut das Genre in den jeweiligen Sendeplatz passt; wear: Abnutzung pro Ausstrahlung
export const GENRES = {
  pop:      { name: 'Pop',      fit: [1.2, 1.0, 1.0, 1.1, 1.0, 0.8], wear: 0.08 },
  rock:     { name: 'Rock',     fit: [0.8, 0.8, 0.9, 1.1, 1.2, 1.1], wear: 0.08 },
  schlager: { name: 'Schlager', fit: [1.0, 1.3, 1.1, 0.9, 0.8, 0.6], wear: 0.08 },
  dance:    { name: 'Dance',    fit: [0.7, 0.6, 0.7, 1.0, 1.2, 1.4], wear: 0.09 },
  klassik:  { name: 'Klassik',  fit: [0.7, 1.0, 0.9, 0.8, 1.1, 1.3], wear: 0.07 },
  talk:     { name: 'Talk',     fit: [1.0, 1.1, 1.2, 0.9, 1.0, 1.1], wear: 0.13 },
  comedy:   { name: 'Comedy',   fit: [1.3, 0.8, 0.9, 1.0, 1.2, 0.9], wear: 0.20 },
  hoerspiel:{ name: 'Hörspiel', fit: [0.6, 0.8, 0.9, 1.0, 1.2, 1.3], wear: 0.25 },
  sport:    { name: 'Sport',    fit: [0.7, 0.6, 0.8, 1.3, 1.3, 0.7], wear: 0.15 },
  ratgeber: { name: 'Ratgeber', fit: [0.9, 1.3, 1.2, 0.9, 0.7, 0.6], wear: 0.12 },
};

// id, Titel, Genre, Qualität (0–100)
export const SHOWS = [
  ['s01', 'Kaffee & Krümel', 'talk', 36],
  ['s02', 'Hits vom Band', 'pop', 40],
  ['s03', 'Opa erzählt vom Angeln', 'ratgeber', 30],
  ['s04', 'Die Gute-Nacht-Kassette', 'klassik', 34],

  ['s05', 'Weckdienst mit Wumms', 'comedy', 48],
  ['s06', 'Schunkelstunde', 'schlager', 44],
  ['s07', 'Der Heimwerker-Notruf', 'ratgeber', 46],
  ['s08', 'Garagenrock aus Gütersloh', 'rock', 42],
  ['s09', 'Kreisliga kompakt', 'sport', 45],
  ['s10', 'Mitternachts-Mixtape', 'dance', 47],
  ['s11', 'Kommissar Knäckebrot ermittelt', 'hoerspiel', 50],
  ['s12', 'Frag Frau Doktor Fenchel', 'ratgeber', 52],
  ['s13', 'Die Hitrakete', 'pop', 55],
  ['s14', 'Plausch am Gartenzaun', 'talk', 50],
  ['s15', 'Streichquartett & Salzgebäck', 'klassik', 49],

  ['s16', 'Hallo Wach, Stadt!', 'comedy', 62],
  ['s17', 'Herzblatt-Hitparade', 'schlager', 60],
  ['s18', 'Gitarrengewitter', 'rock', 61],
  ['s19', 'Der Anrufbeantworter', 'talk', 63],
  ['s20', 'Flutlicht – Die Sportschau fürs Ohr', 'sport', 64],
  ['s21', 'Bassbunker', 'dance', 60],
  ['s22', 'Das Geheimnis von Schloss Schimmel', 'hoerspiel', 66],
  ['s23', 'Chart-Countdown 40', 'pop', 68],
  ['s24', 'Küchenschlacht am Mikrofon', 'ratgeber', 62],
  ['s25', 'Sinfonie zur Sperrstunde', 'klassik', 65],

  ['s26', 'Die Zwei vom Frühstückstisch', 'comedy', 76],
  ['s27', 'Stadionfieber live', 'sport', 78],
  ['s28', 'Nachtfalter – Talk bis zum Morgen', 'talk', 75],
  ['s29', 'Raumstation Rhabarber', 'hoerspiel', 79],
  ['s30', 'Schlagerexpress Deluxe', 'schlager', 74],
  ['s31', 'Lautsprecher-Legenden', 'rock', 77],
  ['s32', 'Tanzflächen-TÜV', 'dance', 75],
  ['s33', 'Die Geldfüchse', 'ratgeber', 73],

  ['s34', 'Die große Hörerwunsch-Gala', 'pop', 88],
  ['s35', 'Promi-Verhör mit Peggy Pfeffer', 'talk', 90],
  ['s36', 'Lachsalven Royal', 'comedy', 89],
  ['s37', 'Weltmeister-Konferenz', 'sport', 91],
  ['s38', 'Der Fluch der goldenen Schallplatte', 'hoerspiel', 92],
  ['s39', 'Philharmonie im Wohnzimmer', 'klassik', 86],
  ['s40', 'Stahlwerk Open Air', 'rock', 90],
  ['s41', 'Laserhimmel – Die Rave-Nacht', 'dance', 88],
  ['s42', 'Goldene Kehlen', 'schlager', 87],
].map(([id, title, g, q]) => ({ id, title, g, q }));

export const STARTER = ['s01', 's02', 's03', 's04'];

export const CLIENTS = [
  'Knusperflocken „Knack“', 'Autohaus Bleifuß', 'Möbel Wackel', 'Brause „Zisch!“',
  'Bausparkasse Eigenheim & Söhne', 'Haarspray „Betonfrisur“', 'Reisebüro Fernweh',
  'Katzenfutter „Schnurr“', 'Videothek Rückspul', 'Matratzen Murmeltier',
  'Fahrschule Vollgas', 'Sauerkraut „Krautkönig“', 'Diskothek Nebelmaschine',
  'Tiefkühlpizza „Pronto Presto“', 'Computerladen Byte & Bit', 'Waschmittel „Blütenrein“',
  'Sonnenstudio Brutzel', 'Teppichhaus Flausch', 'Limonade „Sprudelkönig“',
  'Schuhhaus Quietsch', 'Kaugummi „Blubb“', 'Versandhaus Bestellfix',
];

export const STORIES = [
  'Bürgermeister bleibt im Paternoster stecken',
  'Kuh blockiert Autobahnauffahrt – Stau bis zum Horizont',
  'Schrebergarten-Krieg: Gartenzwerg entführt!',
  'Stadtwerke vertauschen Warm- und Kaltwasser',
  'Lottogewinner sucht seinen Schein im Altpapier',
  'Rentnerin überführt Trickbetrüger mit Nudelholz',
  'Sensation: Dackel gewinnt Windhundrennen',
  'Freibad eröffnet – Wasser vergessen',
  'Geheimes Rezept der Currywurst-Bude gestohlen',
  'Ufo über dem Baggersee? Es war ein Grill',
  'Stadtrat beschließt versehentlich Hitzefrei für alle',
  'Bäcker backt längste Brezel des Landkreises',
  'Papagei verrät Seitensprung im Live-Interview',
  'Kirchturmuhr geht seit 20 Jahren falsch – keiner merkt es',
  'Blaskapelle verläuft sich beim Festumzug',
  'Fußballtrainer wechselt sich selbst ein',
  'Feuerwehr rettet Katze, Katze rettet Feuerwehrmann',
  'Neuer Kreisverkehr hat keine Ausfahrt',
  'Schüler hackt Schulklingel: Dauerpause',
  'Zirkus vermisst Kamel – zuletzt gesehen an der Tankstelle',
];

export const TRANSMITTERS = [
  { name: 'Dachantenne', cov: 0.25, cost: 0, daily: 6000 },
  { name: 'Stadtsender', cov: 0.40, cost: 120000, daily: 11000 },
  { name: 'Regionalmast', cov: 0.60, cost: 350000, daily: 19000 },
  { name: 'Fernmeldeturm', cov: 0.80, cost: 800000, daily: 30000 },
  { name: 'Satelliten-Uplink', cov: 1.00, cost: 1800000, daily: 45000 },
];

export const RIVALS = [
  {
    name: 'Radio Schmalz', color: '#e86aa6', cov0: 0.45,
    fit: [1.0, 1.15, 1.1, 0.95, 0.85, 0.75],
    titles: ['Herzschmerz am Morgen', 'Die Kuschel-Charts', 'Tränen, Tulpen, Trompeten', 'Omas Wunschkonzert',
      'Schmuse-Express', 'Zwei Herzen im Dreivierteltakt', 'Schlagersahne', 'Träum weiter, Liebling'],
  },
  {
    name: 'Bass FM', color: '#5ad1e8', cov0: 0.45,
    fit: [0.9, 0.8, 0.85, 1.0, 1.15, 1.2],
    titles: ['Bumm Bumm Breakfast', 'Subwoofer-Sprechstunde', 'Volle Dröhnung', 'Tiefton-Terror',
      'Die Boxen-Beichte', 'Kellerclub live', '160 BPM bis der Arzt kommt', 'Nachtschicht Nonstop'],
  },
];

export const EVENTS = [
  { text: 'Hitzewelle! Alle liegen im Freibad – nachmittags hört kaum jemand Radio.', mod: { 3: 0.6 } },
  { text: 'Stadtfest! Abends dudelt überall das Radio.', mod: { 4: 1.4 } },
  { text: 'Mega-Stau auf dem Stadtring – die Frühschicht hat Hochkonjunktur.', mod: { 0: 1.35 } },
  { text: 'Dauerregen. Die Leute bleiben zu Hause am Radio.', all: 1.15 },
  { text: 'Länderspiel im Fernsehen! Abends ist das Radio abgemeldet.', mod: { 4: 0.6 } },
  { text: 'Stromausfall im Nordviertel – weniger Hörer den ganzen Tag.', all: 0.85 },
  { text: 'Schulfrei wegen Rohrbruch – vormittags hören die Kids mit.', mod: { 1: 1.4 } },
  { text: 'Vollmond. Die Stadt kann nicht schlafen – starke Nacht.', mod: { 5: 1.5 } },
];

export const TIPS = [
  'Comedy zieht morgens, Hörspiele abends und nachts. Der Sendeplatz ist die halbe Miete.',
  'Ein Werbespot zählt nur, wenn die Mindest-Hörerzahl erreicht wird. Sonst war er für die Katz.',
  'Wiederholungen nutzen Sendungen ab. Gönn ihnen mal einen Tag Pause.',
  'Ein Sendeloch ist das Schlimmste, was passieren kann. Der Chef hasst Sendelöcher.',
  'Mehr Reichweite bringt mehr Hörer – kostet aber jeden Tag Betriebsgeld.',
  'Nachrichten aus der Redaktion pushen alle Sendungen, die heute noch laufen.',
  'Plan den morgigen Tag schon heute. Um sechs Uhr früh geht es sofort los.',
  'Platzte Verträge kosten Strafe und Ruf. Lieber einen Auftrag weniger annehmen.',
  'Radio Schmalz ist vormittags stark, Bass FM nachts. Greif an, wo sie schwach sind.',
  'Durch den Ausgang machst du Feierabend – der Rest des Tages läuft im Schnelldurchlauf.',
];

export const BOSS_LINES = [
  [80, 'Prächtig! So stelle ich mir das vor. Weiter so, und die Goldene Antenne gehört uns.'],
  [60, 'Ordentliche Arbeit. Aber ruhen Sie sich bloß nicht aus.'],
  [40, 'Hm. Ich habe schon Schlechteres gehört. Aber auch schon viel Besseres.'],
  [20, 'Die Zahlen gefallen mir gar nicht. Ich beobachte Sie!'],
  [0, 'Noch so ein Tag, und Sie können beim Lokalanzeiger Kleinanzeigen tippen!'],
];
