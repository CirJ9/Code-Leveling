import Phaser from "../../lib/phaser.js";

/**
 * @typedef KeywordData
 * @type {Object}
 * @property {number} ramCost - The resource cost consumed upon execution.
 * @property {number} complexity - The difficulty rating (1-10) of the keyword.
 * @property {string} type - The combat classification (e.g., 'declaration', 'loop', 'logic').
 * @property {number} ramLoad - The minimum RAM capacity required to run the attack.
 * @property {number} [baseDamage] - Optional base damage value for offensive functions.
 */

/**
 * @typedef {Object.<string, KeywordData>} KeywordCategory
 */

/**
 * @typedef Keywords
 * @type {Object}
 * @property {KeywordCategory} primitives - Basic data types.
 * @property {KeywordCategory} output_and_functions - Active skills and system utilities.
 * @property {KeywordCategory} loops - Iterative control structures.
 * @property {KeywordCategory} logic_and_flow - Conditionals and flow control.
 * @property {KeywordCategory} exceptions - Error handling logic.
 * @property {KeywordCategory} oop_structure - Class and object definitions.
 * @property {KeywordCategory} modifiers - Access and state modifiers.
 * @property {KeywordCategory} context_and_scope - Scope-specific keywords.
 */

/**
 * @typedef SynergyData
 * @type {Object}
 * @property {string} name - Name of the synergy.
 * @property {number} [bonusDmgMultiplier] - Damage boost if applicable.
 * @property {string} [effect] - Special effect key.
 * @property {string} msg - Message to display when triggered.
 */

/**
 * @typedef CodeSyntaxData
 * @type {Object}
 * @property {Keywords} keywords - The grouped keyword data.
 * @property {Object.<string, SynergyData>} synergies - The synergy combinations.
 */

/**
 * @typedef CodeAttacks
 * @type {Object}
 * @property {number} id - Unique identifier for the attack.
 * @property {string} name - The keyword name (e.g., "int").
 * @property {string} animationName - The animation key triggered by this attack.
 * @property {number} ramCost - From JSON: Resource consumption.
 * @property {number} ramLoad - From JSON: Minimum RAM requirement.
 * @property {number} complexity - From JSON: Difficulty rating.
 * @property {string} type - From JSON: Combat category.
 * @property {number} [baseDamage] - From JSON: Damage value.
 */

/**
 * @typedef BattleCombatantConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
 * @property {Combatant} combatantDetails
 * @property {number} [scaleHealthBarBackgroundImageByY=1]
 */

/**
 * @typedef Combatant
 * @type {Object}
 * @property {string} name
 * @property {string} assetKey
 * @property {number} [assetFrame=0]
 * @property {number} currentHp
 * @property {number} maxHp
 * @property {number} currentLevel
 * @property {number} maxLevel
 * @property {number} currentExp
 * @property {number} nextLevelExp 
 * @property {number} baseAttack
 * @property {number} currentRam
 * @property {number} maxRam
 * @property {number[]} attackIds
 * @property {string} anims
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */