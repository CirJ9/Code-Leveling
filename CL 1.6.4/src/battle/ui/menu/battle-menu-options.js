/**
 * Enum-like constants used by the battle menu to track the active choice and sub-menus.
 */
/** @typedef {keyof typeof BATTLE_CHOICE_OPTIONS} choiceSelectionOptions*/

/** @enum {choiceSelectionOptions} */
export const BATTLE_CHOICE_OPTIONS = Object.freeze({
    CODE: 'CODE',
    RECHARGE: 'RECHARGE',
    ITEM: 'ITEM',
    FLEE: 'FLEE',
});

/** @typedef {keyof typeof ACTIVE_BATTLE_MENU} ActiveBattleMenu*/

/** @enum {ActiveBattleMenu} */
export const ACTIVE_BATTLE_MENU = Object.freeze({
    BATTLE_CHOICE_MAIN: 'BATTLE_CHOICE_MAIN',
    BATTLE_CODE: 'BATTLE_CODE',
    BATTLE_ITEM: 'BATTLE_ITEM',
    BATTLE_FLEE: 'BATTLE_FLEE',
});

/**
 * @typedef {keyof typeof CODE_ATTACK_OPTIONS} AttackMoveOptions
 */

/** @enum {AttackMoveOptions} */
export const CODE_ATTACK_OPTIONS = Object.freeze({
  MOVE_1: 'MOVE_1',
  MOVE_2: 'MOVE_2',
  MOVE_3: 'MOVE_3',
  MOVE_4: 'MOVE_4',
});