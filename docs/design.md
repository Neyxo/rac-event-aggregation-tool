# Design rules

One look per kind of element, so it is always clear what can be pressed. Loosely after Material Design. Sizes are tokens in `:root` of `web/src/app.css`.

## Controls

| Element | Look | Used for |
|---|---|---|
| **Button** | Pill, 40px high (`--h-btn`). Filled for the one main action, outlined otherwise, round when icon-only. | Register, Subscribe, Share, Filters, Map, Copy |
| **Segmented bar** | One pill-shaped bar split into parts, 40px. | Two to four exclusive options: views, theme, language |
| **Chip** | 8px corners, 30px high (`--r-chip`, `--h-chip`). Always clickable. | Club chips (open the club), filter chips (filled and checked when selected) |
| **Status** | Icon or dot plus coloured text. No box. Never clickable. | Members only, Register by, Cancelled, New |

Text fields are pills at button height.

## Cards

- **Clickable card**: raised, presses in, the whole card opens something. A single one carries a chevron; event cards in a list and tiles in a strip do not.
- **Container card**: flat with an outline, never reacts as a whole. Rows inside that open something carry their own chevron.
- Everything in a horizontal strip opens something.

## Frosted glass

Three levels: `--frost-1` (veil on a card or colour block), `--frost-2` (pane on a colour wash), `--frost-3` (bars, sheet, captions). Pane and bar backgrounds are `--pane` and `--bar`. Without `backdrop-filter`, or with reduced transparency or more contrast, the same tokens turn solid.

## Colour

Each club has its crest and a matching colour (`clubs.toml`). A page about one club is washed in that colour; Home in the colours of your clubs.
