# Design method: Shade first

## Idea

Heat is the data. Shade is the answer. Warm paper holds the page. Teal means "act". Orange means "look here". The heat ramp shows data only.

## Four colour roles

| Role | Tokens | Use |
| --- | --- | --- |
| Paper | `page`, `surface`, `line` | Background, cards, rules |
| Ink | `ink`, `ink-soft`, `ink-faint` | Text. Keep body text at `ink-soft` or darker |
| Action | `brand`, `brand-deep`, `brand-soft` | Buttons, links, selected state |
| Attention | `sun`, `sun-soft`, `sun-deep` | Hints, step numbers, planned items |
| Heat | `heat-low`, `heat-medium`, `heat-high` and the ramp | Data only. Never decoration |

## Rules

1. Define a colour once in `globals.css`. Use only tokens in components.
2. Use the heat ramp only for heat data and for its legend.
3. One primary button for each screen area.
4. Touch targets are 44 px or more.
5. Each screen answers one question. Number the steps.
6. Add an info hint where a word needs explanation. Keep each hint to 2 sentences.
7. Mark planned work with a dashed border and the Planned tag colour.

## Type

| Use | Font |
| --- | --- |
| Headings and numbers | Schibsted Grotesk |
| Body text | Mukta (supports Devanagari) |
| Brand mark | Outfit |

## Spacing and shape

- Use steps of 4 px. Prefer 16, 24 and 48 px between blocks.
- Cards use the `2xl` radius and a 1 px `line` border.
- Section rhythm: 48 px above a rule, 24 px below the heading.
