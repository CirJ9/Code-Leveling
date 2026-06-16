/**
 * Background helper for battle scenes: manages loading and showing battle backgrounds.
 * @module Background
 */
import Phaser from "../../lib/phaser.js";
import { BATTLE_BACKGROUND_ASSET_KEYS } from "../assets/assets-keys/asset-keys.js";

export class Background {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Image} */
    #bacgroundGameObject;
    /** 
     * @param {Phaser.Scene} scene the Phaser Scene BattleMenu will be added
     * */

    constructor (scene){
        this.#scene = scene;

        // Create the background image offscreen and hide it initially
        this.#bacgroundGameObject = this.#scene.add
            .image(0, 0, BATTLE_BACKGROUND_ASSET_KEYS.TUTORIAL_BG)
            .setOrigin(0)
            .setAlpha(0)
            .setDepth(-10);
    }

    // Make the tutorial background visible
    showTutorialBG(){
        this.#bacgroundGameObject.setTexture(BATTLE_BACKGROUND_ASSET_KEYS.TUTORIAL_BG)
            .setAlpha(1);
    }
}