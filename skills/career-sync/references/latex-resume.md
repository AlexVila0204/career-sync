# Editing LaTeX CVs

## Detect the template

Read the `\documentclass` and the environments in use before editing. Match the existing structure exactly; never introduce a new package or macro the file does not already use.

| Template | Section | Entry | Bullet | Skills |
|---|---|---|---|---|
| `resume.cls` (Trey Hunner) | `\begin{rSection}{TITLE}` | `\begin{rSubsection}{Role, Company}{Dates}{}{}` | `\item` inside `rSubsection` | `tabular` rows `Label & items \\` |
| `moderncv` | `\section{}` | `\cventry{dates}{role}{company}{city}{}{desc}` | `\begin{itemize}\item` inside desc | `\cvitem{Label}{items}` |
| `awesome-cv` | `\cvsection{}` | `\cventry{role}{company}{place}{dates}{desc}` | `\item` inside `cvitems` | `\cvskill{Label}{items}` |
| Jake's resume | `\section{}` | `\resumeSubheading{}{}{}{}` | `\resumeItem{}` | `\textbf{Label}{: items}` |

Other templates: infer the pattern from the existing entries and follow it.

## Where things go

- New skill: append to the row mapped by `targets.cv.skill_rows[category]`, inside the parentheses if the row lists items that way. Keep the row's existing order and separator.
- New achievement: a new `\item` in the matching experience entry, ordered by impact, not by date.
- New project with no matching job: ask the user whether it belongs under an existing entry or a new Projects section.

## Escaping

Escape `& % $ # _ { } ~ ^ \` in text: `\&`, `\%`, `\$`, `\#`, `\_`. Inside `tabular`, a literal ampersand must be `\&` or it breaks the column. `C++` and `C#` are written `C++` and `C\#`.

## Verify

1. Show the diff before writing.
2. If `latexmk` exists: `latexmk -pdf -interaction=nonstopmode -outdir=<tmp> <file>`. Otherwise try `pdflatex` twice. Copy the `.cls` next to the file in the temp dir if needed.
3. Report errors from the log and the page count from `pdfinfo`. Compare with the page count before the edit.
4. No TeX installed: say so and ask the user to recompile in Overleaf.
