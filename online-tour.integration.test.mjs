import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mainSource = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

class MockClassList {
  constructor() {
    this.classes = new Set();
  }

  add(...tokens) {
    for (const token of tokens) {
      this.classes.add(token);
    }
  }

  remove(...tokens) {
    for (const token of tokens) {
      this.classes.delete(token);
    }
  }

  contains(token) {
    return this.classes.has(token);
  }

  toggle(token, force) {
    if (force === undefined) {
      if (this.classes.has(token)) {
        this.classes.delete(token);
        return false;
      }

      this.classes.add(token);
      return true;
    }

    if (force) {
      this.classes.add(token);
    } else {
      this.classes.delete(token);
    }

    return force;
  }
}

class MockElement {
  constructor(tagName, id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.style = {};
    this.listeners = new Map();
    this.classList = new MockClassList();
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type).push(handler);
  }

  click() {
    const handlers = this.listeners.get('click') ?? [];

    for (const handler of handlers) {
      handler({ currentTarget: this, target: this, type: 'click' });
    }
  }
}

class MockRectilinearView {
  static limit = {
    traditional(maxFov, minFov) {
      return { maxFov, minFov };
    }
  };

  constructor(parameters, limits) {
    this._parameters = { ...parameters };
    this.limits = limits;
  }

  parameters() {
    return { ...this._parameters };
  }

  setParameters(nextParameters) {
    this._parameters = {
      ...this._parameters,
      ...nextParameters
    };
  }
}

function createHarness() {
  const pano = new MockElement('div', 'pano');
  const overlay = new MockElement('div', 'overlay');
  const animationQueue = [];

  class MockViewer {
    constructor(element, options) {
      this.element = element;
      this.options = options;
    }

    createScene({ source, geometry, view }) {
      return {
        source,
        geometry,
        _view: view,
        switchToCalls: [],
        view() {
          return this._view;
        },
        switchTo(options) {
          this.switchToCalls.push(options);
        }
      };
    }
  }

  const context = {
    console,
    document: {
      getElementById(id) {
        if (id === 'pano') return pano;
        if (id === 'overlay') return overlay;
        return null;
      },
      createElement(tagName) {
        return new MockElement(tagName);
      }
    },
    Marzipano: {
      Viewer: MockViewer,
      RectilinearView: MockRectilinearView,
      ImageUrlSource: {
        fromString(url) {
          return { url };
        }
      },
      EquirectGeometry: class {
        constructor(levels) {
          this.levels = levels;
        }
      }
    },
    requestAnimationFrame(callback) {
      animationQueue.push(callback);
      return animationQueue.length;
    },
    Math
  };

  context.globalThis = context;

  const instrumentedSource = `${mainSource}
globalThis.__tourTestHooks = {
  getCurrentScene: function() { return tagadejaAina; },
  getScenes: function() { return ainas; },
  getOverlayArrows: function() { return overlayBultas; }
};`;

  vm.runInNewContext(instrumentedSource, context, { filename: 'main.js' });

  return {
    hooks: context.__tourTestHooks,
    runNextAnimationFrame() {
      const callback = animationQueue.shift();
      assert.ok(callback, 'Expected a queued animation frame callback.');
      callback();
    },
    getActiveArrows() {
      return overlay.children.filter((child) => child.classList.contains('aktivs'));
    }
  };
}

test('rapid forward-arrow clicks stop at the immediate next scene', () => {
  const tour = createHarness();
  const scenes = tour.hooks.getScenes();

  scenes.ieeja.view().setParameters({ yaw: -0.68, pitch: 0.54 });
  tour.runNextAnimationFrame();

  const activeArrows = tour.getActiveArrows();
  assert.equal(activeArrows.length, 1, 'Expected one active forward arrow in the entrance scene.');

  activeArrows[0].click();
  activeArrows[0].click();

  assert.equal(
    tour.hooks.getCurrentScene(),
    'ieeja_gaitenis',
    'A rapid double click should not advance past the next linked scene.'
  );
  assert.equal(
    scenes.ieeja_gaitenis.switchToCalls.length,
    1,
    'The next scene should only receive one switch request from the rapid double click.'
  );
});

test('camera yaw and pitch stay the same between image switches', () => {
  const tour = createHarness();
  const scenes = tour.hooks.getScenes();
  const expectedCameraPosition = { yaw: -0.68, pitch: 0.54 };

  scenes.ieeja.view().setParameters(expectedCameraPosition);
  tour.runNextAnimationFrame();

  const activeArrows = tour.getActiveArrows();
  assert.equal(activeArrows.length, 1, 'Expected one active forward arrow before switching scenes.');

  activeArrows[0].click();

  const nextSceneParameters = scenes.ieeja_gaitenis.view().parameters();

  assert.deepEqual(
    {
      yaw: nextSceneParameters.yaw,
      pitch: nextSceneParameters.pitch
    },
    expectedCameraPosition,
    'The next scene should preserve the current camera yaw and pitch.'
  );
});
