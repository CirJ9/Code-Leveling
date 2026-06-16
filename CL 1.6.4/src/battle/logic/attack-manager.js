/**
 * AttackManager parses player-written pseudo-java code and simulates/executess effects.
 * - Supports simulation (cost prediction) and actual execution (applying RAM cost, damage, buffs).
 * - Uses a lightweight memory stack and keyword metadata from game data JSON.
 *
 * Core responsibilities:
 * - Parse lines of code into actions
 * - Track RAM load and memory slots
 * - Compute damage, apply buffs, and log events for the UI
 *
 * @module AttackManager
 */
import Phaser from "../../../lib/phaser.js";
import { DATA_ASSET_KEYS } from "../../assets/assets-keys/asset-keys.js";

/**
 * Result returned from parsing/executing code.
 * @typedef {Object} ParseResult
 * @property {boolean} success - Whether execution parsed any valid commands
 * @property {number} totalRamCost - Total RAM cost for the parsed code
 * @property {number} totalDamage - Total damage produced by the parsed code
 * @property {string[]} logs - User-facing log messages to show in UI
 * @property {string[]} [keywords] - Optional list of parsed keywords/commands found
 * @property {string} [error] - Optional error message when success is false
 */

export class AttackManager {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {import("../../types/typedef.js").CodeSyntaxData} */
    #syntaxData;

    // Runtime State
    #memoryStack = {};
    #ramLoad = 1.0;
    #MAX_SLOTS = 5;
    #buffs = { shielded: false };

    /**
     * Create an AttackManager.
     * @param {Phaser.Scene} scene - Scene used for asset/cache access and logging
     */
    constructor(scene) {
        this.#scene = scene;
        this.#syntaxData = this.#scene.cache.json.get(DATA_ASSET_KEYS.CODE_SYNTAX);
    }

    /* ------------------------------------------------------------ */
    /*                         STATE API                             */
    /* ------------------------------------------------------------ */

    /**
     * Reset runtime memory/ram state to defaults for a fresh battle or round.
     * @returns {void}
     */
    resetBattleState() {
        this.#memoryStack = {};
        this.#ramLoad = 1.0;
        this.#buffs = { shielded: false };
    }

    get memoryStack() { return this.#memoryStack; }
    get ramLoad() { return this.#ramLoad; }
    get isShielded() { return this.#buffs.shielded; }

    /**
     * Consume a currently active shield buff if present.
     * @returns {boolean} True if a shield was consumed, false if none was active
     */
    consumeShield() {
        if (this.#buffs.shielded) {
            this.#buffs.shielded = false;
            return true;
        }
        return false;
    }

    /**
     * Handle end-of-turn decay: decrement memory lifetimes and remove expired entries.
     * @returns {void}
     */
    processTurnEnd() {
        for (const key in this.#memoryStack) {
            this.#memoryStack[key].lifetime--;
            if (this.#memoryStack[key].lifetime <= 0) {
                delete this.#memoryStack[key];
            }
        }
    }

    /* ------------------------------------------------------------ */
    /*                    SYNTAX DATA HELPERS                        */
    /* ------------------------------------------------------------ */

    /**
     * Lookup keyword metadata (costs, base damage, complexity) from the loaded syntax data.
     * @param {string} keywordName
     * @returns {object|null} Keyword metadata object or null when not found
     */
    getKeywordData(keywordName) {
        const categories = this.#syntaxData.keywords;
        for (const cat in categories) {
            if (categories[cat][keywordName]) {
                return categories[cat][keywordName];
            }
        }
        return null;
    }

    /* ------------------------------------------------------------ */
    /*                    CORE PARSING LOGIC                         */
    /* ------------------------------------------------------------ */

    /**
     * Core parsing logic (Simulation + Execution)
     * Parses the provided code and either simulates effects (when isSimulation=true)
     * or applies them to runtime state. Returns aggregated results including total RAM
     * cost, damage and logs.
     * @param {string} code - Player-written pseudo-Java code
     * @param {boolean} isSimulation - If true, do not commit state changes
     * @returns {{success:boolean, totalRamCost:number, totalDamage:number, logs:string[], error?:string, keywords?:string[]}}
     */
    #parseCode(code, isSimulation) {
        if (!code) {
            return {
                success: false,
                totalRamCost: 0,
                totalDamage: 0,
                logs: [],
                keywords: [] // added
            };
        }

        // Split the code into executable lines (supports newlines or semicolons) and strip whitespace
        const lines = code
            .split(/\n|;/)
            .map(l => l.trim())
            .filter(Boolean);

        // When simulating (prediction), operate on a clone so we don't mutate runtime state
        const workingStack = isSimulation
            ? structuredClone(this.#memoryStack)
            : this.#memoryStack;

        // Working RAM load affects subsequent instruction costs
        let workingLoad = this.#ramLoad;
        const MAX_WORKING_LOAD = 3.0; // Cap multiplier to prevent inflation

        // Accumulators for results
        let totalRamCost = 0;
        let totalDamage = 0;
        let logs = [];
        let success = false;
        let keywords = []; // NEW: track parsed keywords

        for (const line of lines) {
            if (line.startsWith("//")) continue;

            /* ---------------- System.gc() ---------------- */
            // System.gc(): reset working load (simulates garbage collection)
            if (line.includes("System.gc()")) {
                keywords.push("System.gc()");
                const kwData = this.getKeywordData("System.gc()");
                if (!kwData) continue;

                const cost = Math.floor(kwData.ramCost * workingLoad);
                totalRamCost += cost;
                workingLoad = 1.0;

                if (!isSimulation) {
                    logs.push("Garbage Collection: Load reset.");
                }

                success = true;
                continue;
            }

            /* ---------------- Declarations ---------------- */
            // Variable declaration handling: supports int, double, String, boolean
            const declMatch = line.match(/^(int|double|String|boolean)\s+(\w+)\s*=\s*(.*)$/);
            if (declMatch) {
                const [, type, name, raw] = declMatch;
                keywords.push(type);
                const kwData = this.getKeywordData(type);
                if (!kwData) continue;

                // Prevent runtime allocations if memory is full
                if (!isSimulation && Object.keys(this.#memoryStack).length >= this.#MAX_SLOTS) {
                    return {
                        success: false,
                        error: "Memory Stack Overflow!",
                        totalRamCost: 0,
                        totalDamage: 0,
                        logs: []
                    };
                }
        /** @type {string | number | boolean} */
                let value = raw.replace(/"/g, "");
                if (type === "int" || type === "double") value = Number(value);
                if (type === "boolean") value = value === "true";

                const cost = Math.floor(kwData.ramCost * workingLoad);
                totalRamCost += cost;
                // Declarations increase working load for subsequent ops
                workingLoad += (kwData.complexity || 0.1) * 0.5; // Reduce growth rate
                workingLoad = Math.min(workingLoad, MAX_WORKING_LOAD); // Cap it

                if (!isSimulation) {
                    workingStack[name] = { value, type, lifetime: 5 };
                    if (type === "boolean" && value === true) {
                        // Example: declaring a boolean true can set a shield buff
                        this.#buffs.shielded = true;
                    }
                    logs.push(`Allocated ${type} ${name}.`);
                }

                success = true;
                continue;
            }

            /* ---------------- Output / Attack ---------------- */
            // System.out.println is treated as an attack / output that can deal damage
            const printMatch = line.match(/^System\.out\.println\((.*)\)$/);
            if (printMatch) {
                keywords.push("System.out.println");
                const param = printMatch[1].trim();
                const kwData = this.getKeywordData("System.out.println");
                if (!kwData) continue;

                const cost = Math.floor(kwData.ramCost * workingLoad);
                let damage = kwData.baseDamage || 0;

                // If parameter refers to a numeric variable, add its value to damage
                if (workingStack[param] && typeof workingStack[param].value === "number") {
                    damage += workingStack[param].value;
                }

                // 🔥 VARIABLE-AWARE SYNERGY: some variable types pair with keywords to boost damage
                let variableType = "literal";
                if (workingStack[param]) {
                    variableType = workingStack[param].type;
                }

                const synergyKey = `${variableType}+System.out.println`;
                const syn = this.#syntaxData.synergies?.[synergyKey];

                if (syn) {
                    damage *= syn.bonusDmgMultiplier || 1;
                    if (!isSimulation) {
                        logs.push(`SYNERGY: ${syn.name}!`);
                    }
                }

                totalDamage += Math.floor(damage);
                totalRamCost += cost;
                // Output increases load for the remaining instructions
                workingLoad += kwData.complexity || 0.1;

                if (!isSimulation) {
                    logs.push(`Output: ${Math.floor(damage)} dmg.`);
                }

                success = true;
                continue;
            }

            /* ---------------- Math.random() ---------------- */
            if (line.includes("Math.random()")) {
                keywords.push("Math.random()");
                const kwData = this.getKeywordData("Math.random()");
                if (!kwData) continue;

                const cost = Math.floor(kwData.ramCost * workingLoad);
                const damage = (kwData.baseDamage || 0) + Math.floor(Math.random() * 10) + 1;

                totalDamage += damage;
                totalRamCost += cost;
                workingLoad += kwData.complexity || 0.1;

                if (!isSimulation) {
                    logs.push(`Random: ${damage} dmg.`);
                }

                success = true;
                continue;
            }

            /* ---------------- Simple Keywords ---------------- */
            const simpleKeywords = ["while", "for", "if", "try", "catch", "break", "return", "new", "class"];
            for (const key of simpleKeywords) {
                if (line.startsWith(key)) {
                    keywords.push(key);
                    const kwData = this.getKeywordData(key);
                    if (!kwData) break;

                    const cost = Math.floor(kwData.ramCost * workingLoad);
                    totalRamCost += cost;
                    // Reduce or remove this line to prevent inflation:
                    workingLoad += (kwData.complexity || 0.1) * 0.25; // Much smaller increase
                    workingLoad = Math.min(workingLoad, MAX_WORKING_LOAD); // Cap it

                    if (!isSimulation && key === "return") {
                        logs.push("Execution ended by return.");
                        this.#ramLoad = workingLoad;
                        return { success: true, totalRamCost, totalDamage, logs, keywords };
                    }

                    success = true;
                    break;
                }
            }
        }

        // Commit runtime state only when not simulating: update global RAM load
        if (!isSimulation) {
            this.#ramLoad = workingLoad;
        }

        return {
            success,
            logs,
            totalRamCost,
            totalDamage,
            keywords // include even if empty
        };
    }

    /* ------------------------------------------------------------ */
    /*                    PUBLIC API                                 */
    /* ------------------------------------------------------------ */

    /**
     * Simulate the code and return the estimated RAM cost.
     * @param {string} code
     * @returns {number}
     */
    predictCost(code) {
        return this.#parseCode(code, true).totalRamCost;
    }

    /**
     * Execute the provided code (with state changes) and return the result object.
     * @param {string} code
     * @returns {object}
     */
    evaluatePlayerCode(code) {
        return this.#parseCode(code, false);
    }
}
