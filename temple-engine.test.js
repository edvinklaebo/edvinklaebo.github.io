"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const engine = require("./temple-engine.js");
const checkerboard = () => Array.from({ length: 30 }, (_, index) =>
  (Math.floor(index / 6) + index % 6) % 2 ? "A" : "B");
const samples = { A: 0.1, B: 0.4, C: 0.65, D: 0.8, E: 0.95, SCATTER: 0.99 };
function scripted(symbols) {
  let index = 0;
  return () => {
    assert.ok(index < symbols.length, "Unexpected random draw");
    return samples[symbols[index++]];
  };
}
function refillOrder(grid) {
  const symbols = [];
  for (let col = 0; col < 6; col++) {
    for (let row = 4; row >= 0; row--) symbols.push(grid[row * 6 + col]);
  }
  return symbols;
}

test("medium weights, draw boundaries, and exact source paytable", () => {
  assert.deepEqual(engine.WEIGHTS, [30, 25, 20, 15, 8, 2]);
  assert.deepEqual([0, .30, .55, .75, .90, .98, .999].map(value =>
    engine.drawSymbol(() => value)), ["A", "B", "C", "D", "E", "SCATTER", "SCATTER"]);
  assert.deepEqual(engine.PAYTABLE, {
    A: [.15, .22, .37, .56, .75, 1.12, 1.50, 2.25],
    B: [.11, .19, .30, .45, .60, .90, 1.20, 1.80],
    C: [.08, .11, .19, .26, .38, .56, .75, 1.12],
    D: [.06, .09, .14, .19, .26, .38, .56, .75],
    E: [.38, .56, .75, 1.12, 1.50, 2.25, 3.75, 6]
  });
});

test("only orthogonal clusters of at least five win; scatters never cluster", () => {
  assert.equal(engine.findClusters(checkerboard()).length, 0);
  assert.equal(engine.findClusters(Array(30).fill("SCATTER")).length, 0);
  const grid = checkerboard();
  for (const index of [0, 1, 2, 8]) grid[index] = "E";
  assert.equal(engine.findClusters(grid).length, 0);
  grid[14] = "E";
  assert.deepEqual(engine.findClusters(grid).map(cluster => [cluster.symbol, cluster.positions.length]), [["E", 5]]);
  const edges = Array(30).fill("SCATTER");
  for (const index of [4, 5, 6, 7, 8]) edges[index] = "E";
  assert.equal(engine.findClusters(edges).length, 0, "rows must not wrap");
});

test("gravity preserves survivor ordering including scatters", () => {
  const grid = checkerboard();
  grid[0] = "SCATTER";
  const next = engine.refill(grid, [{ positions: [6, 18] }], scripted(["C", "D"]));
  assert.deepEqual([0, 6, 12, 18, 24].map(index => next[index]),
    ["D", "C", "SCATTER", grid[12], grid[24]]);
  assert.equal(next[1], grid[1]);
});

test("simultaneous clusters pay separately, size 12+ caps, and milli-credits stay exact", () => {
  const grid = Array.from({ length: 30 }, (_, index) => index % 6 < 3 ? "A" : "E");
  const result = engine.resolveSpin(grid, .1, 1, false, scripted(refillOrder(checkerboard())));
  assert.equal(result.steps[0].clusters.length, 2);
  assert.equal(result.win, 825);
  assert.equal(result.steps.length, 1);
});

test("base cascade cap x5, bonus cascade cap x10, and persistent multiplier compose", () => {
  const draws = [...Array(30 * 11).fill("A"), ...refillOrder(checkerboard())];
  const base = engine.resolveSpin(Array(30).fill("A"), 1, 1, false, scripted(draws));
  assert.deepEqual(base.steps.map(step => step.cascadeMultiplier), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5]);
  const bonus = engine.resolveSpin(Array(30).fill("A"), 1, 3, true, scripted(draws));
  assert.deepEqual(bonus.steps.map(step => step.cascadeMultiplier), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10]);
  assert.equal(bonus.win, 2.25 * 1000 * 3 * 75);
});

test("bonus checks original grid, locks cost, retriggers up to 50, and runs without credits", () => {
  const initial = checkerboard();
  for (const index of [0, 2, 4]) initial[index] = "SCATTER";
  const session = new engine.DemoSession(scripted(Array.from({ length: 51 }, () => initial).flat()));
  const first = session.spin(1);
  assert.equal(first.awarded, 10);
  assert.equal(session.balance, 999000);
  assert.equal(session.freeSpins, 10);
  session.balance = 0;
  for (let index = 0; index < 50; index++) {
    const result = session.spin(100);
    assert.equal(result.cost, 1);
    assert.equal(session.balance, 0);
  }
  assert.equal(session.awardedSpins, 50);
  assert.equal(session.freeSpins, 0);
  assert.throws(() => session.spin(1), /Not enough/);
});

test("scatters appearing only after refill do not trigger free spins", () => {
  const terminal = checkerboard();
  for (const index of [0, 2, 4]) terminal[index] = "SCATTER";
  const session = new engine.DemoSession(scripted([...Array(30).fill("A"), ...refillOrder(terminal)]));
  const result = session.spin(1);
  assert.equal(result.scatters, 0);
  assert.equal(session.freeSpins, 0);
  assert.equal(session.balance, 1001250);
});

test("persistent bonus multiplier increments after winning cascades and caps at x10", () => {
  const session = new engine.DemoSession(scripted([
    ...Array(30).fill("A"), ...refillOrder(checkerboard())
  ]));
  session.freeSpins = 2;
  session.awardedSpins = 10;
  session.bonusMultiplier = 9;
  const result = session.spin(1);
  assert.equal(result.persistentMultiplier, 9);
  assert.equal(result.win, 20250);
  assert.equal(session.bonusMultiplier, 10);
  assert.equal(session.freeSpins, 1);
});

test("invalid cost and insufficient balance cannot mutate the session", () => {
  const session = new engine.DemoSession();
  for (const cost of [NaN, Infinity, -1, 0, .05, .15, 101]) {
    assert.throws(() => session.spin(cost), /Choose a cost/);
    assert.equal(session.balance, 1000000);
  }
  session.balance = 99;
  assert.throws(() => session.spin(.1), /Not enough/);
  assert.equal(session.balance, 99);
});
