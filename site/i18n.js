// UI strings. Pick with ?lang=, the saved choice, or the device language; English otherwise.
const I18N = {
en: {
  events: "Events", theme: "Switch light/dark", share: "Share", install: "Install", language: "Language",
  credits: "Every public Rotaract event in Switzerland & Liechtenstein · made by Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Subscribe",
  skip_to: "Skip to events", search: "Search", search_ph: "Search events, places, clubs…", filters: "Filters",
  v_all: "Upcoming", v_week: "This week", v_weekend: "Weekend", v_near: "Near me", v_saved: "Saved ★", v_past: "Past",
  district: "District", clubs: "Clubs", all: "All", place_ph: "Near a place or postcode", locate: "Use my location",
  radius: "Radius", any_distance: "Any distance", clear: "Clear", layout: "Layout", list: "List", month: "Month", loading: "Loading events…",
  d1980: "D1980 · Central & North-West", d1990: "D1990 · West", d2000: "D2000 · East",
  one_event: "1 event", n_events: "{n} events",
  s_all: "{n} upcoming", s_week: "{n} in the next 7 days", s_weekend: "{n} this weekend", s_near: "{n} near you", s_saved: "{n} saved", s_past: "{n} past", s_month: "{n} in {m}",
  within: "within {r} km of {place}", no_location: "{n} without a known location hidden",
  you: "you", your_location: "📍 Your location", place_nf: "Place not found", place_err: "Couldn't look up the place (offline?)", locating: "Locating…", loc_na: "Location not available", loc_none: "Location isn't available here",
  empty_saved: "Nothing saved yet. Tap the star on an event to keep it here.", empty: "No events match.", show_all: "Show all upcoming",
  all_day: "all day", cancelled: "Cancelled", save: "Save event", saved: "Saved ★", unsaved: "Removed from saved",
  no_desc: "No description on Polaris.", when: "When", where: "Where", registration: "Registration", club: "Club", register: "Register on Polaris", add_cal: "Add to calendar", share_event: "Share",
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
  stale: "The events haven't been updated since {t} and may be out of date.", offline: "Couldn't load events. Are you online?", new_version: "New version available", refresh: "Refresh",
  // subscribe page
  back: "‹ Back to events", sp_intro: "A subscription puts the events into the calendar app you already use and keeps them up to date by itself: new events appear, moved ones move, cancelled ones are marked. Nothing to install. Members-only events are not included; registration still happens on Polaris.",
  sp_ios: "iPhone / iPad (Apple Calendar)", sp_ios_s: ["Tap Apple / Outlook next to a calendar below.", "Confirm \"Subscribe\" in the dialog that opens.", "Done. It updates by itself (Settings › Calendar › Accounts lets you change how often)."],
  sp_google: "Google Calendar", sp_google_s: ["Tap Google next to a calendar below. On a phone this opens the Google Calendar website; sign in if asked.", "Confirm \"Add calendar\".", "In the Google Calendar app, open Settings and make sure the new calendar is switched on. Google refreshes subscribed calendars every few hours up to a day."],
  sp_android: "Android (Samsung or other calendar apps)", sp_android_s: ["Use the Google button: most Android calendar apps show your Google calendars.", "Then enable the new calendar in your calendar app's settings."],
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Tap Apple / Outlook. On a Mac this opens Calendar; in Outlook choose \"Add calendar › Subscribe from web\".", "If nothing opens, copy the .ics link and paste it into \"Add calendar from URL\" in your calendar app."],
  sp_all: "Everything", sp_all_text: "One calendar with every public Rotaract event in Switzerland & Liechtenstein, all clubs together.", sp_all_feed: "All Rotaract events in Switzerland & Liechtenstein",
  sp_club: "Per club", sp_club_text: "Subscribe to the clubs you care about. You can add several.", national: "National",
  // club page
  cp_next: "Next events", cp_none: "No upcoming public events.", cp_site: "Club website", cp_all: "All events of this club in the app", cp_sub: "Subscribe to this club's calendar",
},
de: {
  events: "Events", theme: "Hell/Dunkel wechseln", share: "Teilen", install: "Installieren", language: "Sprache",
  credits: "Alle öffentlichen Rotaract-Anlässe der Schweiz & Liechtensteins · von Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Abonnieren",
  skip_to: "Zu den Anlässen", search: "Suche", search_ph: "Anlässe, Orte, Clubs suchen…", filters: "Filter",
  v_all: "Demnächst", v_week: "Diese Woche", v_weekend: "Wochenende", v_near: "In der Nähe", v_saved: "Gemerkt ★", v_past: "Vergangene",
  district: "Distrikt", clubs: "Clubs", all: "Alle", place_ph: "In der Nähe von Ort oder PLZ", locate: "Meinen Standort verwenden",
  radius: "Umkreis", any_distance: "Beliebige Distanz", clear: "Zurücksetzen", layout: "Ansicht", list: "Liste", month: "Monat", loading: "Anlässe werden geladen…",
  d1980: "D1980 · Zentral- & Nordwestschweiz", d1990: "D1990 · Westschweiz", d2000: "D2000 · Ostschweiz",
  one_event: "1 Anlass", n_events: "{n} Anlässe",
  s_all: "{n} demnächst", s_week: "{n} in den nächsten 7 Tagen", s_weekend: "{n} dieses Wochenende", s_near: "{n} in deiner Nähe", s_saved: "{n} gemerkt", s_past: "{n} vergangene", s_month: "{n} im {m}",
  within: "im Umkreis von {r} km um {place}", no_location: "{n} ohne bekannten Ort ausgeblendet",
  you: "dir", your_location: "📍 Dein Standort", place_nf: "Ort nicht gefunden", place_err: "Ort konnte nicht gesucht werden (offline?)", locating: "Standort wird ermittelt…", loc_na: "Standort nicht verfügbar", loc_none: "Standort ist hier nicht verfügbar",
  empty_saved: "Noch nichts gemerkt. Tippe auf den Stern bei einem Anlass.", empty: "Keine passenden Anlässe.", show_all: "Alle kommenden anzeigen",
  all_day: "ganztags", cancelled: "Abgesagt", save: "Anlass merken", saved: "Gemerkt ★", unsaved: "Nicht mehr gemerkt",
  no_desc: "Keine Beschreibung auf Polaris.", when: "Wann", where: "Wo", registration: "Anmeldung", club: "Club", register: "Auf Polaris anmelden", add_cal: "In Kalender", share_event: "Teilen",
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
  stale: "Die Anlässe wurden seit {t} nicht aktualisiert und sind möglicherweise veraltet.", offline: "Anlässe konnten nicht geladen werden. Bist du online?", new_version: "Neue Version verfügbar", refresh: "Neu laden",
  back: "‹ Zurück zu den Anlässen", sp_intro: "Ein Abo bringt die Anlässe in die Kalender-App, die du schon nutzt, und hält sie von selbst aktuell: neue Anlässe erscheinen, verschobene wandern mit, abgesagte werden markiert. Nichts zu installieren. Anlässe nur für Mitglieder sind nicht enthalten; die Anmeldung läuft weiterhin über Polaris.",
  sp_ios: "iPhone / iPad (Apple Kalender)", sp_ios_s: ["Bei einem Kalender unten auf Apple / Outlook tippen.", "Im Dialog «Abonnieren» bestätigen.", "Fertig. Aktualisiert sich von selbst (unter Einstellungen › Kalender › Accounts lässt sich das Intervall ändern)."],
  sp_google: "Google Kalender", sp_google_s: ["Bei einem Kalender unten auf Google tippen. Auf dem Handy öffnet sich die Google-Kalender-Website; falls nötig anmelden.", "«Kalender hinzufügen» bestätigen.", "In der Google-Kalender-App die Einstellungen öffnen und den neuen Kalender einschalten. Google aktualisiert abonnierte Kalender alle paar Stunden bis zu einem Tag."],
  sp_android: "Android (Samsung oder andere Kalender-Apps)", sp_android_s: ["Den Google-Button nutzen: die meisten Android-Kalender zeigen deine Google-Kalender.", "Danach den neuen Kalender in den Einstellungen der Kalender-App aktivieren."],
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Auf Apple / Outlook tippen. Auf dem Mac öffnet sich Kalender; in Outlook «Kalender hinzufügen › Aus dem Internet abonnieren» wählen.", "Falls sich nichts öffnet: den .ics-Link kopieren und in der Kalender-App unter «Kalender per URL hinzufügen» einfügen."],
  sp_all: "Alles", sp_all_text: "Ein Kalender mit allen öffentlichen Rotaract-Anlässen der Schweiz & Liechtensteins, alle Clubs zusammen.", sp_all_feed: "Alle Rotaract-Anlässe der Schweiz & Liechtensteins",
  sp_club: "Pro Club", sp_club_text: "Abonniere die Clubs, die dich interessieren. Mehrere sind möglich.", national: "National",
  cp_next: "Nächste Anlässe", cp_none: "Keine kommenden öffentlichen Anlässe.", cp_site: "Club-Website", cp_all: "Alle Anlässe dieses Clubs in der App", cp_sub: "Kalender dieses Clubs abonnieren",
},
fr: {
  events: "Événements", theme: "Mode clair/sombre", share: "Partager", install: "Installer", language: "Langue",
  credits: "Tous les événements Rotaract publics de Suisse & du Liechtenstein · par Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "S'abonner",
  skip_to: "Aller aux événements", search: "Recherche", search_ph: "Chercher des événements, lieux, clubs…", filters: "Filtres",
  v_all: "À venir", v_week: "Cette semaine", v_weekend: "Week-end", v_near: "Près de moi", v_saved: "Enregistrés ★", v_past: "Passés",
  district: "District", clubs: "Clubs", all: "Tous", place_ph: "Près d'un lieu ou NPA", locate: "Utiliser ma position",
  radius: "Rayon", any_distance: "Toute distance", clear: "Effacer", layout: "Affichage", list: "Liste", month: "Mois", loading: "Chargement des événements…",
  d1980: "D1980 · Centre & Nord-Ouest", d1990: "D1990 · Romandie", d2000: "D2000 · Est",
  one_event: "1 événement", n_events: "{n} événements",
  s_all: "{n} à venir", s_week: "{n} dans les 7 prochains jours", s_weekend: "{n} ce week-end", s_near: "{n} près de vous", s_saved: "{n} enregistrés", s_past: "{n} passés", s_month: "{n} en {m}",
  within: "à moins de {r} km de {place}", no_location: "{n} sans lieu connu masqués",
  you: "vous", your_location: "📍 Votre position", place_nf: "Lieu introuvable", place_err: "Recherche du lieu impossible (hors ligne ?)", locating: "Localisation…", loc_na: "Position indisponible", loc_none: "La position n'est pas disponible ici",
  empty_saved: "Rien d'enregistré. Touchez l'étoile d'un événement pour le garder ici.", empty: "Aucun événement ne correspond.", show_all: "Afficher tout ce qui vient",
  all_day: "toute la journée", cancelled: "Annulé", save: "Enregistrer l'événement", saved: "Enregistré ★", unsaved: "Retiré des enregistrés",
  no_desc: "Pas de description sur Polaris.", when: "Quand", where: "Où", registration: "Inscription", club: "Club", register: "S'inscrire sur Polaris", add_cal: "Ajouter au calendrier", share_event: "Partager",
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
  stale: "Les événements n'ont pas été mis à jour depuis {t} et peuvent être obsolètes.", offline: "Impossible de charger les événements. Êtes-vous en ligne ?", new_version: "Nouvelle version disponible", refresh: "Recharger",
  back: "‹ Retour aux événements", sp_intro: "Un abonnement place les événements dans l'app de calendrier que vous utilisez déjà et les garde à jour tout seul : les nouveaux apparaissent, les déplacés bougent, les annulés sont marqués. Rien à installer. Les événements réservés aux membres ne sont pas inclus ; l'inscription se fait toujours sur Polaris.",
  sp_ios: "iPhone / iPad (Calendrier Apple)", sp_ios_s: ["Touchez Apple / Outlook à côté d'un calendrier ci-dessous.", "Confirmez « S'abonner » dans la fenêtre qui s'ouvre.", "C'est fait. Il se met à jour tout seul (Réglages › Calendrier › Comptes permet de changer la fréquence)."],
  sp_google: "Google Agenda", sp_google_s: ["Touchez Google à côté d'un calendrier ci-dessous. Sur téléphone, le site Google Agenda s'ouvre ; connectez-vous si demandé.", "Confirmez « Ajouter l'agenda ».", "Dans l'app Google Agenda, ouvrez les paramètres et activez le nouvel agenda. Google actualise les agendas abonnés toutes les quelques heures, jusqu'à un jour."],
  sp_android: "Android (Samsung ou autres apps de calendrier)", sp_android_s: ["Utilisez le bouton Google : la plupart des apps de calendrier Android affichent vos agendas Google.", "Activez ensuite le nouvel agenda dans les réglages de votre app."],
  sp_outlook: "Outlook / Windows / Mac", sp_outlook_s: ["Touchez Apple / Outlook. Sur Mac, Calendrier s'ouvre ; dans Outlook, choisissez « Ajouter un calendrier › S'abonner depuis le web ».", "Si rien ne s'ouvre, copiez le lien .ics et collez-le dans « Ajouter un calendrier par URL » de votre app."],
  sp_all: "Tout", sp_all_text: "Un calendrier avec tous les événements Rotaract publics de Suisse & du Liechtenstein, tous les clubs ensemble.", sp_all_feed: "Tous les événements Rotaract de Suisse & du Liechtenstein",
  sp_club: "Par club", sp_club_text: "Abonnez-vous aux clubs qui vous intéressent. Plusieurs sont possibles.", national: "National",
  cp_next: "Prochains événements", cp_none: "Aucun événement public à venir.", cp_site: "Site du club", cp_all: "Tous les événements de ce club dans l'app", cp_sub: "S'abonner au calendrier de ce club",
},
it: {
  events: "Eventi", theme: "Chiaro/scuro", share: "Condividi", install: "Installa", language: "Lingua",
  credits: "Tutti gli eventi Rotaract pubblici di Svizzera e Liechtenstein · di Jean-Michel Carrel, Rotaract Club Luzern", subscribe: "Abbonati",
  skip_to: "Vai agli eventi", search: "Cerca", search_ph: "Cerca eventi, luoghi, club…", filters: "Filtri",
  v_all: "Prossimi", v_week: "Questa settimana", v_weekend: "Weekend", v_near: "Vicino a me", v_saved: "Salvati ★", v_past: "Passati",
  district: "Distretto", clubs: "Club", all: "Tutti", place_ph: "Vicino a un luogo o NPA", locate: "Usa la mia posizione",
  radius: "Raggio", any_distance: "Qualsiasi distanza", clear: "Azzera", layout: "Vista", list: "Lista", month: "Mese", loading: "Caricamento eventi…",
  d1980: "D1980 · Centro & Nord-Ovest", d1990: "D1990 · Ovest", d2000: "D2000 · Est",
  one_event: "1 evento", n_events: "{n} eventi",
  s_all: "{n} in arrivo", s_week: "{n} nei prossimi 7 giorni", s_weekend: "{n} questo weekend", s_near: "{n} vicino a te", s_saved: "{n} salvati", s_past: "{n} passati", s_month: "{n} a {m}",
  within: "entro {r} km da {place}", no_location: "{n} senza luogo noto nascosti",
  you: "te", your_location: "📍 La tua posizione", place_nf: "Luogo non trovato", place_err: "Impossibile cercare il luogo (offline?)", locating: "Localizzazione…", loc_na: "Posizione non disponibile", loc_none: "La posizione non è disponibile qui",
  empty_saved: "Nulla di salvato. Tocca la stella di un evento per tenerlo qui.", empty: "Nessun evento corrisponde.", show_all: "Mostra tutti i prossimi",
  all_day: "tutto il giorno", cancelled: "Annullato", save: "Salva evento", saved: "Salvato ★", unsaved: "Rimosso dai salvati",
  no_desc: "Nessuna descrizione su Polaris.", when: "Quando", where: "Dove", registration: "Iscrizione", club: "Club", register: "Iscriviti su Polaris", add_cal: "Aggiungi al calendario", share_event: "Condividi",
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
  stale: "Gli eventi non vengono aggiornati da {t} e potrebbero non essere attuali.", offline: "Impossibile caricare gli eventi. Sei online?", new_version: "Nuova versione disponibile", refresh: "Ricarica",
  back: "‹ Torna agli eventi", sp_intro: "Un abbonamento mette gli eventi nell'app calendario che già usi e li tiene aggiornati da solo: i nuovi compaiono, quelli spostati si spostano, quelli annullati vengono segnati. Niente da installare. Gli eventi riservati ai soci non sono inclusi; l'iscrizione avviene sempre su Polaris.",
  sp_ios: "iPhone / iPad (Calendario Apple)", sp_ios_s: ["Tocca Apple / Outlook accanto a un calendario qui sotto.", "Conferma «Iscriviti» nella finestra che si apre.", "Fatto. Si aggiorna da solo (in Impostazioni › Calendario › Account puoi cambiare la frequenza)."],
  sp_google: "Google Calendar", sp_google_s: ["Tocca Google accanto a un calendario qui sotto. Sul telefono si apre il sito di Google Calendar; accedi se richiesto.", "Conferma «Aggiungi calendario».", "Nell'app Google Calendar apri le impostazioni e attiva il nuovo calendario. Google aggiorna i calendari abbonati ogni qualche ora, fino a un giorno."],
  sp_android: "Android (Samsung o altre app calendario)", sp_android_s: ["Usa il pulsante Google: la maggior parte delle app calendario Android mostra i tuoi calendari Google.", "Poi attiva il nuovo calendario nelle impostazioni della tua app."],
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
  settings: "Settings", my_clubs: "My clubs", everything: "Everything", main_club: "Main club", also_show: "Also show", none: "None",
  set_hint: "Your main club and the clubs you also follow make up the \"My clubs\" view. Searching and filtering never changes this.",
  theme_light: "Light", theme_dark: "Dark", about: "What is Rotaract?", change: "Change", home_banner: "Your clubs", no_home: "No main club chosen yet",
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
  settings: "Einstellungen", my_clubs: "Meine Clubs", everything: "Alles", main_club: "Hauptclub", also_show: "Auch anzeigen", none: "Keiner",
  set_hint: "Dein Hauptclub und die Clubs, denen du auch folgst, bilden die Ansicht «Meine Clubs». Suchen und Filtern ändert das nie.",
  theme_light: "Hell", theme_dark: "Dunkel", about: "Was ist Rotaract?", change: "Ändern", home_banner: "Deine Clubs", no_home: "Noch kein Hauptclub gewählt",
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
  settings: "Réglages", my_clubs: "Mes clubs", everything: "Tout", main_club: "Club principal", also_show: "Afficher aussi", none: "Aucun",
  set_hint: "Votre club principal et les clubs que vous suivez forment la vue « Mes clubs ». Chercher et filtrer ne change jamais cela.",
  theme_light: "Clair", theme_dark: "Sombre", about: "Qu'est-ce que Rotaract ?", change: "Modifier", home_banner: "Vos clubs", no_home: "Aucun club principal choisi",
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
  settings: "Impostazioni", my_clubs: "I miei club", everything: "Tutto", main_club: "Club principale", also_show: "Mostra anche", none: "Nessuno",
  set_hint: "Il tuo club principale e i club che segui formano la vista «I miei club». Cercare e filtrare non la cambia mai.",
  theme_light: "Chiaro", theme_dark: "Scuro", about: "Cos'è Rotaract?", change: "Modifica", home_banner: "I tuoi club", no_home: "Nessun club principale scelto",
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
  ab_people: "Young people, 18 to 30.", ab_people_t: "16 clubs between Geneva and Chur. Come to an event; the rest follows.",
  ab_find_title: "No club yet? Find yours", ab_more: "Rotary, districts & the world", ab_more_sub: "In pictures, one minute →", ab_back: "‹ Learn. Help. Celebrate.",
  sp_rotary: "Rotaract is part of Rotary", sp_rotary_t: "Since 1968. Every club has a Rotary club as its sponsor; at 30 it's the natural next step.",
  sp_dist: "16 clubs, three districts", sp_dist_t: "From Geneva to Chur. One conference a year, all together.",
  sp_world: "And the world", sp_world_t: "10,000 clubs in 180 countries. A club abroad takes you in like at home.",
});
Object.assign(I18N.de, {
  home: "Start", discover: "Entdecken", discover_title: "Ganz Rotaract entdecken", discover_cta: "Alles entdecken", search_mine_ph: "In deinen Clubs suchen…",
  no_clubs_yet: "Noch keine Clubs gewählt", choose_clubs: "Clubs wählen", or_discover: "Oder zuerst alles entdecken.", back: "‹ Zurück",
  next_event: "Nächster Anlass", in_days: "in {n} Tagen", more_events: "Weitere Anlässe", photos: "Bilder", details: "Details", your_club: "Dein Club", go: "Los →", faq: "Fragen", scroll: "scrollen",
  ab_learn: "Lernen", ab_help: "Helfen", ab_party: "Feiern",
  ab_learn_t: "Vorträge und Firmenbesuche mit Leuten, die man sonst nie trifft.", ab_help_t: "Projekte, die man am Abend noch sieht.", ab_party_t: "Stamm, Reisen, Konferenz. Freunde in jeder Stadt.",
  ab_people: "Junge Leute, 18 bis 30.", ab_people_t: "16 Clubs zwischen Genf und Chur. Komm an einen Anlass, der Rest ergibt sich.",
  ab_find_title: "Noch keinen Club? Finde deinen", ab_more: "Rotary, Distrikte & die Welt", ab_more_sub: "In Bildern, eine Minute →", ab_back: "‹ Lernen. Helfen. Feiern.",
  sp_rotary: "Rotaract gehört zu Rotary", sp_rotary_t: "Seit 1968. Jeder Club hat einen Rotary Club als Paten; mit 30 ist das der natürliche nächste Schritt.",
  sp_dist: "16 Clubs, drei Distrikte", sp_dist_t: "Von Genf bis Chur. Eine Konferenz pro Jahr, alle zusammen.",
  sp_world: "Und die Welt", sp_world_t: "10'000 Clubs in 180 Ländern. Ein Club im Ausland nimmt dich auf wie zu Hause.",
});
Object.assign(I18N.fr, {
  home: "Accueil", discover: "Découvrir", discover_title: "Découvrir tout Rotaract", discover_cta: "Tout découvrir", search_mine_ph: "Chercher dans vos clubs…",
  no_clubs_yet: "Aucun club choisi", choose_clubs: "Choisir vos clubs", or_discover: "Ou commencez par tout découvrir.", back: "‹ Retour",
  next_event: "Prochain événement", in_days: "dans {n} jours", more_events: "Autres événements", photos: "Photos", details: "Détails", your_club: "Votre club", go: "Y aller →", faq: "Questions", scroll: "défiler",
  ab_learn: "Apprendre", ab_help: "Aider", ab_party: "Fêter",
  ab_learn_t: "Conférences et visites d'entreprises avec des gens qu'on ne croiserait jamais.", ab_help_t: "Des projets qu'on voit encore le soir même.", ab_party_t: "Stamm, voyages, la conférence. Des amis dans chaque ville.",
  ab_people: "Des jeunes de 18 à 30 ans.", ab_people_t: "16 clubs entre Genève et Coire. Venez à un événement, le reste suit.",
  ab_find_title: "Pas encore de club ? Trouvez le vôtre", ab_more: "Rotary, districts & le monde", ab_more_sub: "En images, une minute →", ab_back: "‹ Apprendre. Aider. Fêter.",
  sp_rotary: "Rotaract fait partie du Rotary", sp_rotary_t: "Depuis 1968. Chaque club a un Rotary club pour parrain ; à 30 ans, c'est la suite naturelle.",
  sp_dist: "16 clubs, trois districts", sp_dist_t: "De Genève à Coire. Une conférence par an, tous ensemble.",
  sp_world: "Et le monde", sp_world_t: "10 000 clubs dans 180 pays. Un club à l'étranger vous accueille comme chez vous.",
});
Object.assign(I18N.it, {
  home: "Home", discover: "Scopri", discover_title: "Scopri tutto Rotaract", discover_cta: "Scopri tutto", search_mine_ph: "Cerca nei tuoi club…",
  no_clubs_yet: "Nessun club scelto", choose_clubs: "Scegli i tuoi club", or_discover: "Oppure scopri prima tutto.", back: "‹ Indietro",
  next_event: "Prossimo evento", in_days: "tra {n} giorni", more_events: "Altri eventi", photos: "Foto", details: "Dettagli", your_club: "Il tuo club", go: "Vai →", faq: "Domande", scroll: "scorri",
  ab_learn: "Imparare", ab_help: "Aiutare", ab_party: "Festeggiare",
  ab_learn_t: "Conferenze e visite aziendali con persone che altrimenti non incontreresti mai.", ab_help_t: "Progetti che la sera si vedono ancora.", ab_party_t: "Stamm, viaggi, la conferenza. Amici in ogni città.",
  ab_people: "Giovani dai 18 ai 30 anni.", ab_people_t: "16 club tra Ginevra e Coira. Vieni a un evento, il resto viene da sé.",
  ab_find_title: "Nessun club ancora? Trova il tuo", ab_more: "Rotary, distretti e il mondo", ab_more_sub: "In immagini, un minuto →", ab_back: "‹ Imparare. Aiutare. Festeggiare.",
  sp_rotary: "Rotaract fa parte del Rotary", sp_rotary_t: "Dal 1968. Ogni club ha un Rotary club come padrino; a 30 anni è il passo successivo naturale.",
  sp_dist: "16 club, tre distretti", sp_dist_t: "Da Ginevra a Coira. Una conferenza all'anno, tutti insieme.",
  sp_world: "E il mondo", sp_world_t: "10'000 club in 180 paesi. Un club all'estero ti accoglie come a casa.",
});

// navigation, calendar page, settings page, explore mode
Object.assign(I18N.en, {
  calendar: "Calendar", all_clubs_short: "All", mine_short: "My clubs", today_events: "Today", no_events_day: "Nothing on this day.", close: "Close",
  set_clubs_h: "Clubs", set_app_h: "App", set_more_h: "More", subscribe_link: "Subscribe to calendars", saved_settings: "Saved",
  explore_title: "New here?", explore_lead: "Rotaract is for people aged 18 to 30. Pick an event, come along, no membership needed.", tip_of_day: "Tip of the day", explore_near: "Events near you", explore_all: "What is Rotaract?",
  tips: ["Guests are welcome at almost every event. Register on Polaris and just come.", "A \"Stamm\" is the relaxed regular get-together. It's the easiest first visit.", "Every club mixes learning, helping and celebrating a bit differently. Try two.", "You don't need to know anyone. Say you're new; someone will take you along.", "The yearly conference brings all 16 clubs together for a weekend.", "Members pay a yearly fee of a few hundred francs; guests usually nothing.", "Rotaract is part of Rotary: at 30 the Rotary club next door is the natural next step.", "Hands-on projects are the fastest way to see what a club is about."],
  subpage_link: "Rotary & the world",
});
Object.assign(I18N.de, {
  calendar: "Kalender", all_clubs_short: "Alle", mine_short: "Meine Clubs", today_events: "Heute", no_events_day: "Nichts an diesem Tag.", close: "Schliessen",
  set_clubs_h: "Clubs", set_app_h: "App", set_more_h: "Mehr", subscribe_link: "Kalender abonnieren", saved_settings: "Gespeichert",
  explore_title: "Neu hier?", explore_lead: "Rotaract ist für Leute zwischen 18 und 30. Such dir einen Anlass aus und komm vorbei, ohne Mitgliedschaft.", tip_of_day: "Tipp des Tages", explore_near: "Anlässe in deiner Nähe", explore_all: "Was ist Rotaract?",
  tips: ["Gäste sind an fast jedem Anlass willkommen. Auf Polaris anmelden und einfach kommen.", "Der «Stamm» ist das lockere regelmässige Treffen. Der einfachste erste Besuch.", "Jeder Club mischt Lernen, Helfen und Feiern etwas anders. Probier zwei aus.", "Du musst niemanden kennen. Sag, dass du neu bist; jemand nimmt dich mit.", "Die jährliche Konferenz bringt alle 16 Clubs ein Wochenende lang zusammen.", "Mitglieder zahlen einen Jahresbeitrag von ein paar hundert Franken; Gäste meist nichts.", "Rotaract gehört zu Rotary: mit 30 ist der Rotary Club nebenan der natürliche nächste Schritt.", "Hands-on-Projekte zeigen am schnellsten, worum es einem Club geht."],
  subpage_link: "Rotary & die Welt",
});
Object.assign(I18N.fr, {
  calendar: "Calendrier", all_clubs_short: "Tous", mine_short: "Mes clubs", today_events: "Aujourd'hui", no_events_day: "Rien ce jour-là.", close: "Fermer",
  set_clubs_h: "Clubs", set_app_h: "App", set_more_h: "Plus", subscribe_link: "S'abonner aux calendriers", saved_settings: "Enregistré",
  explore_title: "Nouveau ici ?", explore_lead: "Rotaract s'adresse aux 18–30 ans. Choisissez un événement et venez, sans adhésion.", tip_of_day: "Conseil du jour", explore_near: "Événements près de vous", explore_all: "Qu'est-ce que Rotaract ?",
  tips: ["Les invités sont les bienvenus à presque tous les événements. Inscrivez-vous sur Polaris et venez.", "Le « stamm » est la rencontre régulière et décontractée. La première visite la plus simple.", "Chaque club mélange apprendre, aider et fêter à sa façon. Essayez-en deux.", "Pas besoin de connaître quelqu'un. Dites que vous êtes nouveau ; on vous prendra avec.", "La conférence annuelle réunit les 16 clubs pendant un week-end.", "Les membres paient une cotisation annuelle de quelques centaines de francs ; les invités généralement rien.", "Rotaract fait partie du Rotary : à 30 ans, le Rotary club d'à côté est la suite naturelle.", "Les projets concrets montrent le plus vite ce qu'est un club."],
  subpage_link: "Rotary & le monde",
});
Object.assign(I18N.it, {
  calendar: "Calendario", all_clubs_short: "Tutti", mine_short: "I miei club", today_events: "Oggi", no_events_day: "Niente in questo giorno.", close: "Chiudi",
  set_clubs_h: "Club", set_app_h: "App", set_more_h: "Altro", subscribe_link: "Abbonati ai calendari", saved_settings: "Salvato",
  explore_title: "Nuovo qui?", explore_lead: "Rotaract è per chi ha tra 18 e 30 anni. Scegli un evento e vieni, senza iscrizione.", tip_of_day: "Consiglio del giorno", explore_near: "Eventi vicino a te", explore_all: "Cos'è Rotaract?",
  tips: ["Gli ospiti sono benvenuti quasi a ogni evento. Iscriviti su Polaris e vieni.", "Lo «stamm» è l'incontro regolare informale. La prima visita più semplice.", "Ogni club combina imparare, aiutare e festeggiare a modo suo. Provane due.", "Non serve conoscere nessuno. Di' che sei nuovo; qualcuno ti porterà con sé.", "La conferenza annuale riunisce tutti i 16 club per un weekend.", "I soci pagano una quota annuale di qualche centinaio di franchi; gli ospiti di solito nulla.", "Rotaract fa parte del Rotary: a 30 anni il Rotary club accanto è il passo successivo naturale.", "I progetti pratici mostrano più in fretta di cosa si occupa un club."],
  subpage_link: "Rotary e il mondo",
});

// welcome: member or not
Object.assign(I18N.en, { ob_member_q: "Are you a Rotaract member?", ob_member: "Yes, I'm a member", ob_guest: "Not (yet)", ob_guest_title: "Welcome!", ob_guest_text: "Rotaract is for people aged 18 to 30: learn, help, celebrate. You can come to almost any event as a guest. Follow a club near you to see its events first, or just explore.", ob_follow: "Clubs near you", pick_main: "Choose main club", pick_also: "Choose clubs to also show", all_feed_short: "All Rotaract events CH & LI" });
Object.assign(I18N.de, { ob_member_q: "Bist du Rotaract-Mitglied?", ob_member: "Ja, Mitglied", ob_guest: "(Noch) nicht", ob_guest_title: "Willkommen!", ob_guest_text: "Rotaract ist für Leute zwischen 18 und 30: lernen, helfen, feiern. An fast jeden Anlass kannst du als Gast kommen. Folge einem Club in deiner Nähe, um seine Anlässe zuerst zu sehen, oder schau dich einfach um.", ob_follow: "Clubs in deiner Nähe", pick_main: "Hauptclub wählen", pick_also: "Weitere Clubs wählen", all_feed_short: "Alle Rotaract-Anlässe CH & LI" });
Object.assign(I18N.fr, { ob_member_q: "Êtes-vous membre de Rotaract ?", ob_member: "Oui, membre", ob_guest: "Pas (encore)", ob_guest_title: "Bienvenue !", ob_guest_text: "Rotaract s'adresse aux 18–30 ans : apprendre, aider, fêter. Vous pouvez venir à presque tous les événements en invité. Suivez un club près de chez vous pour voir ses événements en premier, ou explorez simplement.", ob_follow: "Clubs près de vous", pick_main: "Choisir le club principal", pick_also: "Choisir d'autres clubs", all_feed_short: "Tous les événements Rotaract CH & LI" });
Object.assign(I18N.it, { ob_member_q: "Sei socio Rotaract?", ob_member: "Sì, socio", ob_guest: "Non (ancora)", ob_guest_title: "Benvenuto!", ob_guest_text: "Rotaract è per chi ha tra 18 e 30 anni: imparare, aiutare, festeggiare. A quasi ogni evento puoi venire come ospite. Segui un club vicino a te per vedere prima i suoi eventi, oppure esplora.", ob_follow: "Club vicino a te", pick_main: "Scegli il club principale", pick_also: "Scegli altri club", all_feed_short: "Tutti gli eventi Rotaract CH & LI" });
