import Phaser from "../../../../../lib/phaser.js";
import { RAM_BAR_ASSET_KEYS, SHADOW_BAR_ASSET_KEYS } from "../../../../assets/assets-keys/asset-keys.js";

/**
 * Simple RAM meter UI component used in the player's HUD.
 * Provides animated fill and a container via `container` getter.
 */
export class Rambar {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Container} */
    #ramBarContainer;
    /** @type {number} */
    #fullDisplayWidth;
    /** @type {Phaser.GameObjects.Image} */
    #leftRamCap;
    /** @type {Phaser.GameObjects.Image} */
    #middleRamCap;
    /** @type {Phaser.GameObjects.Image} */
    #rightRamCap;
    /** @type {Phaser.GameObjects.Image} */
    #leftShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #middleShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #rightShadowCap

    /**
    *
    * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
    * @param {number} x horizontal position of the ram bar
    * @param {number} y vertical position of the ram bar
    * @param {number} [z] Full width of the ram bar
    * @returns {void}
    */

    /** @param {Phaser.Scene} scene the Phaser Scene Rambar will be added*/

    constructor(scene, x, y, z) {
        /** @type {Phaser.Scene} */
        this.#scene = scene;
        this.#fullDisplayWidth = z;
        this.#ramBarContainer = this.#scene.add.container(x, y, []);
        this.#createHealthBarShadowAssets(x, y); 
        this.#createRamBarAssets(x, y);
        this.#setMeterPercentage(1);
    }

    get container() {
        return this.#ramBarContainer;
    }

    /**
    * @param {number} x horizontal position of the Shadow bar
    * @param {number} y vertical position of the Shadow bar
    * @returns {void}
    */

    #createHealthBarShadowAssets(x, y){
        this.#leftShadowCap = this.#scene.add.image(x, y, SHADOW_BAR_ASSET_KEYS.SHADOW_LEFT_CAP)
            .setOrigin(0, 0.5);
        this.#middleShadowCap = this.#scene.add
            .image(this.#leftShadowCap.x + this.#leftShadowCap.width, y, SHADOW_BAR_ASSET_KEYS.SHADOW_MIDDLE_CAP)
            .setOrigin(0, 0.5);
        this.#middleShadowCap.displayWidth = this.#fullDisplayWidth;
        this.#rightShadowCap = this.#scene.add
            .image(this.#middleShadowCap.x + this.#middleShadowCap.displayWidth + 9, y, SHADOW_BAR_ASSET_KEYS.SHADOW_RIGHT_CAP)
            .setOrigin(0, 0.5);

        this.#ramBarContainer.add([this.#leftShadowCap, this.#middleShadowCap, this.#rightShadowCap]).setScale(0.5);
    }

    /**
    * @param {number} x horizontal position of the ram bar
    * @param {number} y vertical position of the ram bar
    * @returns {void}
    */

    #createRamBarAssets(x, y) {
        this.#leftRamCap = this.#scene.add.image(x, y, RAM_BAR_ASSET_KEYS.RAM_LEFT_CAP)
            .setOrigin(0, 0.5);
        this.#middleRamCap = this.#scene.add
            .image(this.#leftRamCap.x + this.#leftRamCap.width, y, RAM_BAR_ASSET_KEYS.RAM_MIDDLE_CAP)
            .setOrigin(0, 0.5);
        this.#rightRamCap = this.#scene.add
            .image(this.#middleRamCap.x + this.#middleRamCap.displayWidth, y, RAM_BAR_ASSET_KEYS.RAM_RIGHT_CAP)
            .setOrigin(0, 0.5);

        this.#ramBarContainer.add([this.#leftRamCap, this.#middleRamCap, this.#rightRamCap]).setScale(0.5);
    }

    /**
     * 
     * @param {number} [percent = 1] a number between 0 and 1 that is used to set how full the bar should be
     */

    #setMeterPercentage(percent = 1) {
        const width = this.#fullDisplayWidth * percent;

        this.#middleRamCap.displayWidth = width;
        this.#rightRamCap.x = this.#middleRamCap.x + this.#middleRamCap.displayWidth + 8;
    }

    // Animate the width of the RAM fill to `percent` using a tween. Calls `options.callback` when finished.
    setMeterPercentageAnimated(percent, options) {
        const width = this.#fullDisplayWidth * percent;

        this.#scene.tweens.add({
            targets: this.#middleRamCap,
            displayWidth: width,
            duration: options?.duration || 1000,
            ease: Phaser.Math.Easing.Sine.Out,
            onUpdate: () => {
                this.#rightRamCap.x = this.#middleRamCap.x + this.#middleRamCap.displayWidth;
                const isVisible = this.#middleRamCap.displayWidth > 0;
                this.#leftRamCap.visible = isVisible;
                this.#middleRamCap.visible = isVisible;
                this.#rightRamCap.visible = isVisible;
            },
            onComplete: options?.callback,
        });
    }
}