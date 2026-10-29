# edvinklaebo.github.io
My profile

## Ninja Climb showcase

The homepage links to `ninja-climb.html`, the project details and controls page.
Its responsive iframe and new-tab fallback both load
`games/ninja-climb/index.html`. The complete GameMaker HTML5 export is included:
the game runs locally with a static server and needs no build step. Inclusion
in the worktree does not publish it; GitHub Pages serves the main branch.

To update the browser version, export NINJA CLIMB from GameMaker for HTML5 and
replace the contents of `games/ninja-climb/` with the **complete export**, including
its generated scripts, assets, and subdirectories. Keep the exported entry point
at `games/ninja-climb/index.html` (not inside another nested export directory).
No iframe or fallback URL changes are needed. Do not upload the Windows `.win`
build as a browser build. The generated entry HTML has two integration changes:
a relative favicon link and responsive, centered 3:2 canvas styles with a dark
background. Preserve or reapply these when replacing the export; the generated
JavaScript and assets are otherwise unchanged.

Serve the repository with a static server to check that the export loads both
inside `ninja-climb.html` and directly, then check mouse/keyboard controls and
focus behavior before publishing. Click inside the game to focus it; it pauses
when unfocused. The exported build uses A/D or Left/Right to move and swing,
mouse aim, left click or E to throw/detach, W/S to reel/extend, Space or right
click to release, and R to restart. Throws require solid ground. A mouse and
keyboard are required; there are no touch controls. The iframe preserves the
game's 960-by-640 aspect ratio and grants fullscreen permission; the fallback
opens the same build in its own tab.

## Three Choices browser game

The featured Three Choices showcase embeds the standalone JavaScript adaptation
at `https://edvinklaebo.github.io/Three-Choices/browser/` instead of a gameplay
video. The game files and deployment are maintained in the Three-Choices
repository; no game assets are copied here. Deploy that repository's browser
build before publishing this embed. Existing source and Unity play links remain
unchanged.

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
