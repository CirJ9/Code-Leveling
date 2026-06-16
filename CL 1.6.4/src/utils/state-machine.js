// @ts-nocheck
/**
 * Simple finite State Machine utility used by game objects.
 *
 * - Stores named states (objects with optional `onEnter` and `update` callbacks).
 * - Supports queued transitions when a state change is already in progress.
 * - Optionally binds state callbacks to a provided `context` so callbacks run with the
 *   host's `this`.
 *
 * @example
 * const sm = new StateMachine('player-sm', playerInstance);
 * sm.addState({ name: 'idle', onEnter() { this.resetAnim(); }, update() { this.tick(); } });
 * sm.setState('idle');
 *
 * @typedef {Object} State
 * @property {string} name
 * @property {function=} onEnter
 * @property {function=} onExit
 * @property {function=} update
 */
export class StateMachine {
  /** @type {Map<string, State>} */
  #states;
  /** @type {State | undefined} */
  #currentState;
  /** @type {string} */
  #id;
  /** @type {Object | undefined} */
  #context;
  /** @type {boolean} */
  #isChangingState;
  /** @type {string[]} */
  #changingStateQueue;

  constructor(id, context) {
    this.#id = id;
    this.#context = context;
    this.#isChangingState = false;
    this.#changingStateQueue = [];
    this.#currentState = undefined;
    this.#states = new Map();
  }

  get currentStateName() {
    return this.#currentState?.name;
  }

  update() {
    if (this.#changingStateQueue.length > 0) {
      this.setState(this.#changingStateQueue.shift());
    }
    // If the current state has an update method, run it
    if (this.#currentState && this.#currentState.update) {
       this.#currentState.update();
    }
  }

  /**
   * Request a transition to the named state. If a transition is already in progress,
   * the request will be queued and processed later.
   * @param {string} name - Target state name
   * @returns {void}
   */
  setState(name) {
    if (!this.#states.has(name)) {
      console.warn(`[${StateMachine.name}-${this.#id}] tried to change to unknown state: ${name}`);
      return;
    }
    if (this.#isCurrentState(name)) return;

    if (this.#isChangingState) {
      this.#changingStateQueue.push(name);
      return;
    }

    this.#isChangingState = true;
    this.#currentState = this.#states.get(name);

    if (this.#currentState.onEnter) {
      this.#currentState.onEnter();
    }
    this.#isChangingState = false;
  }

  /**
   * Register a state object with optional lifecycle callbacks. Callbacks will be bound to the
   * provided context if one was given to the StateMachine constructor.
   * @param {State} state
   * @returns {void}
   */
  addState(state) {
    this.#states.set(state.name, {
      name: state.name,
      onEnter: this.#context ? state.onEnter?.bind(this.#context) : state.onEnter,
      update: this.#context ? state.update?.bind(this.#context) : state.update, // Added update support
    });
  }

  #isCurrentState(name) {
    return this.#currentState?.name === name;
  }
}