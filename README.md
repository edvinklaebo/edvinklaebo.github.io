# edvinklaebo.github.io
My profile

## Temple of Fortune browser demo

The portfolio includes a dependency-free JavaScript adaptation of the Python /
Pygame game. Open `index.html` directly or serve this directory with a static
server. GitHub Pages needs no build step.

The demo uses the medium preset: a 5-by-6 grid, orthogonal clusters of 5+, the
source paytable and symbol weights, gravity/refills, base cascades capped at x5,
and 10 free spins for 3+ scatters on the initial grid. Free spins have their own
x1-x10 cascade multiplier plus a persistent bonus multiplier capped at x10.
Retriggers are capped at 50 awarded spins per bonus. Free spins are advanced
manually, not automatically. The browser presentation uses custom relic glyphs;
it does not run or embed Pygame.

Everything is play-only: credits have no monetary value, are kept in memory,
and reset to 1,000 on reload or Reset demo. There are no payments or backend.
Amounts use milli-credits so a 0.10-credit spin preserves fractional payouts.

- `temple-engine.js`: rules, paytable, cluster resolution, and session accounting.
- `temple.js`: accessible DOM rendering and player controls.
- `temple.css`: responsive demo styling, scoped independently of the portfolio.

Run the deterministic engine tests with Node.js (no packages required):

```text
node --test temple-engine.test.js
```
