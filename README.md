# Rotaract event aggregation tool

Turns a club's public Polaris agenda into a calendar feed people can subscribe to. Plan and background: [PLANNING.md](PLANNING.md).

## Subscribe

`webcal://neyxo.github.io/rac-event-aggregation-tool/luzern.ics`

The feed refreshes every 6 hours and keeps the club's full history. Members-only events are not included.

## How events are tracked

Each run syncs Polaris into `data/<club-id>.json`, which the workflow commits, and builds the feed from that file:

- **Past events** are kept for good, even after Polaris drops them from its "upcoming" list or deletes them.
- **Changed events** (moved, renamed, …) are updated, and calendars pick up the change (higher `SEQUENCE`).
- **An upcoming event that disappears from Polaris** is checked on its own first. Only if Polaris confirms it's gone (404 or login page) is it marked cancelled. It then shows as "Abgesagt: …" until its date has passed, and after that it's dropped from the feed. If it reappears, it's active again.
- **Safety brake:** a run that would cancel more than half of the upcoming events at once is refused, because that's almost certainly a Polaris problem. The club keeps its last good state.
- **If Polaris is unreachable**, the affected club or event keeps its last good state, the other clubs still update, and the workflow run is marked failed, so GitHub emails you.

The first run for a new club backfills every year Polaris offers.

## Run locally

```bash
python3 test_polaris_feed.py
python3 polaris_feed.py        # updates data/<club-id>.json, writes public/<club-id>.ics
```

Python 3.11+, no dependencies.

## Add a club

Add a `[[clubs]]` entry to `clubs.toml` with the club's Polaris website (`base_url`) and language.

## Hosting (GitHub)

Repo → Settings → Pages → Source: **GitHub Actions**. The workflow `.github/workflows/feeds.yml` runs every 6 hours, and also on every push or manual run.
