# Happy Birthday, Sohani 🌸💛

A cinematic, interactive one-page birthday experience: cherry-blossom + golden-summer visuals,
a playable mini-game, a teasing "Didi" scene, favorites cards, a handwritten letter, and a
grand finale — all built in plain HTML/CSS/JS + GSAP + Canvas (no build step required, so it
just works, loads fast, and runs great on phones).

## Run it locally

**Easiest:** double-click `index.html` — it opens directly in any modern browser.

**Or, with npm (recommended for mobile testing over local network):**
```bash
npm start
```
This runs `npx serve .` and prints a local URL (and a network URL you can open on your phone
if it's on the same Wi-Fi).

## Files
- `index.html` — all 7 scenes (markup)
- `style.css` — cinematic golden/rose theme, glassmorphism, responsive layout
- `script.js` — scene manager, particle system (petals + golden dust), the mini-game
  ("Golden Summer Runner"), generated ambient music + sound effects (Web Audio API, no
  external audio files needed), and letter reveal animation

## Notes
- Music only starts after you tap **Begin** or the 🔈 icon (browsers block autoplay) — toggle
  anytime top-right.
- The mini-game: tap **JUMP**, tap the canvas, or press **Space**. Reach a score of 15 to
  trigger the celebration and continue the story. There's also a "Skip Game" link so nobody
  gets stuck.
- Tap **Replay the Magic ✨** on the final scene to restart the whole experience.
- No external images or copyrighted audio are used — all visuals are CSS/SVG/emoji/Canvas,
  and all audio is generated in-browser.
  
