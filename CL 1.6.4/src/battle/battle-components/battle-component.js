/**
 * Shared base for battle UI combatants (player & enemies).
 * - Handles sprite creation, HP/RAM tracking and health bar UI setup.
 * - Subclasses can extend to add player/enemy specific widgets.
 */
import { BATTLE_CONTAINERS_KEYS, DATA_ASSET_KEYS } from "../../assets/assets-keys/asset-keys.js";

export class BattleComponent {
    /** @protected @type {Phaser.Scene} */
    _scene;
    /** @protected @type {import("../../types/typedef.js").Combatant} */
    _combatantDetails;
    /** @protected @type {import("../ui/menu/ui-bar/healthbar.js").HealthBar} */
    _healthBar;
    /** @protected @type {Phaser.GameObjects.Sprite} */
    _phaserGameObject;
    /** @protected @type {Phaser.GameObjects.Text} */
    _nameText;
    /** @protected @type {number} */
    _currentHp;
    /** @protected @type {number} */
    _maxHp;
    /** @protected @type {number} */
    _currentRam;
    /** @protected @type {number} */
    _maxRam;
    /** @protected @type {import("../../types/typedef.js").CodeAttacks[]} */
    _codeAttacks;
    /** @protected @type {Phaser.GameObjects.Container} */
    _phaserHealthBarGameContainer;

    constructor(config, position) {
        this._scene = config.scene;
        this._combatantDetails = config.combatantDetails;
        this._currentHp = this._combatantDetails.currentHp;
        this._maxHp = this._combatantDetails.maxHp;
        this._currentRam = this._combatantDetails.currentRam;
        this._maxRam = this._combatantDetails.maxRam;
        this._codeAttacks = [];

        this._phaserGameObject = this._scene.add.sprite(
            position.x,
            position.y,
            this._combatantDetails.assetKey,
            this._combatantDetails.assetFrame || 0
        );

        if (this._combatantDetails.anims) {
            this._phaserGameObject.play(this._combatantDetails.anims);
        }

        this.#createHealthBarComponents(config.scaleHealthBarBackgroundImageByY);
    
       const data = this._scene.cache.json.get(DATA_ASSET_KEYS.CODE_SYNTAX)

       if (data && data.keywords) {
           if(this._combatantDetails.attackIds){
               // Logic to find specific attacks if needed by ID
           }
       }
    }

    get isDefeated() { return this._currentHp <= 0; }
    get name() { return this._combatantDetails.name; }
    get currentHp() { return this._currentHp; }
    get maxHp() { return this._maxHp; }
    get currentRam() { return this._currentRam; }
    get maxRam() { return this._maxRam; }

    /**
     * @param {number} damage 
     * @param {() => void} [callback] 
     */
    takeDamage(damage, callback) {
        // Ensure damage is a number, not undefined/NaN
        damage = Number(damage) || 0;
        
        // Reduce HP but never below zero
        this._currentHp = Math.max(0, this._currentHp - damage);
        
        // Animate the health bar safely (guard against division by zero)
        if (this._maxHp > 0) {
            const percent = this._currentHp / this._maxHp;
            if (this._healthBar) {
                this._healthBar.setMeterPercentageAnimated(percent, { callback });
            } else if (callback) {
                callback();
            }
        } else if (callback) {
            callback();
        }
    }

    /**
     * Checks if the combatant has enough RAM for an operation.
     * @param {number} cost 
     * @returns {boolean}
     */
    hasEnoughRam(cost) {
        return this._currentRam >= cost;
    }

    /**
     * @param {number} amount - Positive to consume, Negative to restore
     * @param {() => void} [callback]
     */
    updateRam(amount, callback) {
        this._currentRam = Math.max(0, Math.min(this._maxRam, this._currentRam - amount));
        if (callback) callback();
    }

    /**
     * Restores a specific amount of RAM to the combatant.
     * This is a wrapper around `updateRam` for clarity, as the player
     * component overrides `updateRam` to handle UI updates.
     * * @param {number} amount - The amount of RAM to restore.
     * @param {() => void} [callback]
     */
    rechargeRam(amount, callback) {
        // Calling updateRam with a negative amount restores RAM:
        // this._currentRam - (-amount) => this._currentRam + amount
        this.updateRam(-amount, callback);
    }

    #createHealthBarComponents(scaleHealthBarBackgroundImageByY = 1) {
        const MAX_NAME_WIDTH = 180; 

        this._nameText = this._scene.add.text(20, 10, this.name, {
            fontFamily: "FutureNarrow", fontSize: "20px", color: "#ffffff", fontStyle: "bold"
        });

        if (this._nameText.width > MAX_NAME_WIDTH) {
            this._nameText.setScale(MAX_NAME_WIDTH / this._nameText.width);
        }

        const levelText = this._scene.add.text(
            this._nameText.x + this._nameText.displayWidth + 6, 
            this._nameText.y + 6, 
            "Lv " + this._combatantDetails.currentLevel, 
            {
                fontFamily: "FutureNarrow", fontSize: "12px", color: "#ddd012", fontStyle: "bold",
            }
        );

        const panelImage = this._scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.PANEL2)
            .setOrigin(0, 0)
            .setScale(1, scaleHealthBarBackgroundImageByY);

        this._phaserHealthBarGameContainer = this._scene.add.container(0, 0, [
            panelImage,
            this._nameText,
            levelText,
        ]);
    }

    
}