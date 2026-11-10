// UI strings. Pick with ?lang=, the saved choice, or the device language; English otherwise.
const I18N = {
en: {
  events: "Events", theme: "Switch light/dark", share: "Share", install: "Install", language: "Language",
  credits: "Every public Rotaract event in Switzerland & Liechtenstein · made by Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Subscribe",
  skip_to: "Skip to events", search: "Search", search_ph: "Search events…", filters: "Filters",
  v_all: "Upcoming", v_near: "Near me", v_saved: "Saved ★", v_past: "Past",
  district: "District", clubs: "Clubs", all: "All", place_ph: "Near a place or postcode", locate: "Use my location",
  radius: "Radius", any_distance: "Any distance", clear: "Clear", layout: "Layout", list: "List", month: "Month", loading: "Loading events…",
  d1980: "D1980 · Central & North-West", d1990: "D1990 · West", d2000: "D2000 · East",
  one_event: "1 event", n_events: "{n} events",
  s_month: "{n} in {m}",
  within: "within {r} km of {place}", no_location: "{n} without a known location hidden",
  you: "you", your_location: "📍 Your location", place_nf: "Place not found", place_err: "Couldn't look up the place (offline?)", locating: "Locating…", loc_na: "Location not available", loc_none: "Location isn't available here",
  empty_saved: "Nothing saved yet. Tap the star on an event to keep it here.", empty: "No events match.", show_all: "Show all upcoming",
  members_only: "Members only", members_note: "This event is for members only. The full details and the registration are on Polaris after you log in.",
  all_day: "all day", cancelled: "Cancelled", save: "Save event", saved: "Saved ★", unsaved: "Removed from saved",
  no_desc: "No description on Polaris.", when: "When", where: "Where", registration: "Registration", club: "Club", register: "Register", add_cal: "Add to calendar", share_event: "Share",
  prev_month: "Previous month", next_month: "Next month", today: "Today", dow: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], all_in: "All events in {m}", no_day: "No events on this day.", n_on_day: "{n} events",
  sub_title: "Subscribe to a calendar", sub_text: "Puts the events into your phone's calendar and keeps them up to date by itself. One calendar per club, or one with every club in Switzerland & Liechtenstein.", sub_cta: "Choose calendars & see how",
  inst_title: "Install on your phone", inst_text: "Works like an app: an icon on your home screen, opens instantly, and shows the last events you saw even when you're offline. Nothing to download from an app store.",
  inst_btn: "Install app", inst_done: "✓ You're using the installed app.", ios: "iPhone / iPad", android: "Android", desktop: "Computer",
  g_ios: ["Open this page in Safari (other browsers can't install on iPhone).", "Tap the Share button (the square with an arrow, at the bottom).", "Scroll down and tap \"Add to Home Screen\", then \"Add\"."],
  g_android: ["Open this page in Chrome.", "Tap the ⋮ menu in the top right.", "Tap \"Add to Home screen\" or \"Install app\", then confirm."],
  g_desktop: ["Open this page in Chrome or Edge.", "Click the install icon at the right end of the address bar (a screen with an arrow).", "Click \"Install\". Or simply bookmark the page."],
  share_title: "Share with others", share_text: "Anyone with the link can use it right away in their browser, no installation needed.", copy: "Copy", copied: "Link copied", rerun: "Show the welcome steps again",
  share_app: "All Rotaract events in Switzerland & Liechtenstein",
  updated: "Updated {t}", members_only: "Members-only events aren't shown · Registration happens on Polaris", made_by: "Made by Jean-Michel Carrel for Rotaract Club Luzern", source: "Source & data on GitHub",
  ob_welcome: "Welcome 👋", ob_q: "Which clubs are you interested in?", ob_pre: "We pre-selected the nearest ones from your approximate location (no location access needed).", ob_pick: "Pick one or more, or keep all.",
  all_clubs: "All clubs", next: "Next", skip: "Skip", not_now: "Not now", done: "Done",
  ob_sub: "Subscribe to the calendar?", ob_sub_text: "Events then appear in your phone's calendar and stay up to date by themselves.", ob_or: "Or everything at once:", all_feed: "All Rotaract events in CH & LI (every club)", ob_help: "Step-by-step help: ", ob_help_link: "subscribe page",
  ob_inst: "Install as an app?", ob_inst_text: "An icon on your home screen, opens instantly, works offline. You can also do this later via \"Install\".", ob_installed: "✓ Already installed.", ob_showing: "Showing {clubs}", credit_short: "Made by Jean-Michel Carrel · Rotaract Club Luzern",
  apple: "Apple / Outlook", google: "Google", n_upcoming: " · {n} upcoming",
  stale: "Last updated {t}, may be out of date.", offline: "Couldn't load events. Are you online?", refresh: "Refresh",
  // subscribe page
  back: "‹ Back to events", sp_intro: "A subscription puts the events into the calendar app you already use and keeps them up to date by itself: new events appear, moved ones move, cancelled ones are marked. Nothing to install. Members-only events are not included; registration still happens on Polaris.",
  sp_ios: "iPhone / iPad (Apple Calendar)", sp_ios_s: ["Tap Apple / Outlook next to a calendar below.", "Confirm \"Subscribe\" in the dialog that opens.", "Done. It updates by itself (Settings › Calendar › Accounts lets you change how often)."],
  sp_google: "Google Calendar", sp_google_s: ["On a computer: click Google next to a calendar below and confirm \"Add calendar\".", "On a phone: tap Google and send the link to your computer. Google's phone apps cannot subscribe to a calendar themselves.", "Afterwards the calendar shows up in the Google Calendar app too. If it doesn't, open the app's Settings and switch it on. Google refreshes subscribed calendars every few hours up to a day."],
  sp_android: "Android (Samsung or other calendar apps)", sp_android_s: ["Subscribe with Google once on a computer (see Google Calendar above): most Android calendar apps show your Google calendars.", "Then enable the new calendar in your calendar app's settings."], sp_g_phone: "Google only lets you subscribe to a calendar from a computer, not from its phone apps. Send yourself the link, open it on a computer and confirm \"Add calendar\". The calendar then appears on your phone too.", sp_g_send: "Send me the link", sp_g_ios: "On an iPhone you can also subscribe right here with Apple Calendar:",
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Tap Apple / Outlook. On a Mac this opens Calendar; in Outlook choose \"Add calendar › Subscribe from web\".", "If nothing opens, copy the .ics link and paste it into \"Add calendar from URL\" in your calendar app."],
  sp_all: "Everything", sp_all_text: "One calendar with every public Rotaract event in Switzerland & Liechtenstein, all clubs together.", sp_all_feed: "All Rotaract events in Switzerland & Liechtenstein",
  sp_club: "Per club", sp_club_text: "Subscribe to the clubs you care about. You can add several.", national: "National",
  // club page
  cp_next: "Next events", cp_none: "No upcoming public events.", cp_site: "Club website", cp_all: "All events of this club in the app", cp_sub: "Subscribe to this club's calendar",
},
de: {
  events: "Events", theme: "Hell/Dunkel wechseln", share: "Teilen", install: "Installieren", language: "Sprache",
  credits: "Alle öffentlichen Rotaract-Anlässe der Schweiz & Liechtensteins · von Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Abonnieren",
  skip_to: "Zu den Anlässen", search: "Suche", search_ph: "Anlässe suchen…", filters: "Filter",
  v_all: "Demnächst", v_near: "In der Nähe", v_saved: "Gemerkt ★", v_past: "Vergangene",
  district: "Distrikt", clubs: "Clubs", all: "Alle", place_ph: "In der Nähe von Ort oder PLZ", locate: "Meinen Standort verwenden",
  radius: "Umkreis", any_distance: "Beliebige Distanz", clear: "Zurücksetzen", layout: "Ansicht", list: "Liste", month: "Monat", loading: "Anlässe werden geladen…",
  d1980: "D1980 · Zentral- & Nordwestschweiz", d1990: "D1990 · Westschweiz", d2000: "D2000 · Ostschweiz",
  one_event: "1 Anlass", n_events: "{n} Anlässe",
  s_month: "{n} im {m}",
  within: "im Umkreis von {r} km um {place}", no_location: "{n} ohne bekannten Ort ausgeblendet",
  you: "dir", your_location: "📍 Dein Standort", place_nf: "Ort nicht gefunden", place_err: "Ort konnte nicht gesucht werden (offline?)", locating: "Standort wird ermittelt…", loc_na: "Standort nicht verfügbar", loc_none: "Standort ist hier nicht verfügbar",
  empty_saved: "Noch nichts gemerkt. Tippe auf den Stern bei einem Anlass.", empty: "Keine passenden Anlässe.", show_all: "Alle kommenden anzeigen",
  members_only: "Nur für Mitglieder", members_note: "Dieser Anlass ist nur für Mitglieder. Alle Details und die Anmeldung gibt es auf Polaris nach dem Login.",
  all_day: "ganztags", cancelled: "Abgesagt", save: "Anlass merken", saved: "Gemerkt ★", unsaved: "Nicht mehr gemerkt",
  no_desc: "Keine Beschreibung auf Polaris.", when: "Wann", where: "Wo", registration: "Anmeldung", club: "Club", register: "Anmelden", add_cal: "In Kalender", share_event: "Teilen",
  prev_month: "Vorheriger Monat", next_month: "Nächster Monat", today: "Heute", dow: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], all_in: "Alle Anlässe im {m}", no_day: "Keine Anlässe an diesem Tag.", n_on_day: "{n} Anlässe",
  sub_title: "Kalender abonnieren", sub_text: "Die Anlässe erscheinen im Kalender deines Handys und bleiben von selbst aktuell. Ein Kalender pro Club oder einer mit allen Clubs der Schweiz & Liechtensteins.", sub_cta: "Kalender wählen & Anleitung",
  inst_title: "Auf dem Handy installieren", inst_text: "Funktioniert wie eine App: ein Icon auf dem Homescreen, öffnet sofort und zeigt die zuletzt geladenen Anlässe auch offline. Nichts aus einem App Store laden.",
  inst_btn: "App installieren", inst_done: "✓ Du nutzt die installierte App.", ios: "iPhone / iPad", android: "Android", desktop: "Computer",
  g_ios: ["Diese Seite in Safari öffnen (andere Browser können auf dem iPhone nicht installieren).", "Auf Teilen tippen (das Quadrat mit Pfeil, unten).", "Nach unten scrollen, «Zum Home-Bildschirm» und dann «Hinzufügen» tippen."],
  g_android: ["Diese Seite in Chrome öffnen.", "Oben rechts auf das ⋮-Menü tippen.", "«Zum Startbildschirm hinzufügen» oder «App installieren» tippen und bestätigen."],
  g_desktop: ["Diese Seite in Chrome oder Edge öffnen.", "Rechts in der Adressleiste auf das Installieren-Symbol klicken (Bildschirm mit Pfeil).", "«Installieren» klicken. Oder die Seite einfach als Lesezeichen speichern."],
  share_title: "Mit anderen teilen", share_text: "Wer den Link hat, kann die Seite sofort im Browser nutzen, ohne Installation.", copy: "Kopieren", copied: "Link kopiert", rerun: "Willkommensschritte nochmals anzeigen",
  share_app: "Alle Rotaract-Anlässe der Schweiz & Liechtensteins",
  updated: "Aktualisiert {t}", members_only: "Anlässe nur für Mitglieder werden nicht angezeigt · Anmeldung auf Polaris", made_by: "Von Jean-Michel Carrel für den Rotaract Club Luzern", source: "Quellcode & Daten auf GitHub",
  ob_welcome: "Willkommen 👋", ob_q: "Welche Clubs interessieren dich?", ob_pre: "Die nächsten haben wir anhand deines ungefähren Standorts vorausgewählt (ohne Standortfreigabe).", ob_pick: "Wähle einen oder mehrere, oder behalte alle.",
  all_clubs: "Alle Clubs", next: "Weiter", skip: "Überspringen", not_now: "Jetzt nicht", done: "Fertig",
  ob_sub: "Kalender abonnieren?", ob_sub_text: "Die Anlässe erscheinen dann im Kalender deines Handys und bleiben von selbst aktuell.", ob_or: "Oder alles auf einmal:", all_feed: "Alle Rotaract-Anlässe CH & LI (alle Clubs)", ob_help: "Schritt-für-Schritt-Anleitung: ", ob_help_link: "Abo-Seite",
  ob_inst: "Als App installieren?", ob_inst_text: "Ein Icon auf dem Homescreen, öffnet sofort, funktioniert offline. Geht auch später über «Installieren».", ob_installed: "✓ Bereits installiert.", ob_showing: "Zeige {clubs}", credit_short: "Von Jean-Michel Carrel · Rotaract Club Luzern",
  apple: "Apple / Outlook", google: "Google", n_upcoming: " · {n} kommende",
  stale: "Stand {t}, möglicherweise veraltet.", offline: "Anlässe konnten nicht geladen werden. Bist du online?", refresh: "Neu laden",
  back: "‹ Zurück zu den Anlässen", sp_intro: "Ein Abo bringt die Anlässe in die Kalender-App, die du schon nutzt, und hält sie von selbst aktuell: neue Anlässe erscheinen, verschobene wandern mit, abgesagte werden markiert. Nichts zu installieren. Anlässe nur für Mitglieder sind nicht enthalten; die Anmeldung läuft weiterhin über Polaris.",
  sp_ios: "iPhone / iPad (Apple Kalender)", sp_ios_s: ["Bei einem Kalender unten auf Apple / Outlook tippen.", "Im Dialog «Abonnieren» bestätigen.", "Fertig. Aktualisiert sich von selbst (unter Einstellungen › Kalender › Accounts lässt sich das Intervall ändern)."],
  sp_google: "Google Kalender", sp_google_s: ["Am Computer: bei einem Kalender unten auf Google klicken und «Kalender hinzufügen» bestätigen.", "Auf dem Handy: auf Google tippen und den Link an deinen Computer schicken. Die Handy-Apps von Google können selbst keinen Kalender abonnieren.", "Danach erscheint der Kalender auch in der Google-Kalender-App. Falls nicht, in den Einstellungen der App einschalten. Google aktualisiert abonnierte Kalender alle paar Stunden bis zu einem Tag."],
  sp_android: "Android (Samsung oder andere Kalender-Apps)", sp_android_s: ["Einmal am Computer mit Google abonnieren (siehe Google Kalender oben): die meisten Android-Kalender zeigen deine Google-Kalender.", "Danach den neuen Kalender in den Einstellungen der Kalender-App aktivieren."], sp_g_phone: "Google lässt Kalender nur am Computer abonnieren, nicht in den Handy-Apps. Schick dir den Link, öffne ihn am Computer und bestätige «Kalender hinzufügen». Der Kalender erscheint danach auch auf dem Handy.", sp_g_send: "Link an mich schicken", sp_g_ios: "Auf dem iPhone kannst du auch gleich hier mit Apple Kalender abonnieren:",
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Auf Apple / Outlook tippen. Auf dem Mac öffnet sich Kalender; in Outlook «Kalender hinzufügen › Aus dem Internet abonnieren» wählen.", "Falls sich nichts öffnet: den .ics-Link kopieren und in der Kalender-App unter «Kalender per URL hinzufügen» einfügen."],
  sp_all: "Alles", sp_all_text: "Ein Kalender mit allen öffentlichen Rotaract-Anlässen der Schweiz & Liechtensteins, alle Clubs zusammen.", sp_all_feed: "Alle Rotaract-Anlässe der Schweiz & Liechtensteins",
  sp_club: "Pro Club", sp_club_text: "Abonniere die Clubs, die dich interessieren. Mehrere sind möglich.", national: "National",
  cp_next: "Nächste Anlässe", cp_none: "Keine kommenden öffentlichen Anlässe.", cp_site: "Club-Website", cp_all: "Alle Anlässe dieses Clubs in der App", cp_sub: "Kalender dieses Clubs abonnieren",
},
fr: {
  events: "Événements", theme: "Mode clair/sombre", share: "Partager", install: "Installer", language: "Langue",
  credits: "Tous les événements Rotaract publics de Suisse & du Liechtenstein · par Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "S'abonner",
  skip_to: "Aller aux événements", search: "Recherche", search_ph: "Chercher…", filters: "Filtres",
  v_all: "À venir", v_near: "Près de moi", v_saved: "Enregistrés ★", v_past: "Passés",
  district: "District", clubs: "Clubs", all: "Tous", place_ph: "Près d'un lieu ou NPA", locate: "Utiliser ma position",
  radius: "Rayon", any_distance: "Toute distance", clear: "Effacer", layout: "Affichage", list: "Liste", month: "Mois", loading: "Chargement des événements…",
  d1980: "D1980 · Centre & Nord-Ouest", d1990: "D1990 · Romandie", d2000: "D2000 · Est",
  one_event: "1 événement", n_events: "{n} événements",
  s_month: "{n} en {m}",
  within: "à moins de {r} km de {place}", no_location: "{n} sans lieu connu masqués",
  you: "vous", your_location: "📍 Votre position", place_nf: "Lieu introuvable", place_err: "Recherche du lieu impossible (hors ligne ?)", locating: "Localisation…", loc_na: "Position indisponible", loc_none: "La position n'est pas disponible ici",
  empty_saved: "Rien d'enregistré. Touchez l'étoile d'un événement pour le garder ici.", empty: "Aucun événement ne correspond.", show_all: "Afficher tout ce qui vient",
  members_only: "Réservé aux membres", members_note: "Cet événement est réservé aux membres. Tous les détails et l'inscription se trouvent sur Polaris après connexion.",
  all_day: "toute la journée", cancelled: "Annulé", save: "Enregistrer l'événement", saved: "Enregistré ★", unsaved: "Retiré des enregistrés",
  no_desc: "Pas de description sur Polaris.", when: "Quand", where: "Où", registration: "Inscription", club: "Club", register: "S'inscrire", add_cal: "Ajouter au calendrier", share_event: "Partager",
  prev_month: "Mois précédent", next_month: "Mois suivant", today: "Aujourd'hui", dow: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], all_in: "Tous les événements en {m}", no_day: "Aucun événement ce jour-là.", n_on_day: "{n} événements",
  sub_title: "S'abonner à un calendrier", sub_text: "Les événements apparaissent dans le calendrier de votre téléphone et restent à jour tout seuls. Un calendrier par club, ou un seul avec tous les clubs de Suisse & du Liechtenstein.", sub_cta: "Choisir des calendriers & voir comment",
  inst_title: "Installer sur votre téléphone", inst_text: "Fonctionne comme une app : une icône sur l'écran d'accueil, s'ouvre instantanément et montre les derniers événements même hors ligne. Rien à télécharger depuis un store.",
  inst_btn: "Installer l'app", inst_done: "✓ Vous utilisez l'app installée.", ios: "iPhone / iPad", android: "Android", desktop: "Ordinateur",
  g_ios: ["Ouvrez cette page dans Safari (les autres navigateurs ne peuvent pas installer sur iPhone).", "Touchez Partager (le carré avec une flèche, en bas).", "Faites défiler et touchez « Sur l'écran d'accueil », puis « Ajouter »."],
  g_android: ["Ouvrez cette page dans Chrome.", "Touchez le menu ⋮ en haut à droite.", "Touchez « Ajouter à l'écran d'accueil » ou « Installer l'application », puis confirmez."],
  g_desktop: ["Ouvrez cette page dans Chrome ou Edge.", "Cliquez sur l'icône d'installation à droite de la barre d'adresse (un écran avec une flèche).", "Cliquez sur « Installer ». Ou ajoutez simplement la page aux favoris."],
  share_title: "Partager", share_text: "Toute personne ayant le lien peut l'utiliser tout de suite dans son navigateur, sans installation.", copy: "Copier", copied: "Lien copié", rerun: "Revoir les étapes de bienvenue",
  share_app: "Tous les événements Rotaract de Suisse & du Liechtenstein",
  updated: "Mis à jour {t}", members_only: "Les événements réservés aux membres ne sont pas affichés · Inscription sur Polaris", made_by: "Par Jean-Michel Carrel pour le Rotaract Club Luzern", source: "Code source & données sur GitHub",
  ob_welcome: "Bienvenue 👋", ob_q: "Quels clubs vous intéressent ?", ob_pre: "Nous avons présélectionné les plus proches d'après votre position approximative (sans accès à la localisation).", ob_pick: "Choisissez-en un ou plusieurs, ou gardez tout.",
  all_clubs: "Tous les clubs", next: "Suivant", skip: "Passer", not_now: "Pas maintenant", done: "Terminé",
  ob_sub: "S'abonner au calendrier ?", ob_sub_text: "Les événements apparaissent alors dans le calendrier de votre téléphone et restent à jour tout seuls.", ob_or: "Ou tout d'un coup :", all_feed: "Tous les événements Rotaract CH & LI (tous les clubs)", ob_help: "Aide pas à pas : ", ob_help_link: "page d'abonnement",
  ob_inst: "Installer comme app ?", ob_inst_text: "Une icône sur l'écran d'accueil, s'ouvre instantanément, fonctionne hors ligne. Possible aussi plus tard via « Installer ».", ob_installed: "✓ Déjà installée.", ob_showing: "Affichage : {clubs}", credit_short: "Par Jean-Michel Carrel · Rotaract Club Luzern",
  apple: "Apple / Outlook", google: "Google", n_upcoming: " · {n} à venir",
  stale: "Dernière mise à jour {t}, peut-être obsolète.", offline: "Impossible de charger les événements. Êtes-vous en ligne ?", refresh: "Recharger",
  back: "‹ Retour aux événements", sp_intro: "Un abonnement place les événements dans l'app de calendrier que vous utilisez déjà et les garde à jour tout seul : les nouveaux apparaissent, les déplacés bougent, les annulés sont marqués. Rien à installer. Les événements réservés aux membres ne sont pas inclus ; l'inscription se fait toujours sur Polaris.",
  sp_ios: "iPhone / iPad (Calendrier Apple)", sp_ios_s: ["Touchez Apple / Outlook à côté d'un calendrier ci-dessous.", "Confirmez « S'abonner » dans la fenêtre qui s'ouvre.", "C'est fait. Il se met à jour tout seul (Réglages › Calendrier › Comptes permet de changer la fréquence)."],
  sp_google: "Google Agenda", sp_google_s: ["Sur ordinateur : cliquez sur Google à côté d'un calendrier ci-dessous et confirmez « Ajouter l'agenda ».", "Sur téléphone : touchez Google et envoyez le lien à votre ordinateur. Les apps mobiles de Google ne peuvent pas s'abonner elles-mêmes à un calendrier.", "Le calendrier apparaît ensuite aussi dans l'app Google Agenda. Sinon, activez-le dans les paramètres de l'app. Google actualise les calendriers abonnés toutes les quelques heures, jusqu'à un jour."],
  sp_android: "Android (Samsung ou autres apps de calendrier)", sp_android_s: ["Abonnez-vous une fois avec Google sur un ordinateur (voir Google Agenda ci-dessus) : la plupart des apps de calendrier Android affichent vos agendas Google.", "Activez ensuite le nouveau calendrier dans les paramètres de votre app de calendrier."], sp_g_phone: "Google ne permet de s'abonner à un calendrier que sur ordinateur, pas dans ses apps mobiles. Envoyez-vous le lien, ouvrez-le sur un ordinateur et confirmez « Ajouter l'agenda ». Le calendrier apparaît ensuite aussi sur votre téléphone.", sp_g_send: "M'envoyer le lien", sp_g_ios: "Sur iPhone, vous pouvez aussi vous abonner directement ici avec Calendrier Apple :",
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Touchez Apple / Outlook. Sur Mac, Calendrier s'ouvre ; dans Outlook, choisissez « Ajouter un calendrier › S'abonner depuis le web ».", "Si rien ne s'ouvre, copiez le lien .ics et collez-le dans « Ajouter un calendrier par URL » de votre app."],
  sp_all: "Tout", sp_all_text: "Un calendrier avec tous les événements Rotaract publics de Suisse & du Liechtenstein, tous les clubs ensemble.", sp_all_feed: "Tous les événements Rotaract de Suisse & du Liechtenstein",
  sp_club: "Par club", sp_club_text: "Abonnez-vous aux clubs qui vous intéressent. Plusieurs sont possibles.", national: "National",
  cp_next: "Prochains événements", cp_none: "Aucun événement public à venir.", cp_site: "Site du club", cp_all: "Tous les événements de ce club dans l'app", cp_sub: "S'abonner au calendrier de ce club",
},
it: {
  events: "Eventi", theme: "Chiaro/scuro", share: "Condividi", install: "Installa", language: "Lingua",
  credits: "Tutti gli eventi Rotaract pubblici di Svizzera e Liechtenstein · di Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Abbonati",
  skip_to: "Vai agli eventi", search: "Cerca", search_ph: "Cerca eventi…", filters: "Filtri",
  v_all: "Prossimi", v_near: "Vicino a me", v_saved: "Salvati ★", v_past: "Passati",
  district: "Distretto", clubs: "Club", all: "Tutti", place_ph: "Vicino a un luogo o NPA", locate: "Usa la mia posizione",
  radius: "Raggio", any_distance: "Qualsiasi distanza", clear: "Azzera", layout: "Vista", list: "Lista", month: "Mese", loading: "Caricamento eventi…",
  d1980: "D1980 · Centro & Nord-Ovest", d1990: "D1990 · Ovest", d2000: "D2000 · Est",
  one_event: "1 evento", n_events: "{n} eventi",
  s_month: "{n} a {m}",
  within: "entro {r} km da {place}", no_location: "{n} senza luogo noto nascosti",
  you: "te", your_location: "📍 La tua posizione", place_nf: "Luogo non trovato", place_err: "Impossibile cercare il luogo (offline?)", locating: "Localizzazione…", loc_na: "Posizione non disponibile", loc_none: "La posizione non è disponibile qui",
  empty_saved: "Nulla di salvato. Tocca la stella di un evento per tenerlo qui.", empty: "Nessun evento corrisponde.", show_all: "Mostra tutti i prossimi",
  members_only: "Solo per soci", members_note: "Questo evento è riservato ai soci. Tutti i dettagli e l'iscrizione sono su Polaris dopo il login.",
  all_day: "tutto il giorno", cancelled: "Annullato", save: "Salva evento", saved: "Salvato ★", unsaved: "Rimosso dai salvati",
  no_desc: "Nessuna descrizione su Polaris.", when: "Quando", where: "Dove", registration: "Iscrizione", club: "Club", register: "Iscriviti", add_cal: "Aggiungi al calendario", share_event: "Condividi",
  prev_month: "Mese precedente", next_month: "Mese successivo", today: "Oggi", dow: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], all_in: "Tutti gli eventi di {m}", no_day: "Nessun evento in questo giorno.", n_on_day: "{n} eventi",
  sub_title: "Abbonati a un calendario", sub_text: "Gli eventi compaiono nel calendario del tuo telefono e restano aggiornati da soli. Un calendario per club, o uno con tutti i club di Svizzera e Liechtenstein.", sub_cta: "Scegli i calendari e scopri come",
  inst_title: "Installa sul telefono", inst_text: "Funziona come un'app: un'icona nella schermata iniziale, si apre subito e mostra gli ultimi eventi anche offline. Niente da scaricare da uno store.",
  inst_btn: "Installa l'app", inst_done: "✓ Stai usando l'app installata.", ios: "iPhone / iPad", android: "Android", desktop: "Computer",
  g_ios: ["Apri questa pagina in Safari (altri browser non possono installare su iPhone).", "Tocca Condividi (il quadrato con la freccia, in basso).", "Scorri e tocca «Aggiungi alla schermata Home», poi «Aggiungi»."],
  g_android: ["Apri questa pagina in Chrome.", "Tocca il menu ⋮ in alto a destra.", "Tocca «Aggiungi a schermata Home» o «Installa app», poi conferma."],
  g_desktop: ["Apri questa pagina in Chrome o Edge.", "Clicca l'icona di installazione a destra nella barra degli indirizzi (uno schermo con una freccia).", "Clicca «Installa». Oppure aggiungi la pagina ai preferiti."],
  share_title: "Condividi con altri", share_text: "Chi ha il link può usarla subito nel browser, senza installare nulla.", copy: "Copia", copied: "Link copiato", rerun: "Mostra di nuovo i passi di benvenuto",
  share_app: "Tutti gli eventi Rotaract di Svizzera e Liechtenstein",
  updated: "Aggiornato {t}", members_only: "Gli eventi riservati ai soci non sono mostrati · Iscrizione su Polaris", made_by: "Di Jean-Michel Carrel per il Rotaract Club Luzern", source: "Codice e dati su GitHub",
  ob_welcome: "Benvenuto 👋", ob_q: "Quali club ti interessano?", ob_pre: "Abbiamo preselezionato i più vicini in base alla tua posizione approssimativa (senza accesso alla posizione).", ob_pick: "Scegline uno o più, oppure tienili tutti.",
  all_clubs: "Tutti i club", next: "Avanti", skip: "Salta", not_now: "Non ora", done: "Fatto",
  ob_sub: "Abbonarti al calendario?", ob_sub_text: "Gli eventi compaiono poi nel calendario del tuo telefono e restano aggiornati da soli.", ob_or: "Oppure tutto insieme:", all_feed: "Tutti gli eventi Rotaract CH & LI (tutti i club)", ob_help: "Guida passo per passo: ", ob_help_link: "pagina abbonamenti",
  ob_inst: "Installare come app?", ob_inst_text: "Un'icona nella schermata iniziale, si apre subito, funziona offline. Puoi farlo anche dopo da «Installa».", ob_installed: "✓ Già installata.", ob_showing: "Mostro {clubs}", credit_short: "Di Jean-Michel Carrel · Rotaract Club Luzern",
  apple: "Apple / Outlook", google: "Google", n_upcoming: " · {n} in arrivo",
  stale: "Ultimo aggiornamento {t}, forse non attuale.", offline: "Impossibile caricare gli eventi. Sei online?", refresh: "Ricarica",
  back: "‹ Torna agli eventi", sp_intro: "Un abbonamento mette gli eventi nell'app calendario che già usi e li tiene aggiornati da solo: i nuovi compaiono, quelli spostati si spostano, quelli annullati vengono segnati. Niente da installare. Gli eventi riservati ai soci non sono inclusi; l'iscrizione avviene sempre su Polaris.",
  sp_ios: "iPhone / iPad (Calendario Apple)", sp_ios_s: ["Tocca Apple / Outlook accanto a un calendario qui sotto.", "Conferma «Iscriviti» nella finestra che si apre.", "Fatto. Si aggiorna da solo (in Impostazioni › Calendario › Account puoi cambiare la frequenza)."],
  sp_google: "Google Calendar", sp_google_s: ["Al computer: clicca su Google accanto a un calendario qui sotto e conferma «Aggiungi calendario».", "Sul telefono: tocca Google e invia il link al tuo computer. Le app di Google per telefono non possono abbonarsi da sole a un calendario.", "Poi il calendario compare anche nell'app Google Calendar. Se non compare, attivalo nelle impostazioni dell'app. Google aggiorna i calendari in abbonamento ogni poche ore, fino a un giorno."],
  sp_android: "Android (Samsung o altre app calendario)", sp_android_s: ["Abbonati una volta con Google da un computer (vedi Google Calendar sopra): la maggior parte delle app calendario Android mostra i tuoi calendari Google.", "Poi attiva il nuovo calendario nelle impostazioni della tua app calendario."], sp_g_phone: "Google permette di abbonarsi a un calendario solo dal computer, non dalle sue app per telefono. Inviati il link, aprilo su un computer e conferma «Aggiungi calendario». Il calendario comparirà poi anche sul telefono.", sp_g_send: "Inviami il link", sp_g_ios: "Su iPhone puoi anche abbonarti direttamente qui con Calendario Apple:",
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Tocca Apple / Outlook. Su Mac si apre Calendario; in Outlook scegli «Aggiungi calendario › Iscriviti dal web».", "Se non si apre nulla, copia il link .ics e incollalo in «Aggiungi calendario da URL» della tua app."],
  sp_all: "Tutto", sp_all_text: "Un calendario con tutti gli eventi Rotaract pubblici di Svizzera e Liechtenstein, tutti i club insieme.", sp_all_feed: "Tutti gli eventi Rotaract di Svizzera e Liechtenstein",
  sp_club: "Per club", sp_club_text: "Abbonati ai club che ti interessano. Puoi aggiungerne diversi.", national: "Nazionale",
  cp_next: "Prossimi eventi", cp_none: "Nessun evento pubblico in arrivo.", cp_site: "Sito del club", cp_all: "Tutti gli eventi di questo club nell'app", cp_sub: "Abbonati al calendario di questo club",
},
};
const LANGS = { de: "Deutsch", fr: "Français", it: "Italiano", en: "English" };
const LOCALES = { de: "de-CH", fr: "fr-CH", it: "it-CH", en: "en-GB" };
function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  let saved = null; try { saved = JSON.parse(localStorage.getItem("rac.lang")); } catch {}
  const dev = (navigator.language || "en").slice(0, 2);
  return [q, saved, dev].find(l => l && I18N[l]) || "en";
}
const LANG = pickLang();
const LOCALE = LOCALES[LANG];
document.documentElement.lang = LANG;
// t("key", {n: 3}) fills {n}; missing keys fall back to English, then to the key itself.
function t(key, vars) {
  let s = I18N[LANG][key] ?? I18N.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
function nEvents(n) { return n === 1 ? t("one_event") : t("n_events", { n }); }
// Static text: <el data-t="key">, placeholders via data-t-ph, aria-labels via data-t-label, titles via data-t-title.
function applyI18n(root = document) {
  for (const n of root.querySelectorAll("[data-t]")) n.textContent = t(n.dataset.t);
  for (const n of root.querySelectorAll("[data-t-ph]")) n.placeholder = t(n.dataset.tPh);
  for (const n of root.querySelectorAll("[data-t-label]")) n.setAttribute("aria-label", t(n.dataset.tLabel));
  for (const n of root.querySelectorAll("[data-t-title]")) n.title = t(n.dataset.tTitle);
}
function langSelect() {
  const s = document.createElement("select");
  s.className = "lang"; s.setAttribute("aria-label", t("language"));
  for (const [k, v] of Object.entries(LANGS)) { const o = document.createElement("option"); o.value = k; o.textContent = k.toUpperCase(); o.title = v; s.append(o); }
  s.value = LANG;
  s.addEventListener("change", () => { try { localStorage.setItem("rac.lang", JSON.stringify(s.value)); } catch {} const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.href; });
  return s;
}

// settings, scope, about page
Object.assign(I18N.en, {
  info: "This app", settings: "Settings", my_clubs: "My clubs", everything: "Everything", main_club: "Main club", also_show: "Also show", none: "None",
  set_hint: "Your main club and the clubs you also follow make up the \"My clubs\" view. Searching and filtering never changes this.",
  theme_light: "Light", theme_dark: "Dark", change: "Change", home_banner: "Your clubs", no_home: "No main club chosen yet",
  ob_main: "Your main club", ob_also: "Also interested in",
  ab_title: "What is Rotaract?", ab_lead: "Rotaract is the Rotary community for young adults (roughly 18 to 30): local clubs that organise service projects, talks, company visits and plenty of social events, and that belong to a worldwide network.",
  ab_f_clubs: "clubs in Switzerland & Liechtenstein", ab_f_events: "public events in the last 12 months", ab_f_upcoming: "upcoming events", ab_f_world: "clubs worldwide",
  ab_q1: "Who can join?", ab_a1: "Anyone aged about 18 to 30 who likes the idea of doing something useful with friends. You don't need to know a Rotarian; just come to an event and say hello.",
  ab_q2: "What do clubs do?", ab_a2: "Three things: service (hands-on projects and fundraising for good causes), personal and professional development (talks, company visits, workshops) and friendship (Stamm, dinners, trips, the yearly conference). Every club mixes these a bit differently.",
  ab_q3: "What does it cost?", ab_a3: "A yearly membership fee, typically a few hundred francs, which covers the club's activities. Events have their own, usually small, costs. Guests can usually join events for free or at cost.",
  ab_q4: "How does Rotaract relate to Rotary?", ab_a4: "Rotary International is the parent organisation; every Rotaract club is sponsored by a Rotary club. Rotaract was founded in 1968 and now has about 10,000 clubs in more than 180 countries.",
  ab_q5: "How do I start?", ab_a5: "Pick an event from the list, register on Polaris (the clubs' website) and come along. After a few visits the club will invite you to become a member.",
  ab_find: "Find a club near you", ab_find_ph: "Your town or postcode", ab_find_btn: "Search", ab_nearest: "Nearest clubs", ab_join: "Not sure which club? Write to the national team at join.rotaract.ch.",
  ab_share: "Share this page", ab_events_cta: "See all events",
});
Object.assign(I18N.de, {
  info: "Die App", settings: "Einstellungen", my_clubs: "Meine Clubs", everything: "Alles", main_club: "Hauptclub", also_show: "Auch anzeigen", none: "Keiner",
  set_hint: "Dein Hauptclub und die Clubs, denen du auch folgst, bilden die Ansicht «Meine Clubs». Suchen und Filtern ändert das nie.",
  theme_light: "Hell", theme_dark: "Dunkel", change: "Ändern", home_banner: "Deine Clubs", no_home: "Noch kein Hauptclub gewählt",
  ob_main: "Dein Hauptclub", ob_also: "Auch interessiert an",
  ab_title: "Was ist Rotaract?", ab_lead: "Rotaract ist die Rotary-Community für junge Erwachsene (etwa 18 bis 30): lokale Clubs, die Sozialprojekte, Vorträge, Firmenbesuche und viele gesellige Anlässe organisieren und zu einem weltweiten Netzwerk gehören.",
  ab_f_clubs: "Clubs in der Schweiz & Liechtenstein", ab_f_events: "öffentliche Anlässe in den letzten 12 Monaten", ab_f_upcoming: "kommende Anlässe", ab_f_world: "Clubs weltweit",
  ab_q1: "Wer kann mitmachen?", ab_a1: "Alle zwischen etwa 18 und 30, die Lust haben, mit Freunden etwas Sinnvolles zu tun. Du musst niemanden bei Rotary kennen: komm einfach an einen Anlass und sag Hallo.",
  ab_q2: "Was machen die Clubs?", ab_a2: "Drei Dinge: Service (Hands-on-Projekte und Spendensammeln für gute Zwecke), persönliche und berufliche Entwicklung (Vorträge, Firmenbesuche, Workshops) und Freundschaft (Stamm, Essen, Reisen, die jährliche Konferenz). Jeder Club mischt das etwas anders.",
  ab_q3: "Was kostet es?", ab_a3: "Ein Jahresbeitrag, meist ein paar hundert Franken, der die Clubaktivitäten deckt. Anlässe haben eigene, meist kleine Kosten. Gäste können in der Regel gratis oder zum Selbstkostenpreis mitkommen.",
  ab_q4: "Wie hängt Rotaract mit Rotary zusammen?", ab_a4: "Rotary International ist die Dachorganisation; jeder Rotaract Club wird von einem Rotary Club gesponsert. Rotaract wurde 1968 gegründet und hat heute rund 10'000 Clubs in über 180 Ländern.",
  ab_q5: "Wie fange ich an?", ab_a5: "Such dir einen Anlass aus der Liste, melde dich auf Polaris (der Website der Clubs) an und komm vorbei. Nach ein paar Besuchen lädt dich der Club ein, Mitglied zu werden.",
  ab_find: "Finde einen Club in deiner Nähe", ab_find_ph: "Dein Ort oder deine PLZ", ab_find_btn: "Suchen", ab_nearest: "Nächste Clubs", ab_join: "Unsicher, welcher Club? Schreib dem nationalen Team auf join.rotaract.ch.",
  ab_share: "Diese Seite teilen", ab_events_cta: "Alle Anlässe ansehen",
});
Object.assign(I18N.fr, {
  info: "L'app", settings: "Réglages", my_clubs: "Mes clubs", everything: "Tout", main_club: "Club principal", also_show: "Afficher aussi", none: "Aucun",
  set_hint: "Votre club principal et les clubs que vous suivez forment la vue « Mes clubs ». Chercher et filtrer ne change jamais cela.",
  theme_light: "Clair", theme_dark: "Sombre", change: "Modifier", home_banner: "Vos clubs", no_home: "Aucun club principal choisi",
  ob_main: "Votre club principal", ob_also: "Aussi intéressé par",
  ab_title: "Qu'est-ce que Rotaract ?", ab_lead: "Rotaract est la communauté Rotary des jeunes adultes (environ 18 à 30 ans) : des clubs locaux qui organisent des projets sociaux, des conférences, des visites d'entreprises et beaucoup d'événements conviviaux, au sein d'un réseau mondial.",
  ab_f_clubs: "clubs en Suisse & au Liechtenstein", ab_f_events: "événements publics ces 12 derniers mois", ab_f_upcoming: "événements à venir", ab_f_world: "clubs dans le monde",
  ab_q1: "Qui peut participer ?", ab_a1: "Toute personne d'environ 18 à 30 ans qui a envie de faire quelque chose d'utile entre amis. Pas besoin de connaître un Rotarien : venez à un événement et dites bonjour.",
  ab_q2: "Que font les clubs ?", ab_a2: "Trois choses : le service (projets concrets et collectes pour de bonnes causes), le développement personnel et professionnel (conférences, visites d'entreprises, ateliers) et l'amitié (stamm, repas, voyages, la conférence annuelle). Chaque club mélange cela à sa façon.",
  ab_q3: "Combien ça coûte ?", ab_a3: "Une cotisation annuelle, en général quelques centaines de francs, qui couvre les activités du club. Les événements ont leurs propres coûts, souvent modestes. Les invités participent en général gratuitement ou à prix coûtant.",
  ab_q4: "Quel lien avec le Rotary ?", ab_a4: "Le Rotary International est l'organisation faîtière ; chaque club Rotaract est parrainé par un Rotary club. Rotaract a été fondé en 1968 et compte aujourd'hui environ 10 000 clubs dans plus de 180 pays.",
  ab_q5: "Comment commencer ?", ab_a5: "Choisissez un événement dans la liste, inscrivez-vous sur Polaris (le site des clubs) et venez. Après quelques visites, le club vous proposera de devenir membre.",
  ab_find: "Trouver un club près de chez vous", ab_find_ph: "Votre localité ou NPA", ab_find_btn: "Chercher", ab_nearest: "Clubs les plus proches", ab_join: "Pas sûr du club ? Écrivez à l'équipe nationale sur join.rotaract.ch.",
  ab_share: "Partager cette page", ab_events_cta: "Voir tous les événements",
});
Object.assign(I18N.it, {
  info: "L'app", settings: "Impostazioni", my_clubs: "I miei club", everything: "Tutto", main_club: "Club principale", also_show: "Mostra anche", none: "Nessuno",
  set_hint: "Il tuo club principale e i club che segui formano la vista «I miei club». Cercare e filtrare non la cambia mai.",
  theme_light: "Chiaro", theme_dark: "Scuro", change: "Modifica", home_banner: "I tuoi club", no_home: "Nessun club principale scelto",
  ob_main: "Il tuo club principale", ob_also: "Interessato anche a",
  ab_title: "Cos'è Rotaract?", ab_lead: "Rotaract è la comunità Rotary dei giovani adulti (circa 18–30 anni): club locali che organizzano progetti sociali, conferenze, visite aziendali e tanti eventi conviviali, parte di una rete mondiale.",
  ab_f_clubs: "club in Svizzera e Liechtenstein", ab_f_events: "eventi pubblici negli ultimi 12 mesi", ab_f_upcoming: "eventi in arrivo", ab_f_world: "club nel mondo",
  ab_q1: "Chi può partecipare?", ab_a1: "Chiunque abbia circa 18–30 anni e voglia fare qualcosa di utile con amici. Non serve conoscere un rotariano: vieni a un evento e saluta.",
  ab_q2: "Cosa fanno i club?", ab_a2: "Tre cose: servizio (progetti concreti e raccolte fondi per buone cause), crescita personale e professionale (conferenze, visite aziendali, workshop) e amicizia (stamm, cene, viaggi, la conferenza annuale). Ogni club le combina a modo suo.",
  ab_q3: "Quanto costa?", ab_a3: "Una quota annuale, di solito qualche centinaio di franchi, che copre le attività del club. Gli eventi hanno costi propri, in genere contenuti. Gli ospiti partecipano di solito gratis o a prezzo di costo.",
  ab_q4: "Che rapporto c'è con il Rotary?", ab_a4: "Il Rotary International è l'organizzazione madre; ogni club Rotaract è sponsorizzato da un Rotary club. Rotaract è nato nel 1968 e oggi conta circa 10'000 club in oltre 180 paesi.",
  ab_q5: "Come inizio?", ab_a5: "Scegli un evento dalla lista, iscriviti su Polaris (il sito dei club) e vieni. Dopo qualche visita il club ti inviterà a diventare socio.",
  ab_find: "Trova un club vicino a te", ab_find_ph: "La tua località o NPA", ab_find_btn: "Cerca", ab_nearest: "Club più vicini", ab_join: "Non sai quale club? Scrivi al team nazionale su join.rotaract.ch.",
  ab_share: "Condividi questa pagina", ab_events_cta: "Vedi tutti gli eventi",
});
Object.assign(I18N.en, { appearance: "Appearance" }); Object.assign(I18N.de, { appearance: "Darstellung" }); Object.assign(I18N.fr, { appearance: "Apparence" }); Object.assign(I18N.it, { appearance: "Aspetto" });

// home / discover / event page / club page / about morph + subpage
Object.assign(I18N.en, {
  home: "Home", discover: "Discover", discover_title: "Discover all of Rotaract", discover_cta: "Discover everything", search_mine_ph: "Search in your clubs…",
  no_clubs_yet: "No clubs chosen yet", choose_clubs: "Choose your clubs", or_discover: "Or discover everything first.", back: "‹ Back",
  next_event: "Next event", in_days: "in {n} days", more_events: "More events", photos: "Pictures", details: "Details", your_club: "Your club", go: "Go →", faq: "Questions", scroll: "scroll",
  ab_learn: "Learn", ab_help: "Help", ab_party: "Celebrate",
  ab_learn_t: "Talks and company visits with people you'd never meet otherwise.", ab_help_t: "Projects you can still see in the evening.", ab_party_t: "Stamm, trips, the conference. Friends in every city.",
  ab_people: "Young people, 18 to 30.", ab_people_t: "{n} clubs between Geneva and Chur. Come to an event; the rest follows.",
  ab_find_title: "No club yet? Find yours", ab_more: "Rotary, districts & the world", ab_more_sub: "In pictures, one minute",
  sp_rotary: "Rotaract is part of Rotary", sp_rotary_t: "Since 1968. Every club has a Rotary club as its sponsor; at 30 it's the natural next step.",
  sp_dist: "{n} clubs, three districts", sp_dist_t: "A district is Rotary's region, led by a governor for a year. From Geneva to Chur, one conference a year, all together.",
  sp_world: "And the world", sp_world_t: "10,000 clubs in 180 countries. Travelling? Write to the local club and you're invited.",
});
Object.assign(I18N.de, {
  home: "Start", discover: "Entdecken", discover_title: "Ganz Rotaract entdecken", discover_cta: "Alles entdecken", search_mine_ph: "In deinen Clubs suchen…",
  no_clubs_yet: "Noch keine Clubs gewählt", choose_clubs: "Clubs wählen", or_discover: "Oder zuerst alles entdecken.", back: "‹ Zurück",
  next_event: "Nächster Anlass", in_days: "in {n} Tagen", more_events: "Weitere Anlässe", photos: "Bilder", details: "Details", your_club: "Dein Club", go: "Los →", faq: "Fragen", scroll: "scrollen",
  ab_learn: "Lernen", ab_help: "Helfen", ab_party: "Feiern",
  ab_learn_t: "Vorträge und Firmenbesuche mit Leuten, die man sonst nie trifft.", ab_help_t: "Projekte, die man am Abend noch sieht.", ab_party_t: "Stamm, Reisen, Konferenz. Freunde in jeder Stadt.",
  ab_people: "Junge Leute, 18 bis 30.", ab_people_t: "{n} Clubs zwischen Genf und Chur. Komm an einen Anlass, der Rest ergibt sich.",
  ab_find_title: "Noch keinen Club? Finde deinen", ab_more: "Rotary, Distrikte & die Welt", ab_more_sub: "In Bildern, eine Minute",
  sp_rotary: "Rotaract gehört zu Rotary", sp_rotary_t: "Seit 1968. Jeder Club hat einen Rotary Club als Paten; mit 30 ist das der natürliche nächste Schritt.",
  sp_dist: "{n} Clubs, drei Distrikte", sp_dist_t: "Ein Distrikt ist die Rotary-Region, ein Jahr lang von einem Governor geführt. Von Genf bis Chur, eine Konferenz pro Jahr, alle zusammen.",
  sp_world: "Und die Welt", sp_world_t: "10'000 Clubs in 180 Ländern. Auf Reisen? Schreib dem Club vor Ort, und du bist eingeladen.",
});
Object.assign(I18N.fr, {
  home: "Accueil", discover: "Découvrir", discover_title: "Découvrir tout Rotaract", discover_cta: "Tout découvrir", search_mine_ph: "Chercher dans vos clubs…",
  no_clubs_yet: "Aucun club choisi", choose_clubs: "Choisir vos clubs", or_discover: "Ou commencez par tout découvrir.", back: "‹ Retour",
  next_event: "Prochain événement", in_days: "dans {n} jours", more_events: "Autres événements", photos: "Photos", details: "Détails", your_club: "Votre club", go: "Y aller →", faq: "Questions", scroll: "défiler",
  ab_learn: "Apprendre", ab_help: "Aider", ab_party: "Fêter",
  ab_learn_t: "Conférences et visites d'entreprises avec des gens qu'on ne croiserait jamais.", ab_help_t: "Des projets qu'on voit encore le soir même.", ab_party_t: "Stamm, voyages, la conférence. Des amis dans chaque ville.",
  ab_people: "Des jeunes de 18 à 30 ans.", ab_people_t: "{n} clubs entre Genève et Coire. Venez à un événement, le reste suit.",
  ab_find_title: "Pas encore de club ? Trouvez le vôtre", ab_more: "Rotary, districts & le monde", ab_more_sub: "En images, une minute",
  sp_rotary: "Rotaract fait partie du Rotary", sp_rotary_t: "Depuis 1968. Chaque club a un Rotary club pour parrain ; à 30 ans, c'est la suite naturelle.",
  sp_dist: "{n} clubs, trois districts", sp_dist_t: "Un district est la région Rotary, dirigée un an par un gouverneur. De Genève à Coire, une conférence par an, tous ensemble.",
  sp_world: "Et le monde", sp_world_t: "10 000 clubs dans 180 pays. En voyage ? Écrivez au club local, vous êtes invité.",
});
Object.assign(I18N.it, {
  home: "Home", discover: "Scopri", discover_title: "Scopri tutto Rotaract", discover_cta: "Scopri tutto", search_mine_ph: "Cerca nei tuoi club…",
  no_clubs_yet: "Nessun club scelto", choose_clubs: "Scegli i tuoi club", or_discover: "Oppure scopri prima tutto.", back: "‹ Indietro",
  next_event: "Prossimo evento", in_days: "tra {n} giorni", more_events: "Altri eventi", photos: "Foto", details: "Dettagli", your_club: "Il tuo club", go: "Vai →", faq: "Domande", scroll: "scorri",
  ab_learn: "Imparare", ab_help: "Aiutare", ab_party: "Festeggiare",
  ab_learn_t: "Conferenze e visite aziendali con persone che altrimenti non incontreresti mai.", ab_help_t: "Progetti che la sera si vedono ancora.", ab_party_t: "Stamm, viaggi, la conferenza. Amici in ogni città.",
  ab_people: "Giovani dai 18 ai 30 anni.", ab_people_t: "{n} club tra Ginevra e Coira. Vieni a un evento, il resto viene da sé.",
  ab_find_title: "Nessun club ancora? Trova il tuo", ab_more: "Rotary, distretti e il mondo", ab_more_sub: "In immagini, un minuto",
  sp_rotary: "Rotaract fa parte del Rotary", sp_rotary_t: "Dal 1968. Ogni club ha un Rotary club come padrino; a 30 anni è il passo successivo naturale.",
  sp_dist: "{n} club, tre distretti", sp_dist_t: "Un distretto è la regione Rotary, guidata per un anno da un governatore. Da Ginevra a Coira, una conferenza all'anno, tutti insieme.",
  sp_world: "E il mondo", sp_world_t: "10'000 club in 180 paesi. In viaggio? Scrivi al club locale e sei invitato.",
});

// navigation, calendar page, settings page, explore mode
Object.assign(I18N.en, {
  calendar: "Calendar", all_clubs_short: "All", mine_short: "My clubs", today_events: "Today", no_events_day: "Nothing on this day.", close: "Close",
  set_clubs_h: "Clubs", set_app_h: "App", set_help_h: "Help", subscribe_link: "Subscribe to calendars", saved_settings: "Saved",
  explore_title: "New here?", explore_lead: "Rotaract is for people aged 18 to 30. Pick an event, come along, no membership needed.", explore_near: "Events near you", explore_all: "What is Rotaract?",
});
Object.assign(I18N.de, {
  calendar: "Kalender", all_clubs_short: "Alle", mine_short: "Meine Clubs", today_events: "Heute", no_events_day: "Nichts an diesem Tag.", close: "Schliessen",
  set_clubs_h: "Clubs", set_app_h: "App", set_help_h: "Hilfe", subscribe_link: "Kalender abonnieren", saved_settings: "Gespeichert",
  explore_title: "Neu hier?", explore_lead: "Rotaract ist für Leute zwischen 18 und 30. Such dir einen Anlass aus und komm vorbei, ohne Mitgliedschaft.", explore_near: "Anlässe in deiner Nähe", explore_all: "Was ist Rotaract?",
});
Object.assign(I18N.fr, {
  calendar: "Calendrier", all_clubs_short: "Tous", mine_short: "Mes clubs", today_events: "Aujourd'hui", no_events_day: "Rien ce jour-là.", close: "Fermer",
  set_clubs_h: "Clubs", set_app_h: "App", set_help_h: "Aide", subscribe_link: "S'abonner aux calendriers", saved_settings: "Enregistré",
  explore_title: "Nouveau ici ?", explore_lead: "Rotaract s'adresse aux 18–30 ans. Choisissez un événement et venez, sans adhésion.", explore_near: "Événements près de vous", explore_all: "Qu'est-ce que Rotaract ?",
});
Object.assign(I18N.it, {
  calendar: "Calendario", all_clubs_short: "Tutti", mine_short: "I miei club", today_events: "Oggi", no_events_day: "Niente in questo giorno.", close: "Chiudi",
  set_clubs_h: "Club", set_app_h: "App", set_help_h: "Aiuto", subscribe_link: "Abbonati ai calendari", saved_settings: "Salvato",
  explore_title: "Nuovo qui?", explore_lead: "Rotaract è per chi ha tra 18 e 30 anni. Scegli un evento e vieni, senza iscrizione.", explore_near: "Eventi vicino a te", explore_all: "Cos'è Rotaract?",
});

// welcome: member or not
Object.assign(I18N.en, { ob_member_q: "Are you a Rotaract member?", ob_member: "Yes, I'm a member", ob_guest: "Not (yet)", ob_guest_text: "Follow a club to see its events first. You can change this any time in the settings.", ob_follow: "Clubs near you", pick_main: "Choose main club", pick_also: "Choose clubs to also show", all_feed_short: "All Rotaract events CH & LI" });
Object.assign(I18N.de, { ob_member_q: "Bist du Rotaract-Mitglied?", ob_member: "Ja, Mitglied", ob_guest: "(Noch) nicht", ob_guest_text: "Folge einem Club, um seine Anlässe zuerst zu sehen. Das kannst du jederzeit in den Einstellungen ändern.", ob_follow: "Clubs in deiner Nähe", pick_main: "Hauptclub wählen", pick_also: "Weitere Clubs wählen", all_feed_short: "Alle Rotaract-Anlässe CH & LI" });
Object.assign(I18N.fr, { ob_member_q: "Êtes-vous membre de Rotaract ?", ob_member: "Oui, membre", ob_guest: "Pas (encore)", ob_guest_text: "Suivez un club pour voir ses événements en premier. Vous pourrez changer cela à tout moment dans les réglages.", ob_follow: "Clubs près de vous", pick_main: "Choisir le club principal", pick_also: "Choisir d'autres clubs", all_feed_short: "Tous les événements Rotaract CH & LI" });
Object.assign(I18N.it, { ob_member_q: "Sei socio Rotaract?", ob_member: "Sì, socio", ob_guest: "Non (ancora)", ob_guest_text: "Segui un club per vedere prima i suoi eventi. Puoi cambiarlo in qualsiasi momento nelle impostazioni.", ob_follow: "Club vicino a te", pick_main: "Scegli il club principale", pick_also: "Scegli altri club", all_feed_short: "Tutti gli eventi Rotaract CH & LI" });

// home: personal overview
Object.assign(I18N.en, { greet_morning: "Good morning", greet_day: "Hello", greet_evening: "Good evening", wk_none: "Nothing this week", wk_events: "{n} events this week", wk_one: "1 event this week", deadline_h: "Registration deadline", saved_h: "Saved", none_open: "Nothing open.", news_new: "{n} new", news_rest: "since your last visit", news_moved: "{n} moved", home_soon: "Coming up", today: "Today", tomorrow: "Tomorrow", d_short: "{n} d." });
Object.assign(I18N.de, { greet_morning: "Guten Morgen", greet_day: "Hallo", greet_evening: "Guten Abend", wk_none: "Nichts diese Woche", wk_events: "{n} Anlässe diese Woche", wk_one: "1 Anlass diese Woche", deadline_h: "Anmeldeschluss", saved_h: "Gemerkt", none_open: "Nichts offen.", news_new: "{n} neue", news_rest: "seit deinem letzten Besuch", news_moved: "{n} verschoben", home_soon: "Demnächst", today: "Heute", tomorrow: "Morgen", d_short: "{n} T." });
Object.assign(I18N.fr, { greet_morning: "Bonjour", greet_day: "Salut", greet_evening: "Bonsoir", wk_none: "Rien cette semaine", wk_events: "{n} événements cette semaine", wk_one: "1 événement cette semaine", deadline_h: "Délai d'inscription", saved_h: "Enregistrés", none_open: "Rien d'ouvert.", news_new: "{n} nouveaux", news_rest: "depuis votre dernière visite", news_moved: "{n} déplacés", home_soon: "Prochainement", today: "Aujourd'hui", tomorrow: "Demain", d_short: "{n} j." });
Object.assign(I18N.it, { greet_morning: "Buongiorno", greet_day: "Ciao", greet_evening: "Buonasera", wk_none: "Niente questa settimana", wk_events: "{n} eventi questa settimana", wk_one: "1 evento questa settimana", deadline_h: "Termine iscrizione", saved_h: "Salvati", none_open: "Niente di aperto.", news_new: "{n} nuovi", news_rest: "dalla tua ultima visita", news_moved: "{n} spostati", home_soon: "Prossimamente", today: "Oggi", tomorrow: "Domani", d_short: "{n} g." });

// welcome intro for people who aren't members yet, the Rotary family page, club news
Object.assign(I18N.en, {
  ob_start: "Get started", ob_who: "Who we are", ob_what: "What we do", ob_how: "How to start",
  ob_how_t: "Pick an event, register on Polaris (the clubs' website) and come along as a guest. No membership needed, and you don't have to know anyone: say you're new and someone will take you along.",
  fam_h: "The Rotary family", fam_lead: "Who is who, in one line each.", fam_sub: "Rotary, Rotaract, Interact & co. in one line each", fam_clubs: "The clubs", news: "News",
  fam: [["Rotary", "The parent organisation since 1905. Clubs of professionals, worldwide."], ["Rotaract", "Rotary for 18 to 30. That's us."], ["Interact", "Clubs at schools, 12 to 18."],
    ["Youth Exchange & Rotex", "A school year abroad. Rotex are its alumni."], ["RYLA", "Leadership camps for young people."], ["Inner Wheel", "Women's service clubs, close to Rotary."],
    ["Rotary Foundation", "Rotary's charity: grants, scholarships, ending polio."], ["Districts", "The clubs of a region, one governor. CH & LI have three."]],
});
Object.assign(I18N.de, {
  ob_start: "Los geht's", ob_who: "Wer wir sind", ob_what: "Was wir tun", ob_how: "So fängst du an",
  ob_how_t: "Such dir einen Anlass aus, melde dich auf Polaris (der Website der Clubs) an und komm als Gast vorbei. Keine Mitgliedschaft nötig, und du musst niemanden kennen: sag, dass du neu bist, und jemand nimmt dich mit.",
  fam_h: "Die Rotary-Familie", fam_lead: "Wer ist wer, in je einer Zeile.", fam_sub: "Rotary, Rotaract, Interact & Co. in je einer Zeile", fam_clubs: "Die Clubs", news: "News",
  fam: [["Rotary", "Die Dachorganisation seit 1905. Clubs von Berufstätigen, weltweit."], ["Rotaract", "Rotary für 18 bis 30. Das sind wir."], ["Interact", "Clubs an Schulen, 12 bis 18."],
    ["Jugendaustausch & Rotex", "Ein Schuljahr im Ausland. Rotex sind die Ehemaligen."], ["RYLA", "Leadership-Camps für junge Leute."], ["Inner Wheel", "Frauen-Serviceclubs, nahe bei Rotary."],
    ["Rotary Foundation", "Das Hilfswerk von Rotary: Grants, Stipendien, Polio beenden."], ["Distrikte", "Die Clubs einer Region, ein Governor. CH & LI haben drei."]],
});
Object.assign(I18N.fr, {
  ob_start: "C'est parti", ob_who: "Qui nous sommes", ob_what: "Ce que nous faisons", ob_how: "Comment commencer",
  ob_how_t: "Choisissez un événement, inscrivez-vous sur Polaris (le site des clubs) et venez en invité. Pas besoin d'être membre ni de connaître quelqu'un : dites que vous êtes nouveau et on vous prendra avec.",
  fam_h: "La famille Rotary", fam_lead: "Qui est qui, en une ligne chacun.", fam_sub: "Rotary, Rotaract, Interact & co. en une ligne chacun", fam_clubs: "Les clubs", news: "Actualités",
  fam: [["Rotary", "L'organisation faîtière depuis 1905. Des clubs de professionnels, dans le monde entier."], ["Rotaract", "Le Rotary des 18 à 30 ans. C'est nous."], ["Interact", "Des clubs dans les écoles, 12 à 18 ans."],
    ["Échange de jeunes & Rotex", "Une année scolaire à l'étranger. Les Rotex en sont les anciens."], ["RYLA", "Des camps de leadership pour les jeunes."], ["Inner Wheel", "Des clubs de service féminins, proches du Rotary."],
    ["Fondation Rotary", "L'œuvre caritative du Rotary : subventions, bourses, fin de la polio."], ["Districts", "Les clubs d'une région, un gouverneur. CH & LI en ont trois."]],
});
Object.assign(I18N.it, {
  ob_start: "Iniziamo", ob_who: "Chi siamo", ob_what: "Cosa facciamo", ob_how: "Come iniziare",
  ob_how_t: "Scegli un evento, iscriviti su Polaris (il sito dei club) e vieni come ospite. Non serve essere soci né conoscere qualcuno: di' che sei nuovo e qualcuno ti porterà con sé.",
  fam_h: "La famiglia Rotary", fam_lead: "Chi è chi, in una riga ciascuno.", fam_sub: "Rotary, Rotaract, Interact & co. in una riga ciascuno", fam_clubs: "I club", news: "Notizie",
  fam: [["Rotary", "L'organizzazione madre dal 1905. Club di professionisti, in tutto il mondo."], ["Rotaract", "Il Rotary dai 18 ai 30. Siamo noi."], ["Interact", "Club nelle scuole, 12–18 anni."],
    ["Scambio giovani & Rotex", "Un anno scolastico all'estero. I Rotex sono gli ex."], ["RYLA", "Campi di leadership per giovani."], ["Inner Wheel", "Club di servizio femminili, vicini al Rotary."],
    ["Fondazione Rotary", "L'ente benefico del Rotary: sovvenzioni, borse di studio, fine della polio."], ["Distretti", "I club di una regione, un governatore. CH e LI ne hanno tre."]],
});

// the "only public events" page: what the app can't see and why
Object.assign(I18N.en, {
  pub_h: "Only public events", 
  pub_lead: "This app reads the clubs' public pages on Polaris. It never logs in, so it only knows what anyone can see without an account.",
  pub_no_h: "What it can't show", pub_no: ["Whether you're logged in to Polaris.", "Whether you've already signed up for an event.", "Private and members-only events."],
  pub_why_h: "Why only public events?", pub_why: "There is no official Rotary API for events yet. One might come in 2027. Until then the only way is to scrape the public pages, and scraping means using only public, official data: nothing behind a login.",
  pub_do_h: "What you can do", pub_do: "To register, check your sign-ups or see members-only events, log in on Polaris. \"Register\" on every event takes you straight there.",
});
Object.assign(I18N.de, {
  pub_h: "Nur öffentliche Anlässe", 
  pub_lead: "Diese App liest die öffentlichen Seiten der Clubs auf Polaris. Sie meldet sich nie an und kennt deshalb nur, was alle ohne Konto sehen.",
  pub_no_h: "Was sie nicht zeigen kann", pub_no: ["Ob du bei Polaris angemeldet bist.", "Ob du dich für einen Anlass schon angemeldet hast.", "Private Anlässe und solche nur für Mitglieder."],
  pub_why_h: "Warum nur öffentliche Anlässe?", pub_why: "Es gibt noch keine offizielle Rotary-API für Anlässe. Vielleicht kommt eine 2027. Bis dahin bleibt nur, die öffentlichen Seiten auszulesen (Scraping), und Scraping heisst: nur öffentliche, offizielle Daten, nichts hinter einem Login.",
  pub_do_h: "Was du tun kannst", pub_do: "Zum Anmelden, für deine Anmeldungen oder Anlässe nur für Mitglieder meldest du dich auf Polaris an. «Anmelden» bei jedem Anlass bringt dich direkt hin.",
});
Object.assign(I18N.fr, {
  pub_h: "Seulement les événements publics", 
  pub_lead: "Cette app lit les pages publiques des clubs sur Polaris. Elle ne se connecte jamais et ne connaît donc que ce que tout le monde voit sans compte.",
  pub_no_h: "Ce qu'elle ne peut pas montrer", pub_no: ["Si vous êtes connecté à Polaris.", "Si vous êtes déjà inscrit à un événement.", "Les événements privés et réservés aux membres."],
  pub_why_h: "Pourquoi seulement les événements publics ?", pub_why: "Il n'existe pas encore d'API officielle du Rotary pour les événements. Une pourrait arriver en 2027. D'ici là, il ne reste qu'à lire les pages publiques (scraping), et le scraping signifie : uniquement des données publiques et officielles, rien derrière une connexion.",
  pub_do_h: "Ce que vous pouvez faire", pub_do: "Pour vous inscrire, voir vos inscriptions ou les événements réservés aux membres, connectez-vous sur Polaris. « S'inscrire » sur chaque événement vous y mène directement.",
});
Object.assign(I18N.it, {
  pub_h: "Solo eventi pubblici", 
  pub_lead: "Questa app legge le pagine pubbliche dei club su Polaris. Non effettua mai l'accesso, quindi conosce solo ciò che chiunque vede senza account.",
  pub_no_h: "Cosa non può mostrare", pub_no: ["Se hai effettuato l'accesso a Polaris.", "Se ti sei già iscritto a un evento.", "Eventi privati e riservati ai soci."],
  pub_why_h: "Perché solo eventi pubblici?", pub_why: "Non esiste ancora un'API ufficiale del Rotary per gli eventi. Potrebbe arrivarne una nel 2027. Fino ad allora l'unica via è leggere le pagine pubbliche (scraping), e scraping significa: solo dati pubblici e ufficiali, niente dietro un login.",
  pub_do_h: "Cosa puoi fare", pub_do: "Per iscriverti, vedere le tue iscrizioni o gli eventi riservati ai soci, accedi su Polaris. «Iscriviti» su ogni evento ti porta direttamente lì.",
});

// --- deadline on cards, location on tap, saved pane, filter panel, map
Object.assign(I18N.en, { reg_by: "Register by {d}", near_btn: "Use my approximate location", none_saved: "Nothing saved yet.", pick_clubs: "Choose clubs", map: "Map" });
Object.assign(I18N.de, { reg_by: "Anmelden bis {d}", near_btn: "Meinen ungefähren Standort verwenden", none_saved: "Noch nichts gemerkt.", pick_clubs: "Clubs wählen", map: "Karte" });
Object.assign(I18N.fr, { reg_by: "Inscription jusqu'au {d}", near_btn: "Utiliser ma position approximative", none_saved: "Rien d'enregistré.", pick_clubs: "Choisir des clubs", map: "Carte" });
Object.assign(I18N.it, { reg_by: "Iscrizione entro il {d}", near_btn: "Usa la mia posizione approssimativa", none_saved: "Nulla di salvato.", pick_clubs: "Scegli i club", map: "Mappa" });

// --- "This app" page (public.html) and the Polaris button on past or cancelled events
Object.assign(I18N.en, { app_h: "About this app", app_data_h: "Your data", app_data: "Your clubs, saved events and settings are stored on this device only. There is no account and nothing is sent anywhere.", open_polaris: "Open on Polaris" });
Object.assign(I18N.de, { app_h: "Über diese App", app_data_h: "Deine Daten", app_data: "Deine Clubs, gemerkten Anlässe und Einstellungen sind nur auf diesem Gerät gespeichert. Es gibt kein Konto und nichts wird irgendwohin gesendet.", open_polaris: "Auf Polaris öffnen" });
Object.assign(I18N.fr, { app_h: "À propos de cette app", app_data_h: "Vos données", app_data: "Vos clubs, événements enregistrés et réglages sont stockés uniquement sur cet appareil. Il n'y a pas de compte et rien n'est envoyé nulle part.", open_polaris: "Ouvrir sur Polaris" });
Object.assign(I18N.it, { app_h: "Informazioni sull'app", app_data_h: "I tuoi dati", app_data: "I tuoi club, gli eventi salvati e le impostazioni restano solo su questo dispositivo. Non c'è un account e nulla viene inviato altrove.", open_polaris: "Apri su Polaris" });

// help texts: questions on the "This app" and Subscribe pages
Object.assign(I18N.en, {
  cred_h: "Sources", wrong_h: "Something wrong?", report: "Report on GitHub",
  cred: "Events, pictures and news: the clubs' public pages on Polaris. Maps and place search: swisstopo and OpenStreetMap. Coats of arms: Wikimedia Commons. Approximate location: geojs.io.",
  wrong: "A wrong date, place or text is fixed by the club on Polaris; the app follows within 6 hours. For a problem with the app itself, tell Jean-Michel Carrel (Rotaract Club Luzern) or report it on GitHub.",
  app_qa: [
    ["Where do the events come from?", "From the public agenda of every Rotaract club in Switzerland and Liechtenstein on Polaris, the clubs' website. The app reads them again every 6 hours, so a new or changed event can take that long to appear."],
    ["What are “Main club” and “Also show”?", "Your main club is the one you belong to or care about most. “Also show” adds other clubs you follow. Together they make up Home. You change them in Settings; searching and filtering never changes them."],
    ["What do “Members only”, “Cancelled” and “Register by” mean?", "Members only: the app shows title, date and place; the details and the registration are on Polaris after you log in. Cancelled: the club removed the event; it stays visible until its date has passed. Register by: the registration deadline the club set."],
    ["Installing the app or subscribing to a calendar?", "Installing puts this app on your home screen. Subscribing puts the events into your phone's own calendar, next to your other appointments. The two are independent: do one, both or neither."],
    ["Does the app send notifications?", "No. To be reminded, subscribe to a calendar and set a reminder there, or add a single event to your calendar from its page."],
    ["How does “Near me” know where I am?", "Only after you tap it, the app looks up the approximate location of your internet connection, without asking for location access. It forgets it when you close the tab. You can also type a town."],
    ["How far back do the events go?", "Two years. Past events are under Discover › Past."],
  ],
  sub_qa: [
    ["How quickly do changes arrive?", "The calendars here are refreshed every 6 hours. Your calendar app decides when it fetches them: Apple usually within a few hours, Google can take a day and has no refresh button."],
    ["Subscribing or “Add to calendar”?", "A subscription brings in all events of a club and keeps them up to date. “Add to calendar” on an event copies that one event; it does not change if the event moves."],
    ["One club or all clubs?", "Subscribe to your own club and add other clubs one by one. The calendar with all clubs holds a lot of events; keep it as a separate calendar you can hide."],
    ["What about members-only and cancelled events?", "Members-only events carry title, date and place and are marked in the title; the details are on Polaris. A cancelled event stays in the calendar, marked as cancelled, until its date has passed."],
    ["How do I unsubscribe?", "iPhone: in Calendar tap Calendars, then ⓘ next to the calendar, and remove it. Google: on calendar.google.com open Settings, pick the calendar and unsubscribe. Outlook: right-click the calendar and remove it."],
  ],
});
Object.assign(I18N.de, {
  cred_h: "Quellen", wrong_h: "Stimmt etwas nicht?", report: "Auf GitHub melden",
  cred: "Anlässe, Bilder und News: die öffentlichen Seiten der Clubs auf Polaris. Karten und Ortssuche: swisstopo und OpenStreetMap. Wappen: Wikimedia Commons. Ungefährer Standort: geojs.io.",
  wrong: "Ein falsches Datum, ein falscher Ort oder Text wird vom Club auf Polaris korrigiert; die App zieht innert 6 Stunden nach. Bei einem Problem mit der App selbst: Jean-Michel Carrel (Rotaract Club Luzern) Bescheid geben oder auf GitHub melden.",
  app_qa: [
    ["Woher kommen die Anlässe?", "Aus der öffentlichen Agenda jedes Rotaract Clubs in der Schweiz und Liechtenstein auf Polaris, der Website der Clubs. Die App liest sie alle 6 Stunden neu ein; so lange kann es dauern, bis ein neuer oder geänderter Anlass erscheint."],
    ["Was sind «Hauptclub» und «Auch anzeigen»?", "Dein Hauptclub ist der Club, in dem du Mitglied bist oder der dich am meisten interessiert. «Auch anzeigen» fügt weitere Clubs hinzu, denen du folgst. Zusammen ergeben sie den Start. Du änderst sie in den Einstellungen; Suchen und Filtern ändert sie nie."],
    ["Was bedeuten «Nur für Mitglieder», «Abgesagt» und «Anmelden bis»?", "Nur für Mitglieder: Die App zeigt Titel, Datum und Ort; Details und Anmeldung findest du auf Polaris nach dem Login. Abgesagt: Der Club hat den Anlass entfernt; er bleibt sichtbar, bis sein Datum vorbei ist. Anmelden bis: die Anmeldefrist, die der Club gesetzt hat."],
    ["App installieren oder Kalender abonnieren?", "Installieren legt diese App auf deinen Homescreen. Abonnieren bringt die Anlässe in den Kalender deines Handys, neben deine anderen Termine. Beides ist unabhängig: Du kannst eines, beides oder keines tun."],
    ["Schickt die App Mitteilungen?", "Nein. Für eine Erinnerung abonnierst du einen Kalender und stellst sie dort ein, oder du fügst einen einzelnen Anlass von seiner Seite aus deinem Kalender hinzu."],
    ["Woher weiss «In der Nähe», wo ich bin?", "Erst wenn du darauf tippst, ermittelt die App den ungefähren Standort deiner Internetverbindung, ohne Standortfreigabe. Sie vergisst ihn, wenn du den Tab schliesst. Du kannst auch einen Ort eintippen."],
    ["Wie weit reichen die Anlässe zurück?", "Zwei Jahre. Vergangene Anlässe findest du unter Entdecken › Vergangene."],
  ],
  sub_qa: [
    ["Wie schnell kommen Änderungen an?", "Die Kalender hier werden alle 6 Stunden aktualisiert. Wann deine Kalender-App sie abholt, entscheidet sie selbst: Apple meist innert weniger Stunden, Google kann einen Tag brauchen und hat keinen Aktualisieren-Knopf."],
    ["Abonnieren oder «In Kalender»?", "Ein Abo bringt alle Anlässe eines Clubs und hält sie aktuell. «In Kalender» bei einem Anlass kopiert nur diesen einen; er ändert sich nicht, wenn der Anlass verschoben wird."],
    ["Ein Club oder alle Clubs?", "Abonniere deinen eigenen Club und füge weitere Clubs einzeln hinzu. Der Kalender mit allen Clubs enthält sehr viele Anlässe; führe ihn als eigenen Kalender, den du ausblenden kannst."],
    ["Was ist mit abgesagten Anlässen und solchen nur für Mitglieder?", "Anlässe nur für Mitglieder enthalten Titel, Datum und Ort und sind im Titel markiert; die Details stehen auf Polaris. Ein abgesagter Anlass bleibt als abgesagt im Kalender, bis sein Datum vorbei ist."],
    ["Wie beende ich ein Abo?", "iPhone: im Kalender auf «Kalender» tippen, dann auf ⓘ neben dem Kalender, und ihn entfernen. Google: auf calendar.google.com die Einstellungen öffnen, den Kalender wählen und das Abo beenden. Outlook: Rechtsklick auf den Kalender und entfernen."],
  ],
});
Object.assign(I18N.fr, {
  cred_h: "Sources", wrong_h: "Quelque chose ne va pas ?", report: "Signaler sur GitHub",
  cred: "Événements, images et actualités : les pages publiques des clubs sur Polaris. Cartes et recherche de lieux : swisstopo et OpenStreetMap. Armoiries : Wikimedia Commons. Position approximative : geojs.io.",
  wrong: "Une date, un lieu ou un texte erroné est corrigé par le club sur Polaris ; l'app suit dans les 6 heures. Pour un problème avec l'app elle-même, prévenez Jean-Michel Carrel (Rotaract Club Luzern) ou signalez-le sur GitHub.",
  app_qa: [
    ["D'où viennent les événements ?", "De l'agenda public de chaque club Rotaract de Suisse et du Liechtenstein sur Polaris, le site des clubs. L'app les relit toutes les 6 heures ; un événement nouveau ou modifié peut donc mettre ce temps à apparaître."],
    ["Que sont « Club principal » et « Afficher aussi » ?", "Votre club principal est celui dont vous êtes membre ou qui vous intéresse le plus. « Afficher aussi » ajoute d'autres clubs que vous suivez. Ensemble, ils composent l'Accueil. Vous les modifiez dans les Réglages ; la recherche et les filtres ne les changent jamais."],
    ["Que signifient « Réservé aux membres », « Annulé » et « Inscription jusqu'au » ?", "Réservé aux membres : l'app montre le titre, la date et le lieu ; les détails et l'inscription sont sur Polaris après connexion. Annulé : le club a retiré l'événement ; il reste visible jusqu'à ce que sa date soit passée. Inscription jusqu'au : le délai d'inscription fixé par le club."],
    ["Installer l'app ou s'abonner à un calendrier ?", "Installer place cette app sur votre écran d'accueil. S'abonner place les événements dans le calendrier de votre téléphone, à côté de vos autres rendez-vous. Les deux sont indépendants : l'un, les deux ou aucun."],
    ["L'app envoie-t-elle des notifications ?", "Non. Pour un rappel, abonnez-vous à un calendrier et réglez-le là, ou ajoutez un seul événement à votre calendrier depuis sa page."],
    ["Comment « Près de moi » sait-il où je suis ?", "Seulement quand vous le touchez, l'app cherche la position approximative de votre connexion internet, sans demander l'accès à la localisation. Elle l'oublie à la fermeture de l'onglet. Vous pouvez aussi saisir une localité."],
    ["Jusqu'où remontent les événements ?", "Deux ans. Les événements passés se trouvent sous Découvrir › Passés."],
  ],
  sub_qa: [
    ["En combien de temps les changements arrivent-ils ?", "Les calendriers d'ici sont actualisés toutes les 6 heures. Votre app de calendrier décide quand elle les récupère : Apple en général en quelques heures, Google peut mettre un jour et n'a pas de bouton d'actualisation."],
    ["S'abonner ou « Ajouter au calendrier » ?", "Un abonnement apporte tous les événements d'un club et les tient à jour. « Ajouter au calendrier » sur un événement copie ce seul événement ; il ne change pas si l'événement est déplacé."],
    ["Un club ou tous les clubs ?", "Abonnez-vous à votre propre club et ajoutez les autres un par un. Le calendrier de tous les clubs contient beaucoup d'événements ; gardez-le comme calendrier séparé que vous pouvez masquer."],
    ["Et les événements annulés ou réservés aux membres ?", "Les événements réservés aux membres portent le titre, la date et le lieu et sont marqués dans le titre ; les détails sont sur Polaris. Un événement annulé reste dans le calendrier, marqué comme annulé, jusqu'à ce que sa date soit passée."],
    ["Comment me désabonner ?", "iPhone : dans Calendrier, touchez Calendriers, puis ⓘ à côté du calendrier, et supprimez-le. Google : sur calendar.google.com, ouvrez les Paramètres, choisissez le calendrier et désabonnez-vous. Outlook : clic droit sur le calendrier, puis supprimer."],
  ],
});
Object.assign(I18N.it, {
  cred_h: "Fonti", wrong_h: "Qualcosa non va?", report: "Segnala su GitHub",
  cred: "Eventi, immagini e notizie: le pagine pubbliche dei club su Polaris. Mappe e ricerca dei luoghi: swisstopo e OpenStreetMap. Stemmi: Wikimedia Commons. Posizione approssimativa: geojs.io.",
  wrong: "Una data, un luogo o un testo sbagliato viene corretto dal club su Polaris; l'app segue entro 6 ore. Per un problema con l'app stessa, avvisa Jean-Michel Carrel (Rotaract Club Luzern) o segnalalo su GitHub.",
  app_qa: [
    ["Da dove vengono gli eventi?", "Dall'agenda pubblica di ogni Rotaract club di Svizzera e Liechtenstein su Polaris, il sito dei club. L'app li rilegge ogni 6 ore; un evento nuovo o modificato può quindi impiegare questo tempo per comparire."],
    ["Cosa sono «Club principale» e «Mostra anche»?", "Il club principale è quello di cui sei socio o che ti interessa di più. «Mostra anche» aggiunge altri club che segui. Insieme formano la Home. Li cambi nelle Impostazioni; la ricerca e i filtri non li cambiano mai."],
    ["Cosa significano «Solo per soci», «Annullato» e «Iscrizione entro»?", "Solo per soci: l'app mostra titolo, data e luogo; i dettagli e l'iscrizione sono su Polaris dopo l'accesso. Annullato: il club ha tolto l'evento; resta visibile finché la sua data non è passata. Iscrizione entro: il termine d'iscrizione fissato dal club."],
    ["Installare l'app o abbonarsi a un calendario?", "Installare mette questa app nella schermata iniziale. Abbonarsi mette gli eventi nel calendario del tuo telefono, accanto agli altri appuntamenti. Le due cose sono indipendenti: una, entrambe o nessuna."],
    ["L'app invia notifiche?", "No. Per un promemoria, abbonati a un calendario e impostalo lì, oppure aggiungi un singolo evento al tuo calendario dalla sua pagina."],
    ["Come fa «Vicino a me» a sapere dove sono?", "Solo quando lo tocchi, l'app cerca la posizione approssimativa della tua connessione internet, senza chiedere l'accesso alla posizione. La dimentica quando chiudi la scheda. Puoi anche scrivere una località."],
    ["Fino a quando risalgono gli eventi?", "Due anni. Gli eventi passati sono sotto Scopri › Passati."],
  ],
  sub_qa: [
    ["In quanto tempo arrivano le modifiche?", "I calendari qui vengono aggiornati ogni 6 ore. La tua app calendario decide quando scaricarli: Apple di solito entro poche ore, Google può impiegare un giorno e non ha un pulsante di aggiornamento."],
    ["Abbonarsi o «Aggiungi al calendario»?", "Un abbonamento porta tutti gli eventi di un club e li tiene aggiornati. «Aggiungi al calendario» su un evento copia solo quell'evento; non cambia se l'evento viene spostato."],
    ["Un club o tutti i club?", "Abbonati al tuo club e aggiungi gli altri uno alla volta. Il calendario di tutti i club contiene molti eventi; tienilo come calendario separato che puoi nascondere."],
    ["E gli eventi annullati o solo per soci?", "Gli eventi solo per soci riportano titolo, data e luogo e sono segnalati nel titolo; i dettagli sono su Polaris. Un evento annullato resta nel calendario, segnato come annullato, finché la sua data non è passata."],
    ["Come annullo l'abbonamento?", "iPhone: in Calendario tocca Calendari, poi ⓘ accanto al calendario, e rimuovilo. Google: su calendar.google.com apri le Impostazioni, scegli il calendario e annulla l'iscrizione. Outlook: clic destro sul calendario e rimuovilo."],
  ],
});

// "This app" tiles, link cards, and the welcome page for new members (guide.html: first steps, three facts) and the word list (words.html)
Object.assign(I18N.en, {
  app_lead: "Every public Rotaract event in Switzerland and Liechtenstein, in one place.", read_on: "Read on", app_know_h: "Good to know",
  app_tabs: ["Your clubs at a glance", "Every club, with search and map", "The month in one view"],
  app_know: [["Fresh every 6 hours", "Read from the clubs' Polaris pages."], ["Register on Polaris", "“Register” takes you straight there."], ["Works offline", "With the events it loaded last."], ["No notifications", "Subscribe to a calendar for reminders."]],
  ab_sub_sub: "Events in your phone's calendar, always up to date",
  nm: { h: "New in the club", hi: "Welcome to {club}", hi0: "Welcome to Rotaract", lead: "Good to have you. Four small steps and you're all set.", steps_h: "Your first steps",
    steps: [["Get your Polaris login", "Ask your board. You need it to register."], ["Pick your main club", "Home then shows your club's events."], ["Subscribe to the calendar", "Events land in your phone's calendar."], ["Come to the next event", "See what's on."]],
    facts: [["1 July", "the Rotaract year starts"], ["{n}", "clubs where you are welcome"], ["3", "districts: 1980, 1990, 2000"]],
    words_h: "Rotaract words", words_sub: "Look up the names and phrases you hear", words_ph: "Search a word", words_none: "No such word here yet.",
    words: [["Board", "The members who run the club for one year."], ["Charter", "The official founding of a club, and the party for it."], ["District", "A Rotary region. Switzerland and Liechtenstein have three."], ["DG", "District Governor. Leads the Rotary clubs of a district for one year."], ["DRR", "District Rotaract Representative. Speaks for a district's Rotaract clubs."], ["End Polio Now", "Rotary's worldwide campaign to end polio."], ["Four-Way Test", "Rotary's four questions for what we think, say and do."], ["Guest", "Someone who comes to events before becoming a member."], ["Handover", "The board passes its offices to the next one, around 1 July."], ["Hands-on", "A service project where members do the work themselves."], ["Inner Wheel", "An international women's service organisation close to Rotary."], ["Interact", "Rotary's clubs for 12- to 18-year-olds."], ["Polaris", "The clubs' website: agenda, registration and member area."], ["President-elect", "Next year's president, already chosen."], ["RAC", "Rotaract Club."], ["RC", "Rotary Club."], ["RI", "Rotary International, the worldwide organisation."], ["Rotex", "Former Rotary exchange students who look after the current ones."], ["Rotary Foundation", "Rotary's charity. It funds projects around the world."], ["RYLA", "Rotary Youth Leadership Awards: a leadership seminar for young people."], ["Sponsor club", "The Rotary club that supports your Rotaract club."], ["Stamm", "A club's regular, relaxed get-together."]] },
});
Object.assign(I18N.de, {
  app_lead: "Alle öffentlichen Rotaract-Anlässe der Schweiz und Liechtensteins an einem Ort.", read_on: "Weiterlesen", app_know_h: "Gut zu wissen",
  app_tabs: ["Deine Clubs auf einen Blick", "Alle Clubs, mit Suche und Karte", "Der Monat in einer Ansicht"],
  app_know: [["Alle 6 Stunden frisch", "Gelesen von den Polaris-Seiten der Clubs."], ["Anmelden auf Polaris", "«Anmelden» führt dich direkt dorthin."], ["Funktioniert offline", "Mit den zuletzt geladenen Anlässen."], ["Keine Mitteilungen", "Abonniere einen Kalender für Erinnerungen."]],
  ab_sub_sub: "Anlässe im Kalender deines Handys, immer aktuell",
  nm: { h: "Neu im Club", hi: "Willkommen beim {club}", hi0: "Willkommen bei Rotaract", lead: "Schön, bist du dabei. Vier kleine Schritte, und du bist startklar.", steps_h: "Deine ersten Schritte",
    steps: [["Polaris-Login holen", "Frag deinen Vorstand. Du brauchst es zum Anmelden."], ["Hauptclub wählen", "Dann zeigt der Start die Anlässe deines Clubs."], ["Kalender abonnieren", "Die Anlässe landen im Kalender deines Handys."], ["Komm an den nächsten Anlass", "Schau, was läuft."]],
    facts: [["1. Juli", "beginnt das Rotaract-Jahr"], ["{n}", "Clubs, in denen du willkommen bist"], ["3", "Distrikte: 1980, 1990, 2000"]],
    words_h: "Rotaract-Wörter", words_sub: "Schlag die Namen und Begriffe nach, die du hörst", words_ph: "Wort suchen", words_none: "Dieses Wort fehlt hier noch.",
    words: [["Vorstand", "Die Mitglieder, die den Club ein Jahr lang führen."], ["Charter", "Die offizielle Gründung eines Clubs und das Fest dazu."], ["Distrikt", "Eine Rotary-Region. Die Schweiz und Liechtenstein haben drei."], ["DG", "District Governor. Leitet die Rotary Clubs eines Distrikts für ein Jahr."], ["DRR", "District Rotaract Representative. Vertritt die Rotaract Clubs eines Distrikts."], ["End Polio Now", "Rotarys weltweite Kampagne gegen Kinderlähmung."], ["Vier-Fragen-Probe", "Rotarys vier Fragen für das, was wir denken, sagen und tun."], ["Gast", "Wer an Anlässe kommt, bevor er oder sie Mitglied wird."], ["Ämterübergabe", "Der Vorstand übergibt seine Ämter dem nächsten, um den 1. Juli."], ["Hands-on", "Ein Sozialprojekt, bei dem die Mitglieder selbst anpacken."], ["Inner Wheel", "Eine internationale Frauen-Serviceorganisation, die Rotary nahesteht."], ["Interact", "Rotarys Clubs für 12- bis 18-Jährige."], ["Polaris", "Die Website der Clubs: Agenda, Anmeldung und Mitgliederbereich."], ["President-elect", "Der Präsident oder die Präsidentin des nächsten Jahres, bereits gewählt."], ["RAC", "Rotaract Club."], ["RC", "Rotary Club."], ["RI", "Rotary International, die weltweite Organisation."], ["Rotex", "Ehemalige Rotary-Austauschschüler, die die aktuellen betreuen."], ["Rotary Foundation", "Rotarys Stiftung. Sie finanziert Projekte auf der ganzen Welt."], ["RYLA", "Rotary Youth Leadership Awards: ein Führungsseminar für junge Leute."], ["Patenclub", "Der Rotary Club, der deinen Rotaract Club unterstützt."], ["Stamm", "Das regelmässige, lockere Treffen eines Clubs."]] },
});
Object.assign(I18N.fr, {
  app_lead: "Tous les événements Rotaract publics de Suisse et du Liechtenstein, au même endroit.", read_on: "Pour aller plus loin", app_know_h: "Bon à savoir",
  app_tabs: ["Vos clubs en un coup d'œil", "Tous les clubs, avec recherche et carte", "Le mois en une vue"],
  app_know: [["Actualisé toutes les 6 heures", "Lu sur les pages Polaris des clubs."], ["Inscription sur Polaris", "« S'inscrire » vous y mène directement."], ["Fonctionne hors ligne", "Avec les derniers événements chargés."], ["Pas de notifications", "Abonnez-vous à un calendrier pour les rappels."]],
  ab_sub_sub: "Les événements dans le calendrier de votre téléphone, toujours à jour",
  nm: { h: "Nouveau dans le club", hi: "Bienvenue au {club}", hi0: "Bienvenue au Rotaract", lead: "Content de vous compter parmi nous. Quatre petites étapes et vous êtes prêt.", steps_h: "Vos premiers pas",
    steps: [["Obtenir l'accès Polaris", "Demandez à votre comité. Il sert à s'inscrire."], ["Choisir votre club principal", "L'Accueil montre alors les événements de votre club."], ["S'abonner au calendrier", "Les événements arrivent dans le calendrier de votre téléphone."], ["Venir au prochain événement", "Voyez ce qui se passe."]],
    facts: [["1er juillet", "début de l'année Rotaract"], ["{n}", "clubs où vous êtes bienvenu"], ["3", "districts : 1980, 1990, 2000"]],
    words_h: "Les mots du Rotaract", words_sub: "Retrouvez les noms et expressions que vous entendez", words_ph: "Chercher un mot", words_none: "Ce mot manque encore ici.",
    words: [["Comité", "Les membres qui dirigent le club pendant un an."], ["Charte", "La fondation officielle d'un club, et la fête qui va avec."], ["District", "Une région du Rotary. La Suisse et le Liechtenstein en comptent trois."], ["DG", "Gouverneur de district. Dirige les Rotary clubs d'un district pendant un an."], ["DRR", "District Rotaract Representative. Représente les clubs Rotaract d'un district."], ["End Polio Now", "La campagne mondiale du Rotary contre la polio."], ["Critère des quatre questions", "Les quatre questions du Rotary pour ce que nous pensons, disons et faisons."], ["Invité", "Une personne qui vient aux événements avant de devenir membre."], ["Passation", "Le comité transmet ses fonctions au suivant, autour du 1er juillet."], ["Hands-on", "Une action sociale où les membres mettent la main à la pâte."], ["Inner Wheel", "Une organisation internationale de service féminine, proche du Rotary."], ["Interact", "Les clubs du Rotary pour les 12 à 18 ans."], ["Polaris", "Le site des clubs : agenda, inscriptions et espace membres."], ["Président élu", "Le président ou la présidente de l'année suivante, déjà choisi."], ["RAC", "Rotaract Club."], ["RC", "Rotary Club."], ["RI", "Rotary International, l'organisation mondiale."], ["Rotex", "D'anciens étudiants d'échange du Rotary qui encadrent les actuels."], ["Fondation Rotary", "La fondation du Rotary. Elle finance des projets dans le monde entier."], ["RYLA", "Rotary Youth Leadership Awards : un séminaire de leadership pour les jeunes."], ["Club parrain", "Le Rotary club qui soutient votre club Rotaract."], ["Stamm", "La rencontre régulière et détendue d'un club."]] },
});
Object.assign(I18N.it, {
  app_lead: "Tutti gli eventi Rotaract pubblici di Svizzera e Liechtenstein, in un solo posto.", read_on: "Per saperne di più", app_know_h: "Buono a sapersi",
  app_tabs: ["I tuoi club a colpo d'occhio", "Tutti i club, con ricerca e mappa", "Il mese in una vista"],
  app_know: [["Aggiornato ogni 6 ore", "Letto dalle pagine Polaris dei club."], ["Iscrizione su Polaris", "«Iscriviti» ti porta direttamente lì."], ["Funziona offline", "Con gli ultimi eventi caricati."], ["Nessuna notifica", "Abbonati a un calendario per i promemoria."]],
  ab_sub_sub: "Gli eventi nel calendario del tuo telefono, sempre aggiornati",
  nm: { h: "Nuovo nel club", hi: "Benvenuto nel {club}", hi0: "Benvenuto nel Rotaract", lead: "Che bello averti con noi. Quattro piccoli passi e sei pronto.", steps_h: "I tuoi primi passi",
    steps: [["Procurati l'accesso a Polaris", "Chiedi al tuo comitato. Ti serve per iscriverti."], ["Scegli il tuo club principale", "La Home mostra così gli eventi del tuo club."], ["Abbonati al calendario", "Gli eventi arrivano nel calendario del tuo telefono."], ["Vieni al prossimo evento", "Guarda cosa c'è in programma."]],
    facts: [["1° luglio", "inizia l'anno Rotaract"], ["{n}", "club in cui sei benvenuto"], ["3", "distretti: 1980, 1990, 2000"]],
    words_h: "Le parole del Rotaract", words_sub: "Cerca i nomi e le espressioni che senti", words_ph: "Cerca una parola", words_none: "Questa parola qui manca ancora.",
    words: [["Comitato", "I soci che guidano il club per un anno."], ["Charter", "La fondazione ufficiale di un club, e la festa che la celebra."], ["Distretto", "Una regione del Rotary. Svizzera e Liechtenstein ne hanno tre."], ["DG", "Governatore distrettuale. Guida i Rotary club di un distretto per un anno."], ["DRR", "District Rotaract Representative. Rappresenta i Rotaract club di un distretto."], ["End Polio Now", "La campagna mondiale del Rotary contro la polio."], ["Prova delle quattro domande", "Le quattro domande del Rotary per ciò che pensiamo, diciamo e facciamo."], ["Ospite", "Chi viene agli eventi prima di diventare socio."], ["Passaggio delle consegne", "Il comitato passa gli incarichi al successivo, intorno al 1° luglio."], ["Hands-on", "Un progetto sociale in cui i soci lavorano in prima persona."], ["Inner Wheel", "Un'organizzazione internazionale di servizio femminile, vicina al Rotary."], ["Interact", "I club del Rotary per ragazzi dai 12 ai 18 anni."], ["Polaris", "Il sito dei club: agenda, iscrizioni e area soci."], ["Presidente eletto", "Il o la presidente dell'anno prossimo, già scelto."], ["RAC", "Rotaract Club."], ["RC", "Rotary Club."], ["RI", "Rotary International, l'organizzazione mondiale."], ["Rotex", "Ex studenti di scambio del Rotary che seguono quelli attuali."], ["Fondazione Rotary", "La fondazione del Rotary. Finanzia progetti in tutto il mondo."], ["RYLA", "Rotary Youth Leadership Awards: un seminario di leadership per giovani."], ["Club padrino", "Il Rotary club che sostiene il tuo Rotaract club."], ["Stamm", "L'incontro regolare e informale di un club."]] },
});

// "This app", shorter: the four caveats, what the app can't see, what stays on the device
Object.assign(I18N.en, {
  app_know: [["Fresh every 6 hours", "That is how often the app reads the clubs' Polaris pages."], ["Register on Polaris", "The app only shows events. Signing up stays on Polaris."], ["Works offline", "You see the events from your last visit."], ["No notifications", "For reminders, subscribe to the calendar."]],
  pub_lead: "The app sees what anyone sees on Polaris without logging in. It can't see:", pub_no: ["Your Polaris login", "Your sign-ups", "Details of members-only events"], pub_do: "For those, log in on Polaris.",
  app_data: ["Clubs, saved events and settings stay on this device", "No account", "Nothing is sent anywhere"],
});
Object.assign(I18N.de, {
  app_know: [["Alle 6 Stunden frisch", "So oft liest die App die Polaris-Seiten der Clubs."], ["Anmelden auf Polaris", "Die App zeigt die Anlässe nur. Anmelden bleibt auf Polaris."], ["Funktioniert offline", "Du siehst die Anlässe vom letzten Besuch."], ["Keine Mitteilungen", "Für Erinnerungen abonnierst du den Kalender."]],
  pub_lead: "Die App sieht, was alle auf Polaris ohne Login sehen. Sie sieht nicht:", pub_no: ["Dein Polaris-Login", "Deine Anmeldungen", "Details von Anlässen nur für Mitglieder"], pub_do: "Dafür meldest du dich auf Polaris an.",
  app_data: ["Clubs, gemerkte Anlässe und Einstellungen bleiben auf diesem Gerät", "Kein Konto", "Nichts wird irgendwohin gesendet"],
});
Object.assign(I18N.fr, {
  app_know: [["Actualisé toutes les 6 heures", "C'est le rythme auquel l'app lit les pages Polaris des clubs."], ["Inscription sur Polaris", "L'app ne fait que montrer les événements. L'inscription reste sur Polaris."], ["Fonctionne hors ligne", "Vous voyez les événements de votre dernière visite."], ["Pas de notifications", "Pour les rappels, abonnez-vous au calendrier."]],
  pub_lead: "L'app voit ce que tout le monde voit sur Polaris sans connexion. Elle ne voit pas :", pub_no: ["Votre connexion Polaris", "Vos inscriptions", "Les détails des événements réservés aux membres"], pub_do: "Pour cela, connectez-vous sur Polaris.",
  app_data: ["Clubs, événements enregistrés et réglages restent sur cet appareil", "Pas de compte", "Rien n'est envoyé nulle part"],
});
Object.assign(I18N.it, {
  app_know: [["Aggiornato ogni 6 ore", "È la frequenza con cui l'app legge le pagine Polaris dei club."], ["Iscrizione su Polaris", "L'app mostra soltanto gli eventi. L'iscrizione resta su Polaris."], ["Funziona offline", "Vedi gli eventi dell'ultima visita."], ["Nessuna notifica", "Per i promemoria, abbonati al calendario."]],
  pub_lead: "L'app vede ciò che chiunque vede su Polaris senza accesso. Non vede:", pub_no: ["Il tuo accesso a Polaris", "Le tue iscrizioni", "I dettagli degli eventi solo per soci"], pub_do: "Per questo, accedi a Polaris.",
  app_data: ["Club, eventi salvati e impostazioni restano su questo dispositivo", "Nessun account", "Nulla viene inviato altrove"],
});

// more Rotaract words
I18N.en.nm.words.push(["Rotaract", "Rotary's clubs for young adults from 18."], ["Rotary", "The worldwide service organisation that Rotaract belongs to."], ["Rotaractor", "A member of a Rotaract club."], ["Rotarian", "A member of a Rotary club."], ["President", "Leads the club for one Rotaract year."], ["Past President", "Last year's president. Often stays on the board to advise."], ["Secretary", "Keeps the minutes, the member list and the club's mail."], ["Treasurer", "Looks after the club's money and the membership fees."], ["General assembly", "The yearly meeting where members elect the board and approve the accounts."], ["Membership fee", "What each member pays the club per year."], ["Rotaract year", "From 1 July to 30 June. The board changes with it."], ["Service", "Doing good for others. The core of Rotary and Rotaract."], ["Service Above Self", "Rotary's motto."], ["Fellowship", "The friendship among members, in the club and worldwide."], ["Fundraising", "Collecting money for a good cause."], ["Twin club", "A partner Rotaract club abroad."], ["MDIO", "Multi-District Information Organisation. The national umbrella of the Rotaract clubs."], ["ERIC", "European Rotaract Information Centre. The European umbrella."], ["EUCO", "European Convention. The big yearly meeting of Rotaract in Europe."], ["REM", "Rotaract European Meeting. A weekend where European Rotaractors meet."], ["Convention", "Rotary International's yearly world meeting."], ["District conference", "The yearly meeting of a district."], ["PETS", "Presidents-elect training seminar. Prepares next year's presidents."], ["Paul Harris", "Founded Rotary in Chicago in 1905."], ["Paul Harris Fellow", "Recognition for a gift of 1,000 US dollars to the Rotary Foundation."], ["Youth Exchange", "Rotary's school exchange for teenagers."], ["World Rotaract Week", "The week around 13 March, the day Rotaract was founded in 1968."], ["Pin", "The small badge members wear."], ["Banner", "A small club flag, exchanged when clubs visit each other."], ["Areas of focus", "The seven causes Rotary concentrates on."]);
I18N.de.nm.words.push(["Rotaract", "Rotarys Clubs für junge Erwachsene ab 18."], ["Rotary", "Die weltweite Serviceorganisation, zu der Rotaract gehört."], ["Rotaracter", "Mitglied eines Rotaract Clubs."], ["Rotarier", "Mitglied eines Rotary Clubs."], ["Präsident", "Leitet den Club für ein Rotaract-Jahr."], ["Past President", "Präsident oder Präsidentin des letzten Jahres. Bleibt oft beratend im Vorstand."], ["Sekretär", "Führt Protokoll, Mitgliederliste und die Post des Clubs."], ["Kassier", "Kümmert sich um das Geld des Clubs und die Mitgliederbeiträge."], ["Generalversammlung (GV)", "Das jährliche Treffen, an dem die Mitglieder den Vorstand wählen und die Rechnung abnehmen."], ["Mitgliederbeitrag", "Was jedes Mitglied dem Club pro Jahr bezahlt."], ["Rotaract-Jahr", "Vom 1. Juli bis 30. Juni. Mit ihm wechselt der Vorstand."], ["Service", "Gutes für andere tun. Der Kern von Rotary und Rotaract."], ["Service Above Self", "Rotarys Motto: selbstloses Dienen."], ["Fellowship", "Die Freundschaft unter Mitgliedern, im Club und weltweit."], ["Fundraising", "Geld sammeln für einen guten Zweck."], ["Kontaktclub", "Ein Partner-Rotaract-Club im Ausland, auch Twin Club genannt."], ["MDIO", "Multi-District Information Organisation. Der nationale Dachverband der Rotaract Clubs."], ["ERIC", "European Rotaract Information Centre. Der europäische Dachverband."], ["EUCO", "European Convention. Das grosse jährliche Treffen von Rotaract in Europa."], ["REM", "Rotaract European Meeting. Ein Wochenende, an dem sich europäische Rotaracter treffen."], ["Convention", "Das jährliche Welttreffen von Rotary International."], ["Distriktskonferenz", "Das jährliche Treffen eines Distrikts."], ["PETS", "Presidents-elect Training Seminar. Bereitet die Präsidien des nächsten Jahres vor."], ["Paul Harris", "Gründete Rotary 1905 in Chicago."], ["Paul Harris Fellow", "Auszeichnung für eine Spende von 1000 US-Dollar an die Rotary Foundation."], ["Jugendaustausch", "Rotarys Schüleraustausch für Jugendliche."], ["World Rotaract Week", "Die Woche um den 13. März, den Gründungstag von Rotaract 1968."], ["Pin", "Das kleine Abzeichen, das Mitglieder tragen."], ["Wimpel", "Eine kleine Clubfahne, die Clubs bei Besuchen austauschen."], ["Schwerpunktbereiche", "Die sieben Themen, auf die sich Rotary konzentriert."]);
I18N.fr.nm.words.push(["Rotaract", "Les clubs du Rotary pour les jeunes adultes dès 18 ans."], ["Rotary", "L'organisation de service mondiale dont le Rotaract fait partie."], ["Rotaractien", "Membre d'un club Rotaract."], ["Rotarien", "Membre d'un Rotary club."], ["Président", "Dirige le club pendant une année Rotaract."], ["Past-président", "Le président ou la présidente de l'année précédente. Reste souvent au comité comme conseil."], ["Secrétaire", "Tient les procès-verbaux, la liste des membres et le courrier du club."], ["Trésorier", "S'occupe de l'argent du club et des cotisations."], ["Assemblée générale (AG)", "La réunion annuelle où les membres élisent le comité et approuvent les comptes."], ["Cotisation", "Ce que chaque membre verse au club par année."], ["Année Rotaract", "Du 1er juillet au 30 juin. Le comité change avec elle."], ["Service", "Faire le bien pour les autres. Le cœur du Rotary et du Rotaract."], ["Servir d'abord", "La devise du Rotary (Service Above Self)."], ["Fellowship", "L'amitié entre membres, dans le club et dans le monde."], ["Collecte de fonds", "Récolter de l'argent pour une bonne cause."], ["Club contact", "Un club Rotaract partenaire à l'étranger, aussi appelé twin club."], ["MDIO", "Multi-District Information Organisation. L'organisation faîtière nationale des clubs Rotaract."], ["ERIC", "European Rotaract Information Centre. L'organisation faîtière européenne."], ["EUCO", "European Convention. La grande rencontre annuelle du Rotaract en Europe."], ["REM", "Rotaract European Meeting. Un week-end où les Rotaractiens européens se rencontrent."], ["Convention", "La rencontre mondiale annuelle du Rotary International."], ["Conférence de district", "La rencontre annuelle d'un district."], ["PETS", "Presidents-elect training seminar. Prépare les présidents de l'année suivante."], ["Paul Harris", "A fondé le Rotary à Chicago en 1905."], ["Paul Harris Fellow", "Distinction pour un don de 1000 dollars US à la Fondation Rotary."], ["Échange de jeunes", "L'échange scolaire du Rotary pour les adolescents."], ["World Rotaract Week", "La semaine autour du 13 mars, jour de la fondation du Rotaract en 1968."], ["Pin's", "Le petit insigne que portent les membres."], ["Fanion", "Un petit drapeau de club, échangé lors des visites entre clubs."], ["Axes stratégiques", "Les sept causes sur lesquelles le Rotary se concentre."]);
I18N.it.nm.words.push(["Rotaract", "I club del Rotary per giovani adulti dai 18 anni."], ["Rotary", "L'organizzazione di servizio mondiale di cui il Rotaract fa parte."], ["Rotaractiano", "Socio di un Rotaract club."], ["Rotariano", "Socio di un Rotary club."], ["Presidente", "Guida il club per un anno Rotaract."], ["Past President", "Il o la presidente dell'anno precedente. Spesso resta nel comitato come consigliere."], ["Segretario", "Tiene i verbali, l'elenco dei soci e la corrispondenza del club."], ["Tesoriere", "Si occupa del denaro del club e delle quote sociali."], ["Assemblea generale", "La riunione annuale in cui i soci eleggono il comitato e approvano i conti."], ["Quota sociale", "Ciò che ogni socio versa al club ogni anno."], ["Anno Rotaract", "Dal 1° luglio al 30 giugno. Con esso cambia il comitato."], ["Service", "Fare del bene per gli altri. Il cuore del Rotary e del Rotaract."], ["Servire al di sopra di ogni interesse personale", "Il motto del Rotary (Service Above Self)."], ["Fellowship", "L'amicizia tra soci, nel club e nel mondo."], ["Raccolta fondi", "Raccogliere denaro per una buona causa."], ["Club contatto", "Un Rotaract club partner all'estero, detto anche twin club."], ["MDIO", "Multi-District Information Organisation. L'organizzazione mantello nazionale dei Rotaract club."], ["ERIC", "European Rotaract Information Centre. L'organizzazione mantello europea."], ["EUCO", "European Convention. Il grande incontro annuale del Rotaract in Europa."], ["REM", "Rotaract European Meeting. Un fine settimana in cui i rotaractiani europei si incontrano."], ["Convention", "L'incontro mondiale annuale del Rotary International."], ["Congresso distrettuale", "L'incontro annuale di un distretto."], ["PETS", "Presidents-elect training seminar. Prepara i presidenti dell'anno successivo."], ["Paul Harris", "Fondò il Rotary a Chicago nel 1905."], ["Paul Harris Fellow", "Riconoscimento per una donazione di 1000 dollari USA alla Fondazione Rotary."], ["Scambio giovani", "Lo scambio scolastico del Rotary per adolescenti."], ["World Rotaract Week", "La settimana attorno al 13 marzo, giorno di fondazione del Rotaract nel 1968."], ["Spilla", "Il piccolo distintivo che portano i soci."], ["Gagliardetto", "Una piccola bandiera del club, scambiata durante le visite tra club."], ["Aree d'intervento", "Le sette cause su cui il Rotary si concentra."]);
