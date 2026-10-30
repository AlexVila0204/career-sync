# profile.yaml schema

```yaml
version: 1

person:
  name: Jane Doe
  headline: { es: Ingeniera de Software, en: Software Engineer }
  links: { linkedin: ..., github: ..., portfolio: ... }
  spoken_languages:
    - { name: Spanish, level: native }
  git_identities: [janedoe, jane@personal.com, jane@work.com]
  last_scan: { github.com/acme/billing: 2026-10-29 }

targets:
  cv:
    template: resume.cls
    files:
      es: /abs/path/cv-es.tex
      en: /abs/path/cv-en.tex
    skill_rows:
      languages: { es: Lenguajes de programación, en: Programming Languages }
  linkedin:
    export: /abs/path/Basic_LinkedInDataExport.zip
    last_imported: 2026-10-29
  portfolio:
    url: https://example.com
    path: /abs/path/portfolio-repo

experience:
  - id: acme
    company: Acme
    title: { es: Desarrolladora Backend, en: Backend Developer }
    linkedin_title: Desarrolladora Backend
    start: 2024-06
    end: null
    in: [cv, linkedin]

education:
  - { id: uni, institution: ..., degree: { es: ..., en: ... }, start: 2020, end: 2024, in: [cv] }

certifications:
  - { name: AWS Solutions Architect, in: [cv, linkedin] }

projects:
  - id: billing
    name: ...
    summary: ...
    experience: acme
    in: [cv, portfolio]
    achievements:
      - es: Construí el módulo de facturación...
        en: Built the billing module...
        in: [cv]

skills:
  - { name: PostgreSQL, category: databases, aliases: [postgres, psql], in: [cv, linkedin], used_at: [acme] }

ignore: [jQuery]

issues:
  - Free-text inconsistencies found during init or import.
```

## Fields

| Field | Meaning |
|---|---|
| `person.git_identities` | Every git author name and email the user commits with. Only commits matching one count as the user's work. |
| `person.last_scan` | Last scan date per repo, so the next scan only reads newer commits. |
| `targets.cv.files` | One `.tex` per language. Keys are language codes and drive which languages every text is written in. |
| `targets.cv.skill_rows` | Maps a skill `category` to the row label in the CV skills table, per language. A category with no row is not added to the CV table. |
| `skills[].name` | Canonical name, written the way LinkedIn's skill picker spells it when possible. |
| `skills[].aliases` | Other spellings and translated names, used for matching only. |
| `skills[].in` | Targets where the skill already appears: `cv`, `linkedin`, `portfolio`. Anywhere in the CV counts, bullets included. |
| `skills[].used_at` | Experience ids. LinkedIn attaches skills to positions, so this says where to attach it. |
| `skills[].linkedin_at` | Experience ids the skill is attached to on LinkedIn right now. `"?"` marks a position LinkedIn did not name ("y una empresa más"). |
| `experience[].linkedin_position_id` | LinkedIn's numeric position id, used by the browser extension. |
| `targets.linkedin.profile_env` | Env var names (in `.env` next to the profile) holding the LinkedIn vanity name and profile id. |
| `targets.linkedin.skill_count` | Skills currently on LinkedIn (max 100). |
| `skills[].category` | `generic` marks vague LinkedIn skills worth replacing with concrete ones. |
| `projects[].achievements` | Approved bullets, one key per profile language. `in` lists the targets they were written to; empty means pending for `apply`. |
| `ignore` | Skills the user rejected. Never propose them again. |
| `issues` | Known inconsistencies to surface in `status`. Remove an entry once it is fixed. |

Dates use `YYYY` or `YYYY-MM`. `end: null` means current.
