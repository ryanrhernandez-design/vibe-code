# Cass' Tappy Adventure 🐱

A Flappy Bird–style adventure starring Cass — a green-eyed tabby with a white bib and white socks — built as a single HTML5 file. No build step, no dependencies, no assets: all graphics and sound are drawn and synthesized in code.

**Play:** https://ryanrhernandez-design.github.io/vibe-code/

## The adventure

Five levels, each with its own world, rules, music, and ending cinematic — survive to 150 points to win:

| Level | Points | World |
|---|---|---|
| 1 | 0–29 | 🧶 The backyard — dodge yarn-spool towers |
| 2 | 30–59 | 🚀 Space — Cass rides a rocket, taps fire the thrusters |
| 3 | 60–89 | ⚔️ Samurai — slice every steel block with the katana (taps also, ahem, propel you) |
| 4 | 90–119 | 🪩 Neon rave — gates pulse to the beat, every tap drops a bass note |
| 5 | 120–150 | 👑 The Cass Kingdom — drifting golden gates, then the coronation |

## Features

- **"Cass Loves You"** — every 5 points, fireworks burst from Cass and a red heart inflates like a balloon and pops
- **Super Saiyan Cass** — charges unlock at 15 and 75 points; tap the ⚡ button (or 2-finger tap / `S` key) for a golden transformation with 3 points of invincibility, complete with a distorted guitar riff
- **Difficulty** steps up every 15 points (faster, tighter gaps, capped)
- **Global cross-device leaderboard** (Firebase) with on-device fallback; your name is saved and renaming carries all your scores with you
- Level-clear cinematics, splash screens with the new rules, a win screen, and a victory fanfare
- Retro WebAudio sound throughout — including a meow on game over and an escalating fart song in level 3
- `?start=N` URL parameter to jump near any level for testing (debug runs don't touch the leaderboard)
- `admin.html` — developer dashboard of play logs (requires the Firebase database secret)

## Playing on iPhone

Open the link in Safari → **Share → Add to Home Screen**. It launches full-screen like a native app with touch controls and crisp Retina rendering. Deploys automatically to GitHub Pages on every push via `.github/workflows/pages.yml`.
