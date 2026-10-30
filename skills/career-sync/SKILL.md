---
name: career-sync
description: Keep the user's LaTeX CV, LinkedIn profile and portfolio in sync with the work they actually do. Use when the user asks to update their CV, resume, LinkedIn or portfolio, asks what new skills a project shows, finishes a feature or project worth showcasing, or runs /career-sync. Also use to import a LinkedIn data export or bootstrap the career profile.
argument-hint: "[scan | init | import <linkedin-export.zip|text> | apply | status]"
---

# career-sync

One file is the source of truth: the career profile (`profile.yaml`). Every mode reads it first and updates it last. Never edit the CV, portfolio or profile without the user approving the specific change.

## Locate the profile

1. `$CAREER_PROFILE` if set.
2. `~/.career/profile.yaml`.
3. Neither exists: run **init**.

Schema and field meaning: `references/profile-schema.md`.

## Modes

Pick the mode from the argument. No argument means **scan**.

### init

Bootstrap the profile from what the user already has.

1. Ask for: CV `.tex` paths per language, LinkedIn source (data export ZIP, profile PDF, or pasted "Skills" page), portfolio URL or local repo path.
2. Parse each source (`references/latex-resume.md`, `references/linkedin.md`).
3. Merge into one skill list. Normalize names with aliases so `postgres`, `PostgreSQL` and `psql` become one entry. Record where each appears in `in`.
4. Write `profile.yaml`, then show the gap report (see **status**).

### import

Re-read a fresh LinkedIn export or pasted text and reconcile it with the profile. Update `in` for every skill, add skills that only exist on LinkedIn, and list skills that disappeared from LinkedIn so the user decides whether that was intentional. Set `targets.linkedin.last_imported`.

### scan

Find what the user did in the current project that the profile does not have yet. A repo is shared work: only the user's own commits count as evidence.

1. Build the author filter from `person.git_identities` (every email and name, joined as `--author=<a> --author=<b>`). If the list is empty, ask the user for their git emails and save them. Also count commits with a `Co-authored-by:` trailer matching an identity.
2. Collect candidates from the working directory:
   - Manifests: `package.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle*`, `Podfile`, `Gemfile`, `composer.json`, `*.csproj`.
   - Infra: `Dockerfile`, `docker-compose*`, `.github/workflows`, `.gitlab-ci.yml`, `terraform/`, `k8s/`, `serverless.yml`, `fastlane/`.
   - README and docs, for context on what the project is. Context only, never evidence.
3. Grade each candidate by the user's commits (see **Attribution**). Propose only `introduced` and `worked-with`. List `exposure` items in one line at the end so the user can claim one if git history is misleading.
4. Keep only real, meaningful skills. Skip transitive or trivial dependencies (lint plugins, type packages, polyfills).
5. Drop anything already in the profile (match on name and aliases) or in `ignore`.
6. Draft achievements only from the user's commits (`git log <author filter> --since=<last scan or 6 months> --stat`): what they built, with which stack, and any number the evidence supports. Never invent metrics. Ask the user for numbers when a bullet needs one. Write each draft in every profile language and humanize it (see **Humanize**) before showing it, so the text the user approves is the text that gets written.
7. Compare each achievement draft with the bullets already in the CV for that experience entry. If one overlaps, propose rewriting the existing bullet instead of adding a new one. Never propose more new bullets for one entry than the page budget allows; merge drafts when needed.
8. Write bullets for a reader outside the user's company and country: spell out internal names and local acronyms (for example "credit and debit notes" rather than "NC, ND").
9. Present a short numbered list: each new skill with its grade and evidence commit, each achievement draft with the target experience entry. The user approves, edits or rejects each item. Rejected skills go to `ignore`. Save approved drafts to `projects[].achievements` with one key per profile language.
10. Save the scan date to `person.last_scan[<repo remote or path>]`.

#### Attribution

| Grade | Rule | Check |
|---|---|---|
| `introduced` | A user commit added the dependency or infra file. | `git log <author filter> -S'<package>' -- <manifest>` or `git log <author filter> --diff-filter=A -- <infra file>` |
| `worked-with` | User commits changed code that uses it, without adding it. | `git log <author filter> -G'<import or usage pattern>' --oneline` returns several commits, or `git log <author filter> --name-only` touches the files that import it. |
| `exposure` | Present in the repo, no user commit touches it. | Neither check matches. |

Squash-merged repos lose authorship when someone else merges. If the user's commit count is suspiciously low, say so and offer to read their merged PRs instead (`gh pr list --author @me --state merged`).

### apply

Write approved items to every target.

1. **Write the text.** Use the approved bullets as they are. Any new text (summary, LinkedIn About or position descriptions) is written in every language listed in `targets.cv.files`, natively rather than translated word for word, and humanized before it is shown.
2. **CV.** Edit each `.tex` per `references/latex-resume.md`. Add skills to the row mapped by `targets.cv.skill_rows[category]`. Keep both language files structurally identical.
3. **Compile check.** If `latexmk` or `pdflatex` exists, compile into a temp dir and report errors and page count (`pdfinfo`). If neither exists, say so and tell the user to recompile in Overleaf.
4. **LinkedIn.** Write `linkedin-updates.md` next to the profile with copy-ready text per section. Format: `references/linkedin.md`. For skills, also write `linkedin-skills-queue.json` for the career-sync browser extension (format in `references/linkedin.md`). Never run the extension yourself and never send requests to LinkedIn from the terminal; the user loads the queue in their own logged-in browser.
5. **Portfolio.** If `targets.portfolio.path` is a local repo, edit its project data following that repo's own conventions. Otherwise add the copy-ready text to `linkedin-updates.md` under a Portfolio heading.
6. **Profile.** Update `in`, `used_at`, `projects` and `experience` to reflect what was written.
7. Show a summary of every file touched.

### status

Report gaps without touching anything:
- Skills on the CV but not on LinkedIn, and the reverse.
- LinkedIn skills in category `generic` that add little and could be replaced with concrete ones.
- Projects or experience entries missing from a target.
- Everything under `issues`.

## Humanize

If a skill named `humanizer` appears in the available skills list, invoke it with the Skill tool on every drafted text, once per language, before showing it to the user. Say in one line that it ran. Otherwise apply these rules yourself and say so.
- Lead with the action and the concrete thing built. Name the stack in the sentence, not in a trailing list.
- Prefer plain verbs: built, wrote, moved, cut, added. Avoid "spearheaded", "leveraged", "seamlessly", "robust", "cutting-edge", "passionate", "architected".
- No "not only X but also Y", no groups of three adjectives, no closing flourish.
- Numbers only when the user confirmed them.
- Spanish bullets use past tense in first person without a pronoun ("Diseñé", "Implementé"), consistently within one experience entry.

## Rules

- Show a diff of every `.tex` change before writing it.
- Never remove existing CV content unless the user asks for it.
- Keep the CV within its current page count. If an addition would overflow, propose which bullet to shorten or drop.
- Never put secrets, client names under NDA, or internal URLs into any target. Ask when unsure.
