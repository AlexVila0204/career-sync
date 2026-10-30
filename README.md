# career-sync

A Claude Code plugin that keeps your LaTeX CV, LinkedIn and portfolio up to date with what you build, in English and Spanish.

Run `/career-sync` inside a project. It reads the manifests, infra files and your own commits (other people's commits don't count), compares them with your career profile, and lists the skills and achievements you don't have yet. You approve, edit or reject each one. `/career-sync apply` then edits your CV in both languages, writes LinkedIn text you can paste, and updates your portfolio.

## Install

```
/plugin marketplace add AlexVila0204/career-sync
/plugin install career-sync@career-sync
```

If you have a `humanizer` skill installed, career-sync runs every bullet and description through it before showing it to you.

## Setup

```
/career-sync init
```

It asks for your CV `.tex` files, your LinkedIn skills (a data export from Settings > Data privacy > Get a copy of your data, or the Skills page pasted as text) and your portfolio, then writes `~/.career/profile.yaml`. Set `CAREER_PROFILE` to keep the file somewhere else.

## Commands

| Command | What it does |
|---|---|
| `/career-sync` | Scan the current project for new skills and achievements. |
| `/career-sync apply` | Write approved items to the CV, LinkedIn text and portfolio. |
| `/career-sync status` | Show what is on the CV but missing from LinkedIn, and the reverse. |
| `/career-sync import <zip>` | Update the profile from a fresh LinkedIn export. |

## LinkedIn

LinkedIn's public API only gives individual developers your name, photo and email; editing a profile is reserved for approved partners. career-sync reads your export instead and writes the text for you to paste.

Skills are the exception. `/career-sync apply` also writes `linkedin-skills-queue.json`, and the Chrome extension in `extension/` adds those skills to your profile, each attached to the positions you chose. It runs inside the LinkedIn tab you are already logged into, so it never asks for or stores a password or cookie. It sends one request at a time with a wait you set (8 seconds by default). It does not delete skills or post anything to your feed.

1. Clone this repo, open `chrome://extensions`, turn on Developer mode, click Load unpacked and pick the `extension/` folder.
2. Open your LinkedIn profile, click the extension icon, paste the contents of `linkedin-skills-queue.json` and click Load.
3. Click Resolve. The extension searches LinkedIn's skill picker for each entry and selects the exact match. Rows marked "pick a match" need you to choose from the dropdown.
4. Click Save checked. Rows turn to "saved" as each one goes through.

The extension uses LinkedIn's internal web endpoints, which can change without notice. LinkedIn's terms forbid automated use, so keep runs small and use it at your own risk. career-sync is not affiliated with or endorsed by LinkedIn.

## Supported CV templates

`resume.cls` (Trey Hunner), `moderncv`, `awesome-cv` and Jake's resume. Other templates work as long as career-sync can follow the structure already in your file.

## License

MIT
