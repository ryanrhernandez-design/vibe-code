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
- Tag fruit while it's inside the dashed window around the bridge — dead-center
  hits earn an accuracy bonus, and consecutive tags build a combo.
- **5 dead-center hits in a row = CRITICAL STRIKE**: double points on that tag
  and one fruit off the stage total, with a suitably dramatic flash. The pips
  under the bridge track your streak.
- **One commodity at a time**: avocados (PLU 4046), apples (4131), oranges
  (4012), peaches (4044), in randomized order.
- Every **15 fruits** the belt speeds up slightly. Every **30 fruits** the belt
  drains and the line changes over to the next commodity.
- Lane spawn patterns randomize every run, with simultaneous doubles showing up
  as the line gets faster.
- A fruit that passes the labeler unstickered is a strike — three strikes and
  the shift is over. High score persists as your plant record.

## Ideas for future shifts

- Label cassette reloads (limited stickers, reload mid-rush)
- Culls on the belt that must NOT be labeled
- Organic (9-prefix) PLU rounds
- More lanes / dual labeler carriages
