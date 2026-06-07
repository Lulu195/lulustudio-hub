<div align="center">

# § LuluStudio Hub

**One public home for LuluStudio: desktop apps, Discord bots, and tooling for
[Albion Online](https://albiononline.com) and Whiteout Survival.**

[![Live site](https://img.shields.io/badge/live-projects.lulustudio.dk-d6a052?style=for-the-badge&labelColor=0b0a09)](https://projects.lulustudio.dk)
&nbsp;
[![Deploy](https://img.shields.io/github/actions/workflow/status/Lulu195/lulustudio-hub/deploy.yml?style=for-the-badge&label=deploy&labelColor=0b0a09&color=8aa86b)](https://github.com/Lulu195/lulustudio-hub/actions/workflows/deploy.yml)

![Built with HTML/CSS/JS](https://img.shields.io/badge/built_with-HTML_·_CSS_·_JS-d6a052?style=flat-square&labelColor=0b0a09)
![No build step](https://img.shields.io/badge/build-none-8aa86b?style=flat-square&labelColor=0b0a09)
![Hosting](https://img.shields.io/badge/hosting-GitHub_Pages-d6a052?style=flat-square&labelColor=0b0a09&logo=github)
![DNS](https://img.shields.io/badge/dns-Cloudflare-d6a052?style=flat-square&labelColor=0b0a09&logo=cloudflare&logoColor=white)

### [Open the site →](https://projects.lulustudio.dk) &nbsp;·&nbsp; [AlbionPacketExplorer](https://projects.lulustudio.dk/apx/) &nbsp;·&nbsp; [Bots](https://projects.lulustudio.dk/bots/)

</div>

---

## What is this

The repository behind **[projects.lulustudio.dk](https://projects.lulustudio.dk)**: a small,
**hand-written static site** (no framework, no build step) that showcases LuluStudio's projects and
bots and hosts desktop **downloads**. Cards are generated from live GitHub data (language, commit
activity, dates) and each one expands to a details view with a commit sparkline and a language
breakdown. Desktop apps auto-update from a feed the site serves.

## What's inside

### Apps and projects
| Project | What it does | Stack |
|---|---|---|
| **[AlbionPacketExplorer (APX)](https://projects.lulustudio.dk/apx/)** | Captures Albion's network traffic live and decodes every packet, for protocol reverse-engineering. Self-updating desktop app. | C# · Avalonia |
| **WOS - Java App** | Automates Whiteout Survival by driving Android emulators. | Java |
| **GitRekt** | Whiteout Survival automation: resource management, combat, city upgrades, and alliance tasks (Android / LDPlayer). | Python |

### Bots
All Discord bots, self-hosted via Docker, each with its own job. See them on the
**[bots page →](https://projects.lulustudio.dk/bots/)**

| Bot | What it does | Stack |
|---|---|---|
| **AO-Butler** | Albion info: item lookup, live market prices, crafting bonuses, and guild utilities. | Python |
| **AO-Micar** | MICAR guild bot: objective tracking, black-zone map data, and guild utilities. | Node.js |
| **TimeKeeper** | Tracks members' UTC offsets and shows local times across the server. | Node.js |
| **GitRekt - Discord** | Whiteout Survival bot: smart troop-training calculators, event stats with OCR, and guild utilities. | Python |

## How it works

```mermaid
flowchart LR
  A["GitHub Actions"] --> B["GitHub Pages"]
  B --> C["Cloudflare DNS"]
  C --> S(("projects.lulustudio.dk"))
```

- **Static site** built by hand in [`site/`](site/); GitHub Actions publishes it to GitHub Pages,
  with the domain pointed by Cloudflare DNS.
- **Cards** come from [`site/js/data.js`](site/js/data.js), generated from live GitHub repo
  metadata and commit activity, so they stay honest.
- **Auto-update:** installed desktop apps update themselves from a feed the site serves; nothing to
  configure on the user's side.
