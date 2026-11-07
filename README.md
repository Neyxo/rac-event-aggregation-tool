# Rotaract event aggregation tool

Turns a club's public Polaris agenda into a calendar feed people can subscribe to. Plan and background: [PLANNING.md](PLANNING.md).

## Subscribe

`webcal://neyxo.github.io/rac-event-aggregation-tool/luzern.ics`

The feed refreshes every 6 hours. It has upcoming events plus this year's past ones. Members-only events are not included.

## Run locally

```bash
python3 test_polaris_feed.py
python3 polaris_feed.py        # writes public/<club-id>.ics
```

Python 3.11+, no dependencies.

## Add a club

Add a `[[clubs]]` entry to `clubs.toml` with the club's Polaris website (`base_url`) and language.

## Hosting (GitHub)

Repo → Settings → Pages → Source: **GitHub Actions**. The workflow `.github/workflows/feeds.yml` runs every 6 hours, and also on every push or manual run.
