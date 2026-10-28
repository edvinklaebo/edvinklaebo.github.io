(function () {
  "use strict";

  const engine = window.TempleEngine;
  const board = document.getElementById("temple-board");
  const spinButton = document.getElementById("temple-spin");
  const resetButton = document.getElementById("temple-reset");
  const costInput = document.getElementById("temple-cost");
  const message = document.getElementById("temple-message");
  const balance = document.getElementById("temple-balance");
  const win = document.getElementById("temple-win");
  const multiplier = document.getElementById("temple-multiplier");
  const mode = document.getElementById("temple-mode");
  const relics = {
    A: { glyph: "\u25c6", name: "Amethyst" },
    B: { glyph: "\u25c8", name: "Sapphire" },
    C: { glyph: "\u273f", name: "Scarab" },
    D: { glyph: "\u2666", name: "Ruby" },
    E: { glyph: "\u265b", name: "Crown" },
    SCATTER: { glyph: "\u2600", name: "Scatter" }
  };
  const format = units => (units / 1000).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let session;
  let busy = false;

  function renderGrid(grid, clusters = []) {
    const winning = new Set(clusters.flatMap(cluster => cluster.positions));
    board.replaceChildren(...grid.map((symbol, index) => {
      const cell = document.createElement("div");
      cell.className = "temple-cell" + (winning.has(index) ? " is-winning" : "");
      cell.dataset.symbol = symbol;
      cell.setAttribute("aria-hidden", "true");
      const glyph = document.createElement("span");
      glyph.className = "temple-glyph";
      glyph.textContent = relics[symbol].glyph;
      const label = document.createElement("span");
      label.className = "temple-symbol-name";
      label.textContent = relics[symbol].name;
      cell.append(glyph, label);
      return cell;
    }));
    board.setAttribute("aria-label", "Relic grid. " + Array.from({ length: engine.ROWS }, (_, row) =>
      "Row " + (row + 1) + ": " + grid.slice(row * engine.COLS, (row + 1) * engine.COLS)
        .map(symbol => relics[symbol].name).join(", ")).join(". "));
  }

  function updateControls() {
    spinButton.disabled = busy;
    resetButton.disabled = busy;
    costInput.disabled = busy || session.freeSpins > 0;
    spinButton.textContent = session.freeSpins ? "Free spin" : "Spin";
    mode.textContent = session.freeSpins ? session.freeSpins + " free spins left" : "Base game";
  }

  function reset() {
    session = new engine.DemoSession();
    costInput.value = "1";
    balance.textContent = format(session.balance);
    win.textContent = format(0);
    multiplier.textContent = "x1";
    renderGrid(engine.createGrid());
    message.textContent = "Ready to explore. Spin to reveal the relics.";
    updateControls();
  }

  async function spin() {
    if (busy) return;
    if (!session.freeSpins && !costInput.reportValidity()) return;
    busy = true;
    updateControls();
    let failed = false;
    try {
      const result = session.spin(Number(costInput.value));
      win.textContent = format(0);
      multiplier.textContent = "x1" + (result.inBonus ? " / bonus x" + result.persistentMultiplier : "");
      board.classList.add("is-dropping");
      renderGrid(result.steps.length ? result.steps[0].grid : result.grid);
      message.textContent = result.inBonus ? "Exploring the sanctuary: free spin..." : "Revealing the relics...";
      await pause(reducedMotion.matches ? 50 : 350);
      board.classList.remove("is-dropping");
      let accumulatedWin = 0;
      for (const [index, step] of result.steps.entries()) {
        renderGrid(step.grid, step.clusters);
        accumulatedWin += step.payout;
        win.textContent = format(accumulatedWin);
        multiplier.textContent = "x" + step.cascadeMultiplier +
          (result.inBonus ? " / bonus x" + result.persistentMultiplier : "");
        message.textContent = "Cascade " + (index + 1) + ": " + step.clusters.map(cluster =>
          cluster.positions.length + " " + relics[cluster.symbol].name).join(" + ") +
          ". Awarded " + format(step.payout) + " virtual credits.";
        await pause(reducedMotion.matches ? 50 : 650);
      }
      renderGrid(result.grid);
      balance.textContent = format(session.balance);
      win.textContent = format(result.win);
      message.textContent = (result.win ? "Spin complete: " + format(result.win) + " virtual credits awarded." :
        "No winning clusters this spin.") +
        (result.awarded ? " " + result.awarded + " free spins awarded!" : "") +
        (session.freeSpins ? " " + session.freeSpins + " free spins remain; bonus multiplier x" + session.bonusMultiplier + "." :
          result.inBonus ? " Bonus complete." : "") +
        (session.balance < Math.round(Number(costInput.value) * 1000) && !session.freeSpins ?
          " Lower the cost or reset for more virtual credits." : "");
    } catch (error) {
      console.error("Temple of Fortune demo:", error);
      message.textContent = "Unable to complete spin: " + error.message;
      failed = !(error instanceof RangeError);
    } finally {
      busy = false;
      board.classList.remove("is-dropping");
      updateControls();
      if (failed) spinButton.disabled = true;
    }
  }

  if (!engine) {
    message.textContent = "The game engine could not load. Reload the page to try again.";
    return;
  }
  const paytable = document.getElementById("temple-paytable");
  for (const [symbol, payouts] of Object.entries(engine.PAYTABLE)) {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = symbol + " " + relics[symbol].name;
    row.append(heading);
    for (const payout of payouts) {
      const cell = document.createElement("td");
      cell.textContent = payout.toFixed(2);
      row.append(cell);
    }
    paytable.append(row);
  }
  spinButton.addEventListener("click", spin);
  resetButton.addEventListener("click", reset);
  reset();
})();
