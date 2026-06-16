/**
 * Combatant view for enemies in the battle scene.
 * Adds enemy-specific layout and health text to the generic `BattleComponent`.
 */
import { BATTLE_ASSET_KEYS } from "../../assets/assets-keys/asset-keys.js";
import { HealthBar } from "../ui/menu/ui-bar/healthbar.js";
import { BattleComponent } from "./battle-component.js";

/** @type {import("../../types/typedef.js").Coordinate} */
const ENEMY_POSITION = Object.freeze({
    x: 200,
    y: 200, 
});

export class BattleEnemyComponent extends BattleComponent {
    /** @type {Phaser.GameObjects.Text} */
    #hpText;
    /** @type {Phaser.GameObjects.Text} */
    #hpLabel; 

    // Ensure callers get a numeric base attack
    get baseAttack() {
        return Number(this._combatantDetails?.baseAttack) || 0;
    }
    get name() {
        return this._combatantDetails?.name ?? 'Enemy';
    }

    /**
     * Create an enemy combatant component and attach its HUD and platform.
     * @param {import("../../types/typedef.js").BattleCombatantConfig} config
     * @param {import("../../types/typedef.js").Coordinate} position
     */
    constructor(config, position) {
        // Position enemy at specified coordinates (fall back to default enemy position)
        super(config, position || ENEMY_POSITION);

        // Draw a platform below the enemy and scale the sprite for emphasis
        this._scene.add.image(this._phaserGameObject.x, this._phaserGameObject.y + 70, BATTLE_ASSET_KEYS.PLATFORM).setScale(6).setDepth(this._phaserGameObject.depth - 0.5);
        this._phaserGameObject.setScale(2); //Resize enemy sprite for emphasis

        // Position enemy HUD to the left side
        this._phaserHealthBarGameContainer.setPosition(384, 345);

        // Create and add an enemy-specific healthbar (separate instance from player)
        this._healthBar = new HealthBar(this._scene, 32, 32, 340);
        this._phaserHealthBarGameContainer.add(this._healthBar.container);
        
        // Apply Enemy specific name styling
        this._nameText.setColor('#b91b1bff');
        this._nameText.setStroke('#070d5cff', 4);

        this.#addStatText();
        this.combatantDetails = undefined;
    }

    /**
     * Create enemy-specific stat text elements and attach them to the HUD container.
     * 
     */
    #addStatText() {
        this.#hpLabel = this._scene.add.text(20, 40, "HP:", {
            fontFamily: "FutureNarrow", fontSize: "14px", fontStyle: "bold", color: "#ffae00",
        });

        this.#hpText = this._scene.add.text(182, 57.6, `${this._currentHp}/${this._maxHp}`, {
            fontFamily: "FutureNarrow", fontSize: "10px",
        });
        this._phaserHealthBarGameContainer.add([this.#hpLabel, this.#hpText]);
    }

    /**
     * @param {number} damage 
     * @param {() => void} [callback] 
     */
    takeDamage(damage, callback) {
        super.takeDamage(damage, callback);
        this.#hpText.setText(`${this._currentHp}/${this._maxHp}`);
    }
}