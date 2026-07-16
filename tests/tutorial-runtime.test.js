import assert from 'node:assert/strict';
import test from 'node:test';

import { generateLevel } from '../src/procgen/generator.js';
import { createSimulator } from '../src/procgen/simulator.js';
import {
  isHardReloadShortcut,
  TUTORIAL_STORAGE_KEYS,
} from '../src/procgen/tutorial-manager.js';
import {
  createTutorialTriggers,
  TUTORIAL_PROXIMITY,
} from '../src/procgen/tutorial-triggers.js';

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

function runMicrobeTriggerAt(distance) {
  const previousWindow = globalThis.window;
  globalThis.window = new EventTarget();
  const triggered = [];
  const state = {
    gameState: 'play',
    campaign: { transitionRequested: false },
    player: {
      x: 0, y: 0, w: 0, h: 0, exudates: 0,
      canDoubleJump: false, canDash: false, canPulse: false,
    },
    discoveredMicrobes: new Set(),
    level: {
      enemies: [], rhizobiumNodules: [], biofilms: [],
      mycorrhizaArbuscules: [], platforms: [], azospirillumRoots: [],
    },
  };
  const sim = {
    ecology: {
      agents: [{ type: 'bacillus', x: distance, y: 0 }],
      encounters: [{ id: 'bacillus', x: distance, y: 0, r: 185 }],
    },
    beneficialInoculants: { followerCount: 0 },
    trichodermaColonies: { followerCount: 0 },
    meloidogyneLifecycle: { juveniles: [], eggMasses: [], galls: [] },
    pseudomonasSiderophores: { freeCount: 0, loadedCount: 0, ironRecovered: 0 },
    trichoderma: { attackCount: 0 },
  };
  const manager = {
    isOpen: false,
    hasSeen: () => false,
    trigger: id => {
      triggered.push(id);
      return true;
    },
  };

  try {
    const triggers = createTutorialTriggers({
      state,
      sim,
      manager,
      ralstoniaControl: { foci: [] },
      trichodermaRhizoctoniaControl: { activeAttackCount: 0 },
    });
    triggers.update();
    return { triggered, discovered: state.discoveredMicrobes };
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

test('cartão de organismo não abre somente porque ele está desenhado à distância', () => {
  const result = runMicrobeTriggerAt(TUTORIAL_PROXIMITY.microbeAgent + 1);
  assert.deepEqual(result.triggered, []);
  assert.equal(result.discovered.size, 0);
});

test('cartão de organismo abre quando Miguelito chega bem perto', () => {
  const result = runMicrobeTriggerAt(TUTORIAL_PROXIMITY.microbeAgent - 1);
  assert.deepEqual(result.triggered, ['organism-bacillus']);
  assert.equal(result.discovered.has('bacillus'), true);
});

test('atalhos de hard reload são reconhecidos sem confundir recarga comum', () => {
  assert.equal(isHardReloadShortcut({ code: 'F5', ctrlKey: true }), true);
  assert.equal(isHardReloadShortcut({ code: 'KeyR', ctrlKey: true, shiftKey: true }), true);
  assert.equal(isHardReloadShortcut({ code: 'KeyR', metaKey: true, shiftKey: true }), true);
  assert.equal(isHardReloadShortcut({ code: 'F5' }), false);
  assert.equal(isHardReloadShortcut({ code: 'KeyR', ctrlKey: true, shiftKey: false }), false);
  assert.match(TUTORIAL_STORAGE_KEYS.seen, /:v2$/);
  assert.match(TUTORIAL_STORAGE_KEYS.unlocked, /:v2$/);
});
