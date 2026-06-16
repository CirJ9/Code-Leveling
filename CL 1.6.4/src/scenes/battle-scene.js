/**
 * Scene responsible for orchestration of a battle.
 * - Sets up BGM, background, combatants, UI and ties editor input to `AttackManager`.
 */
import Phaser from "../../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";  
import { BattleMenu } from "../battle/ui/menu/battle-menu.js";
import { DIRECTION } from "../common/direction.js";
import { Background } from "../battle/background.js";
import { BattleEnemyComponent } from "../battle/battle-components/battle-enemy-component.js";
import { BattlePlayerComponent } from "../battle/battle-components/battle-player-component.js";
import { AUDIO_ASSET_KEYS, VIRUSED_ASSET_KEYS } from "../assets/assets-keys/asset-keys.js";
import { AttackManager } from "../battle/logic/attack-manager.js";
import { focusEditor } from "../battle/monaco/monaco-api.js";

const RAM_RECHARGE_PER_TURN = 5;
const MANUAL_RECHARGE_AMOUNT = 20;

export class BattleScene extends Phaser.Scene {
    /** @type {BattleMenu} */
    #battleMenu
    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    #cursorKeys;
    /** @type {BattleEnemyComponent} */
    #activeEnemy;
    /** @type {BattlePlayerComponent} */
    #activePlayer;
    /** @type {AttackManager} */
    #attackManager;
    
    constructor(){
        super({ key: SCENE_KEYS.BATTLE_SCENE });
    }

    create(){
        // Stop other audio and start battle BGM
        this.sound.stopAll();
        this.battleBGM = this.sound.add(AUDIO_ASSET_KEYS.BATTLE_BG_MUSIC, { loop: true, volume: 0.6 });
        this.battleBGM.play();


        // Set up background and battle systems
        const background = new Background(this);
        background.showTutorialBG();

        // AttackManager handles parsing/evaluating player code
        this.#attackManager = new AttackManager(this);
        this.#attackManager.resetBattleState(); // Ensure clean state

        // Try to load game-data (enemy/player) if available; otherwise keep previous hardcoded setup
        const enemyJson = this.cache.json.get('ENEMY_DATA') || this.cache.json.get('enemy-data') || this.cache.json.get('enemyData') || this.cache.json.get('enemy-data');
        const playerJson = this.cache.json.get('PLAYER_DATA') || this.cache.json.get('player-data') || this.cache.json.get('playerData') || this.cache.json.get('player-data');
        // @ts-ignore
        const encounterEnemy = this.scene.settings.data?.encounterEnemy;

        // enemyId now means RARITY
        const requestedRarity = encounterEnemy?.getData('enemyId') || 'common';

        let enemyConfig = null;

        if (enemyJson && Array.isArray(enemyJson.enemies)) {

            // 1. Filter enemies by rarity
            let pool = enemyJson.enemies.filter(e => e.rarity === requestedRarity);

            // 2. Safety fallback
            if (pool.length === 0) {
                console.warn(`No enemies for rarity "${requestedRarity}", falling back to common.`);
                pool = enemyJson.enemies.filter(e => e.rarity === 'common');
            }

            // 3. Pick random enemy from pool
            enemyConfig = Phaser.Utils.Array.GetRandom(pool);
        }


        // Helper to map JSON enemy/player shape into combatantDetails expected by components
        const toCombatantDetails = (raw, fallback) => {
            if (!raw) return fallback;
            return {
                name: raw.name ?? fallback.name,
                assetKey: raw.assetKey ?? fallback.assetKey,
                currentHp: raw.currentHp ?? raw.hp ?? fallback.currentHp,
                maxHp: raw.maxHp ?? raw.maxHp ?? raw.hp ?? fallback.maxHp,
                currentRam: raw.currentRam ?? raw.ram ?? fallback.currentRam,
                maxRam: raw.maxRam ?? raw.ram ?? fallback.maxRam,
                baseAttack: raw.baseAttack ?? fallback.baseAttack,
                currentLevel: raw.currentLevel ?? (Array.isArray(raw.levelRange) ? raw.levelRange[0] : fallback.currentLevel),
                attackIds: raw.attackIds ?? fallback.attackIds ?? [],
                anims: raw.anims ?? fallback.anims ?? ""
            };
        };

        this.#activeEnemy = new BattleEnemyComponent({
            scene: this,
            combatantDetails: toCombatantDetails(enemyConfig, {
                name: 'Corrupted Sister',
                assetKey: VIRUSED_ASSET_KEYS.C_SISTER,
                currentHp: 25,
                maxHp: 25,
                currentRam: 0,
                maxRam: 0,
                baseAttack: 5,
                currentLevel: 1,
                attackIds: [501],
                anims: VIRUSED_ASSET_KEYS.C_SISTER_ANIMATIONS,
            })
        }, {x: 512, y: 240});     
    
        this.#activePlayer = new BattlePlayerComponent({
            scene: this,
            combatantDetails: toCombatantDetails(playerJson?.player ?? playerJson, {
                name: "DevHero",
                assetKey: "",
                currentHp: 100,
                maxHp: 100,
                currentRam: 100,
                maxRam: 100,
                baseAttack: 5,
                currentLevel: 1,
                attackIds: [],
                anims: "",
            })
        });

        this.#battleMenu = new BattleMenu(this, this.#activeEnemy);

        // Bind Run Logic
        this.#battleMenu.setOnRunPressed((code) => {
            this.#handlePlayerRunCode(code);
        });

        // Bind Live Prediction Logic
        this.#battleMenu.setOnEditorChange((code) => {
            return this.#attackManager.predictCost(code);
        });
        // Bind Recharge Logic
        this.#battleMenu.setOnRechargeRequested(this.#handlePlayerRecharge.bind(this));

        this.#cursorKeys = this.input.keyboard.createCursorKeys();

        // Listen for flee attempts emitted by the UI menu
        this.events.on('attemptFlee', () => this.tryFlee());
    }

    update(){
        if (window.isEditorActive) return;

        const wasSpaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
        if (wasSpaceKeyPressed){
            this.#battleMenu.handlePlayerInput('OK');
        }
        if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift)){
            this.#battleMenu.handlePlayerInput('CANCEL');
        }
        
    /** @type {import('../common/direction.js').DIRECTION} */
        let selectedDirection = DIRECTION.NONE;
        if (this.#cursorKeys.left.isDown) selectedDirection = DIRECTION.LEFT;
        else if (this.#cursorKeys.right.isDown) selectedDirection = DIRECTION.RIGHT;
        else if (this.#cursorKeys.up.isDown) selectedDirection = DIRECTION.UP;
        else if (this.#cursorKeys.down.isDown) selectedDirection = DIRECTION.DOWN;

        if (selectedDirection !== DIRECTION.NONE){
            this.#battleMenu.handlePlayerInput(selectedDirection);
        }
    }

    /**
     * Main Logic: Processes the code written in Monaco, validates, applies RAM cost and deals damage.
     * @param {string} code - Source code written by the player
     * @returns {void}
     */
    #handlePlayerRunCode(code) {
        this.#battleMenu.hideMainBattleUI();
        
        // CRITICAL: Reset attack manager state before each attack
        this.#attackManager.resetBattleState();
        
        const result = this.#attackManager.evaluatePlayerCode(code);

        // Error Handling
        if (!result.success && result.error) {
            this.#battleMenu.addToHistoryLog(`Error: ${result.error}`);
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
                ['Execution Failed...', result.error], 
                () => { this.#battleMenu.showMainBattleUI(); }
            );
            return;
        } else if (!result.success) {
            // No keywords found or valid code
             this.#battleMenu.addToHistoryLog(`Syntax Error: No valid commands.`);
             this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
                ['Syntax Error.', 'No executable commands found.'], 
                () => { this.#battleMenu.showMainBattleUI(); }
            );
            return;
        }

        // Check Affordability: ensure player has enough RAM to run the code
        if (!this.#activePlayer.hasEnoughRam(result.totalRamCost)) {
            this.#battleMenu.addToHistoryLog("Runtime Error: Insufficient RAM.");
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
                ['Out of Memory Exception!', `Need ${result.totalRamCost} RAM.`], 
                () => { this.#battleMenu.showMainBattleUI(); }
            );
            return;
        }

        // Apply Costs: deduct RAM from the player immediately
        this.#activePlayer.updateRam(result.totalRamCost);
        
        // Log Results reported by the attack manager (actions, synergies, etc.)
        result.logs.forEach(log => {
             this.#battleMenu.addToHistoryLog(log);
        });

        const summaryMsg = `Ran ${(result.keywords || []).length} cmds | Dmg: ${result.totalDamage}`;

        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([summaryMsg], () => {
            // Apply Damage
            if (result.totalDamage > 0) {
                this.time.delayedCall(500, () => {
                    this.#activeEnemy.takeDamage(result.totalDamage, () => {
                        this.#checkBattleEndOrEnemyTurn();
                    });
                });
            } else {
                 // No damage dealt (declarations only), go straight to enemy turn
                 this.#checkBattleEndOrEnemyTurn();
            }
        });
    }

    #checkBattleEndOrEnemyTurn() {
        if (this.#activeEnemy.isDefeated) {
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(['Enemy Defeated!'], () => {
                    this.scene.stop(SCENE_KEYS.BATTLE_SCENE);
                    this.scene.wake(SCENE_KEYS.WORLD_SCENE);
            });
        } else {
            this.#battleMenu.showBattleChoices();
            this.#enemyAttack();
        }
    }

    #enemyAttack(){
        // Variable Decay
        this.#attackManager.processTurnEnd();

        // Check Shield
        // Defensive: ensure numeric damage
        let dmg = Number(this.#activeEnemy.baseAttack) || 0;
        let msg = `${this.#activeEnemy.name} attacks!`;

        if (this.#attackManager.consumeShield()) {
            dmg = Math.floor(dmg / 2);
            msg += "\n(Shielded: Damage Halved!)";
        }

        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
            [msg], 
            () => {
                this.time.delayedCall(500, () => {
                    this.#activePlayer.takeDamage(dmg, () => {
                        if (this.#activePlayer.isDefeated) {
                            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(
                                ['You were defeated...'],
                                () => {
                                    this.scene.stop(SCENE_KEYS.BATTLE_SCENE);
                                    this.scene.wake(SCENE_KEYS.WORLD_SCENE);
                                }
                            );
                            return;
                        }
                        this.#activePlayer.rechargeRam(RAM_RECHARGE_PER_TURN);
                        // Player survived → back to menu
                        this.#battleMenu.showBattleChoices();
                        focusEditor();
                    });

                })
            }
        );
    }

    /**
     * Attempt to flee: 50% chance of success by default. On success, end the battle and return to the world scene
     * at the encounter point (provided by WorldScene when launching the battle). On failure, the enemy takes a turn.
     */
    tryFlee() {
        // Prevent calling while handling another UI action
        this.#battleMenu.hideMainBattleUI();        
        
        const fleeChance = 1; // TODO: make configurable or influenced by stats
        const success = Math.random() < fleeChance;

        if (success) {
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([
                'You escaped successfully!'
            ], () => {
                // Stop battle and return to world
                const settingsData = /** @type {any} */ (this.scene.settings.data);
                const encounterPoint = settingsData?.encounterPoint;
                const encounterEnemy = settingsData?.encounterEnemy;

                // If an encounter enemy was provided, mark it on cooldown so it won't re-trigger immediately
                try {
                    if (encounterEnemy) {
                        const COOLDOWN_MS = 5000;
                        encounterEnemy.setVelocity && encounterEnemy.setVelocity(0, 0);
                        if (encounterEnemy.body) encounterEnemy.body.enable = false;
                        encounterEnemy.setTint && encounterEnemy.setTint(0x999999);
                        encounterEnemy.setData && encounterEnemy.setData('isOnCooldown', true);
                        encounterEnemy.setData && encounterEnemy.setData('cooldownUntil', Date.now() + COOLDOWN_MS);
                    }
                } catch (e) { /* ignore */ }

                this.scene.stop(SCENE_KEYS.BATTLE_SCENE);
                const world = /** @type {any} */ (this.scene.get(SCENE_KEYS.WORLD_SCENE));
                if (world && encounterPoint && world.player) {
                    // Position player at encounter point (slight offset to avoid immediate re-trigger)
                    const offsetX = 0;
                    const offsetY = 0;
                    try { world.player.setPosition(encounterPoint.x + offsetX, encounterPoint.y + offsetY); } catch(e) { /*ignore*/ }
                    // If physics body exists, also reset it
                    try { if (world.player.body && typeof world.player.body.reset === 'function') world.player.body.reset(encounterPoint.x + offsetX, encounterPoint.y + offsetY); } catch(e){/*ignore*/}
                }

                // Wake the world; when it wakes it will set timers to re-enable any cooldowned enemies
                this.scene.wake(SCENE_KEYS.WORLD_SCENE);
            });
        } else {
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([
                'Failed to escape!'
            ], () => {
                // On failure the enemy gets a turn
                 this.#checkBattleEndOrEnemyTurn();
            });
        }
    }

    /**
     * Handles the logic for a player selecting the 'RECHARGE' option (via the UI button).
     * This action also ends the player's turn.
     */
    #handlePlayerRecharge() {
        this.#activePlayer.rechargeRam(MANUAL_RECHARGE_AMOUNT);

        // Display the recharge message, then start the enemy's turn
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([
            `RAM recharged by ${MANUAL_RECHARGE_AMOUNT}.`,
            `Current RAM: ${this.#activePlayer.currentRam}`, // Display current RAM after recharge
        ], () => {
            this.#battleMenu.hideMainBattleUI();
            this.#checkBattleEndOrEnemyTurn(); // Proceed to check for battle end, then enemy turn
        });
    }
}