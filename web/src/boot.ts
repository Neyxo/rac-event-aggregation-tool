// Runs before every other module (first import of main.tsx): the pretend date must be in place before anything reads the clock,
// and old URLs must be rewritten before the router reads the hash.
import { installPretendDate } from "./lib/dev";
import { keptSearch, legacyRedirect } from "./lib/route";

installPretendDate();
// index.html?event=X -> #/event/X; a Home link with filters (?q=, ?clubs= ...) -> #/discover?...; ?lang= and ?welcome stay
const to = legacyRedirect(location.search, location.hash);
if (to) history.replaceState(null, "", location.pathname + keptSearch(location.search) + to);
