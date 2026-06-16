/**
 * UI component representing the player in the battle screen.
 * - Extends the shared `BattleComponent` to add RAM/EXP UI and player-specific layout.
 */
import { BattleComponent } from "./battle-component.js";
import { HealthBar } from "../ui/menu/ui-bar/healthbar.js";
import { Rambar } from "../ui/menu/ui-bar/rambar.js";
import { Expbar } from "../ui/menu/ui-bar/expbar.js";
import { BATTLE_CONTAINERS_KEYS } from "../../assets/assets-keys/asset-keys.js";

const PLAYER_POSITION = Object.freeze({ x: -9999, y: -9999 });

export class BattlePlayerComponent extends BattleComponent {
    /** @type {Rambar} */
    #ramBar;
    /** @type {Expbar} */
    #expBar;
    /** @type {Phaser.GameObjects.Text} */
    #hpText;
    /** @type {Phaser.GameObjects.Text} */
    #ramText;
    /** @type {Phaser.GameObjects.Text} */
    #hpLabel; 

    /**
     * Create the player's battle HUD and UI components (HP, RAM, EXP bars).
     * @param {{scene: Phaser.Scene, combatantDetails: Object}} config
     */
    constructor(config) {
        // Use offscreen position because player HUD is fixed and not tied to sprite
        super(config, PLAYER_POSITION);
        
        // Position the player's HUD on the screen
        this._phaserHealthBarGameContainer.setPosition(512, 446);
        
        // Replace background image with the player panel art
        const bg = this._phaserHealthBarGameContainer.getAt(0);
        if (bg instanceof Phaser.GameObjects.Image) {
            bg.setTexture(BATTLE_CONTAINERS_KEYS.PLAYER_PANEL);
        }

        this._nameText.setColor('#ffffffff');
        this._nameText.setStroke('#00000000', 0);

        this.#addPlayerSpecificComponents();
    }

    /**
     * Create and attach player-specific HUD widgets: hp text, ram bar, ram text and exp bar.
     * 
     */
    #addPlayerSpecificComponents() {
        this._healthBar = new HealthBar(this._scene, 40, 38.5, 400);
        this.#hpLabel = this._scene.add.text(20, 50, "HP:", {
            fontFamily: "FutureNarrow", fontSize: "14px", fontStyle: "bold", color: "#ffae00",
        });
        this.#hpText = this._scene.add.text(230, 65, `${this._currentHp}/${this._maxHp}`, { 
            fontFamily: "FutureNarrow", fontSize: "10px",
        });

        const ramLabel = this._scene.add.text(20, 85, "RAM:", {
            fontFamily: "FutureNarrow", fontSize: "14px", fontStyle: "bold", color: "#ffae00",
        });

        this.#ramBar = new Rambar(this._scene, 40, 62, 400);
        
        this.#ramText = this._scene.add.text(230, 100, `${this._currentRam}/${this._maxRam}`, {
            fontFamily: 'FutureNarrow', fontSize: '10px',
        });

        this.#expBar = new Expbar(this._scene, 40, 120, 400);

        this._phaserHealthBarGameContainer.add([
            this._healthBar.container,
            this.#hpLabel,
            this.#hpText,
            ramLabel,
            this.#ramBar.container,
            this.#ramText,
            this.#expBar.container
        ]);
    }

    /**
     * Apply damage to player, update the HP text to match.
     * @param {number} damage
     * @param {() => void} [callback]
     */
    takeDamage(damage, callback) {
        super.takeDamage(damage, callback);
        this.#hpText.setText(`${this._currentHp}/${this._maxHp}`);
    }

    /**
     * Update player's RAM and animate the RAM bar and text to reflect changes.
     * @param {number} amount - Positive to consume, Negative to restore
     * @param {() => void} [callback]
     */
    updateRam(amount, callback) {
        super.updateRam(amount, callback);
        this.#ramBar.setMeterPercentageAnimated(this._currentRam / this._maxRam, { callback });
        this.#ramText.setText(`${this._currentRam}/${this._maxRam}`);
    }
}