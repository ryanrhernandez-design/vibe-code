# Fruit Labeling Hero 🥑🍊🍎🍑

A top-down HTML5 arcade game about running a real fruit labeling line. Four
conveyor lanes of carrier cups run up the screen, one commodity at a time.
Every lane has its own labeler head on the bridge — tap a lane and its fingers
tap a PLU sticker onto the fruit crossing under it. Don't let unlabeled fruit
ship.

> Inspired by real produce labeling machinery: avocados, citrus, apples, and
> stone fruit, each with their real PLU codes.

## How to play

Open `index.html` in any modern browser — designed for phones in portrait.
(Desktop: serve with `python3 -m http.server`, keys `1–4` fire each lane,
`P` pauses.)

- **Tap a lane** to fire that lane's labeler — every lane has its own head, and
  **multi-touch works**: two fruits at once means two thumbs.
- Fruit rides in carrier cups; empty cups flow with the line just like a real
  sorter.
- Tag fruit while it's inside the dashed window around the bridge.
  **1 point per labeled fruit.**
- **3 dead-center hits in a row = CRITICAL STRIKE**: worth 2 points and one
  fruit off the stage total, with a suitably dramatic flash. The pips under
  the bridge track your streak.
- **One commodity at a time**: avocados (PLU 4046), apples (4131), oranges
  (4012), peaches (4044), in randomized order.
- The line starts at **1.5 cups/second** and gains **+1.0 cups/second at every
  changeover**. Every **30 fruits** the belt drains and the line changes over
  to the next commodity.
- Lane spawn patterns randomize every run, with simultaneous doubles showing up
  as the line gets faster.
- A fruit that passes the labeler unstickered is a strike — three strikes and
  the shift is over. High score persists as your plant record.

## Leaderboard

Same system as Nemo's adventure: a 👤 name button and a 🏆 Top 100 board
(visible outside of a shift). Scores post to the shared Firebase Realtime
Database, namespaced under `/flh` so the two games' boards never mix, with a
device-local fallback when offline. Renames carry your existing scores via a
per-device id, and each finished run logs a private play entry under
`/flh/plays` for the admin dashboard.

> If the global board shows "this device only" everywhere, add read/write
> rules for the `flh` node in the Firebase console:
> `"flh": { "scores": { ".read": true, ".write": true }, "plays": { ".read": false, ".write": true } }`

## Dev dashboard

`admin.html` is the developer console (same as Nemo's adventure): shift counts,
plays-per-day chart, most active players, and rename/delete controls for
leaderboard entries. Reading the private play log and editing scores needs your
Firebase database secret — it reuses the key already saved by the Nemo
dashboard on the same browser.

## Ideas for future shifts

- Label cassette reloads (limited stickers, reload mid-rush)
- Culls on the belt that must NOT be labeled
- Organic (9-prefix) PLU rounds
- More lanes / dual labeler carriages
