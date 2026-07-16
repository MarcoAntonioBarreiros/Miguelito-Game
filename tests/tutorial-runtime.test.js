import assert from 'node:assert/strict';
import test from 'node:test';

import { generateLevel } from '../src/procgen/generator.js';
import { createSimulator } from '../src/procgen/simulator.js';

test('simuladores auxiliares não substituem o simulador ativo exposto', () => {
  const previousWindow = globalThis.window;
  const activeSimulator = createSimulator();
  globalThis.window = { miguelitoSim: activeSimulator };

  try {
    generateLevel('tutorial-runtime-regression');
    assert.equal(globalThis.window.miguelitoSim, activeSimulator);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
