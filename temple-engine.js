(function (root) {
  "use strict";

  const ROWS = 5;
  const COLS = 6;
  const SYMBOLS = ["A", "B", "C", "D", "E", "SCATTER"];
  const WEIGHTS = [30, 25, 20, 15, 8, 2];
  const PAYTABLE = {
    A: [0.15, 0.22, 0.37, 0.56, 0.75, 1.12, 1.50, 2.25],
    B: [0.11, 0.19, 0.30, 0.45, 0.60, 0.90, 1.20, 1.80],
    C: [0.08, 0.11, 0.19, 0.26, 0.38, 0.56, 0.75, 1.12],
    D: [0.06, 0.09, 0.14, 0.19, 0.26, 0.38, 0.56, 0.75],
    E: [0.38, 0.56, 0.75, 1.12, 1.50, 2.25, 3.75, 6.00]
  };

  function drawSymbol(random = Math.random) {
    let value = random() * 100;
    for (let index = 0; index < SYMBOLS.length; index++) {
      value -= WEIGHTS[index];
      if (value < 0) return SYMBOLS[index];
    }
    throw new RangeError("Random source must return a value between 0 (inclusive) and 1 (exclusive).");
  }

  function createGrid(random = Math.random) {
    return Array.from({ length: ROWS * COLS }, () => drawSymbol(random));
  }

  function findClusters(grid) {
    const visited = new Set();
    const clusters = [];
    for (let start = 0; start < grid.length; start++) {
      if (visited.has(start) || grid[start] === "SCATTER") continue;
      const positions = [];
      const pending = [start];
      visited.add(start);
      while (pending.length) {
        const index = pending.pop();
        positions.push(index);
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        const neighbors = [];
        if (row > 0) neighbors.push(index - COLS);
        if (row < ROWS - 1) neighbors.push(index + COLS);
        if (col > 0) neighbors.push(index - 1);
        if (col < COLS - 1) neighbors.push(index + 1);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && grid[neighbor] === grid[start]) {
            visited.add(neighbor);
            pending.push(neighbor);
          }
        }
      }
      if (positions.length >= 5) clusters.push({ symbol: grid[start], positions });
    }
    return clusters;
  }

  function refill(grid, clusters, random = Math.random) {
    const removed = new Set(clusters.flatMap(cluster => cluster.positions));
    const next = grid.slice();
    for (let col = 0; col < COLS; col++) {
      const survivors = [];
      for (let row = 0; row < ROWS; row++) {
        const index = row * COLS + col;
        if (!removed.has(index)) survivors.push(grid[index]);
      }
      for (let row = ROWS - 1; row >= 0; row--) {
        next[row * COLS + col] = survivors.length ? survivors.pop() : drawSymbol(random);
      }
    }
    return next;
  }

  function resolveSpin(initialGrid, cost, bonusMultiplier = 1, inBonus = false, random = Math.random) {
    let grid = initialGrid.slice();
    const steps = [];
    let win = 0;
    let clusters = findClusters(grid);
    while (clusters.length) {
      const cascadeMultiplier = Math.min(steps.length + 1, inBonus ? 10 : 5);
      // Milli-credits preserve the paytable's hundredths at a 0.10-credit cost.
      const payout = Math.round(clusters.reduce((sum, cluster) =>
        sum + PAYTABLE[cluster.symbol][Math.min(cluster.positions.length, 12) - 5], 0)
        * cost * cascadeMultiplier * bonusMultiplier * 1000);
      steps.push({ grid, clusters, cascadeMultiplier, payout });
      win += payout;
      grid = refill(grid, clusters, random);
      clusters = findClusters(grid);
    }
    return {
      grid, steps, win,
      scatters: initialGrid.filter(symbol => symbol === "SCATTER").length
    };
  }

  class DemoSession {
    constructor(random = Math.random) {
      this.random = random;
      this.balance = 1000000;
      this.freeSpins = 0;
      this.awardedSpins = 0;
      this.bonusMultiplier = 1;
      this.bonusCost = 1;
    }

    spin(cost) {
      const inBonus = this.freeSpins > 0;
      if (!inBonus && (!Number.isFinite(cost) || cost < 0.1 || cost > 100 ||
          Math.abs(cost * 10 - Math.round(cost * 10)) > 1e-8)) {
        throw new RangeError("Choose a cost from 0.10 to 100 in steps of 0.10.");
      }
      const actualCost = inBonus ? this.bonusCost : cost;
      const charge = inBonus ? 0 : Math.round(actualCost * 1000);
      if (this.balance < charge) throw new RangeError("Not enough virtual credits. Lower the cost or reset the demo.");
      const persistentMultiplier = inBonus ? this.bonusMultiplier : 1;
      const result = resolveSpin(createGrid(this.random), actualCost, persistentMultiplier, inBonus, this.random);
      this.balance += result.win - charge;
      if (inBonus) {
        this.freeSpins--;
        this.bonusMultiplier = Math.min(10, this.bonusMultiplier + result.steps.length);
      } else {
        this.awardedSpins = 0;
        this.bonusMultiplier = 1;
        this.bonusCost = actualCost;
      }
      let awarded = 0;
      if (result.scatters >= 3) {
        awarded = Math.min(10, 50 - this.awardedSpins);
        this.freeSpins += awarded;
        this.awardedSpins += awarded;
      }
      return { ...result, inBonus, persistentMultiplier, awarded, cost: actualCost };
    }
  }

  const engine = { ROWS, COLS, SYMBOLS, WEIGHTS, PAYTABLE, drawSymbol, createGrid, findClusters, refill, resolveSpin, DemoSession };
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  else root.TempleEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this);
