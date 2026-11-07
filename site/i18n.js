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
