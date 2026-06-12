# Fruit Labeling Hero 🥑🍊🍎🍑

An HTML5 arcade game about the noble art of fruit labeling. Fruit rolls down the
conveyor line and passes under your labeling head — fire the **right PLU label**
onto every piece before it ships.

> Inspired by real produce labeling lines: avocados, citrus, apples, and stone
> fruit, each with their real PLU codes.

## How to play

Open `index.html` in any modern browser (or serve it with
`python3 -m http.server` and visit `http://localhost:8000`).

| Key | Label | Fruit |
|-----|-------|-------|
| `1` | PLU 4046 | Avocado |
| `2` | PLU 4131 | Apple |
| `3` | PLU 4012 | Orange |
| `4` | PLU 4044 | Peach |

- Tap the on-screen label buttons on mobile.
- Fire when a fruit is inside the dashed target zone under the labeling head.
- **Dead-center hits** earn an accuracy bonus; consecutive correct labels build a combo.
- A **wrong label** or **unlabeled fruit leaving the line** costs a life. Three strikes and the shift is over.
- The line speeds up every level, and new fruit varieties join the belt.
- `P` stops/restarts the conveyor.

## Ideas for future shifts

- Multiple lanes with one labeler per lane
- Label cassette reloads (limited stickers, reload mid-rush)
- Organic (9-prefix) PLUs that look almost identical — read carefully!
- Cross-belt sorter mode
