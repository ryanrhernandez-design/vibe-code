# Cass' Tappy Adventure 🐱

A Flappy Bird–style game starring Cass — a green-eyed tabby with a white bib and white socks — built as a single HTML5 file. No build step, no dependencies, no assets — everything (graphics and sound) is drawn and synthesized in code.

## Play it

Open `index.html` in any browser. Tap (or press Space / ↑) to flap. Dodge the yarn-spool towers.

## Playing on iPhone (recommended setup)

HTML5 in Safari is the best format for this — no App Store needed:

1. Host `index.html` anywhere (easiest: enable **GitHub Pages** for this repo under Settings → Pages, or use Netlify/Vercel drag-and-drop).
2. Open the URL in Safari on your iPhone.
3. Tap **Share → Add to Home Screen**.

It will launch full-screen like a native app (the page includes the Apple web-app meta tags), with crisp Retina rendering, touch controls, and your best score saved on the device.

## Features

- One-tap touch controls, keyboard support on desktop
- Canvas-drawn cartoon Cass (tabby stripes, forehead "M", ringed tail, flapping wing, X-eyes on game over)
- Parallax clouds, scrolling ground, yarn-spool obstacles
- Score, persistent best score (localStorage), star burst on each point
- Every 5 points: fireworks and a "Cass Loves You" heart balloon that grows and pops
- Every 40 points: the game speeds up and the gaps tighten (shown as Level)
- On-device leaderboard (top 10) with a saved player name — tap the name pill to rename, which updates all your existing scores
- Retro sound effects via WebAudio (including a little meow on game over)
- Scales to any screen size and orientation
