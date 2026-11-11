// Runs before every other module (first import of main.tsx): the pretend date must be in place before anything reads the clock.
import { installPretendDate } from "./lib/dev";

installPretendDate();
