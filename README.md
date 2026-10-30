# career-sync

A Claude Code plugin that notices what you build and keeps your LaTeX CV, LinkedIn and portfolio up to date, in English and Spanish.

While you work on a project, run `/career-sync`. It reads the project's manifests, infra files and your commits, compares them with your career profile, and proposes only what is new. You approve each item. Then it edits your CV in every language, writes copy-ready LinkedIn text, and updates your portfolio.

## Install

```
/plugin marketplace add AlexVila0204/career-sync
/plugin install career-sync@career-sync
```

Optional: install a `humanizer` skill. When present, every generated text goes through it so it reads like you wrote it.

## Setup

```
/career-sync init
```

It asks for your CV `.tex` files, a LinkedIn data export (Settings > Data privacy > Get a copy of your data) or your pasted Skills page, and your portfolio. It writes `~/.career/profile.yaml`. Set `CAREER_PROFILE` to keep it elsewhere.

## Commands

| Command | What it does |
|---|---|
| `/career-sync` | Scan the current project for new skills and achievements. |
| `/career-sync apply` | Write approved items to the CV, LinkedIn text and portfolio. |
| `/career-sync status` | Show gaps between CV, LinkedIn and portfolio. |
| `/career-sync import <zip>` | Reconcile with a fresh LinkedIn export. |

## LinkedIn

LinkedIn's API only gives individual developers name, photo and email. Profile read and edit access is limited to approved partners. So career-sync reads your export and writes text you paste.

For skills there is an optional Chrome extension in `extension/`. It uses the session of the browser you are already logged into, so it stores no password or cookie. It adds skills one at a time with a configurable wait between requests, attaches each to the positions you chose, and never posts to your feed or deletes anything.

1. `chrome://extensions` > Developer mode > Load unpacked > pick `extension/`.
2. Open linkedin.com, click the extension icon, paste `linkedin-skills-queue.json`, click Load.
3. Resolve: looks up each skill in LinkedIn's picker and preselects the exact match. Fix any row that says "pick a match".
4. Save checked: confirms, then saves one by one.

The extension calls LinkedIn's internal web endpoints. They can change without notice, and automated use of LinkedIn is against its terms, so keep runs small and spaced out. Use it at your own risk.

career-sync is not affiliated with or endorsed by LinkedIn.

## License

MIT

## Supported CV templates

`resume.cls` (Trey Hunner), `moderncv`, `awesome-cv`, Jake's resume. Others work by following the existing structure of your file.
