import Phaser from "../../../../../lib/phaser.js";
import { EXP_BAR_ASSET_KEYS, SHADOW_BAR_ASSET_KEYS } from "../../../../assets/assets-keys/asset-keys.js";

/**
 * Experience bar UI component used in the player HUD. Behaves similarly to HP/RAM bars.
 */
export class Expbar {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Container} */
    #expBarContainer;
    /** @type {number} */
    #fullDisplayWidth;
    /** @type {Phaser.GameObjects.Image} */
    #leftEXPCap;
    /** @type {Phaser.GameObjects.Image} */
    #middleEXPCap;
    /** @type {Phaser.GameObjects.Image} */
    #rightEXPCap;
    /** @type {Phaser.GameObjects.Image} */
    #leftShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #middleShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #rightShadowCap

    /**
    *
    * @param {Phaser.Scene} scene the Phaser 3 Scene the exp bar will be added to
    * @param {number} x horizontal position of the exp bar
    * @param {number} y vertical position of the exp bar
    * @param {number} [z] Full width of the exp bar
    * @returns {void}
    */

    /** @param {Phaser.Scene} scene the Phaser Scene ExpBar will be added*/

    /**
     * Create an EXP bar component.
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} z - full width in pixels
     */
    constructor(scene, x, y, z) {
        /** @type {Phaser.Scene} */
        this.#scene = scene;
        this.#fullDisplayWidth = z;
        this.#expBarContainer = this.#scene.add.container(x, y, []);
        this.#createHealthBarShadowAssets(x, y); 
        this.#createExpBarAssets(x, y);
        this.#setMeterPercentage(1);
    }

    get container() {
        return this.#expBarContainer;
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

        this.#expBarContainer.add([this.#leftShadowCap, this.#middleShadowCap, this.#rightShadowCap]).setScale(0.5);
    }

    /**
    * @param {number} x horizontal position of the exp bar
    * @param {number} y vertical position of the exp bar
    * @returns {void}
    */

    #createExpBarAssets(x, y) {
        this.#leftEXPCap = this.#scene.add.image(x, y, EXP_BAR_ASSET_KEYS.EXP_LEFT_CAP)
            .setOrigin(0, 0.5);
        this.#middleEXPCap = this.#scene.add
            .image(this.#leftEXPCap.x + this.#leftEXPCap.width, y, EXP_BAR_ASSET_KEYS.EXP_MIDDLE_CAP)
            .setOrigin(0, 0.5);
        this.#rightEXPCap = this.#scene.add
            .image(this.#middleEXPCap.x + this.#middleEXPCap.displayWidth, y, EXP_BAR_ASSET_KEYS.EXP_RIGHT_CAP)
            .setOrigin(0, 0.5);

        this.#expBarContainer.add([this.#leftEXPCap, this.#middleEXPCap, this.#rightEXPCap]).setScale(0.5);
    }

    /**
     * 
     * @param {number} [percent = 1] a number between 0 and 1 that is used to set how full the bar should be
     */

    #setMeterPercentage(percent = 1) {
        const width = this.#fullDisplayWidth * percent;

        this.#middleEXPCap.displayWidth = width;
        this.#rightEXPCap.x = this.#middleEXPCap.x + this.#middleEXPCap.displayWidth + 8;
    }

    // Animate the width of the EXP fill to `percent` using a tween. Calls `options.callback` when finished.
    setMeterPercentageAnimated(percent, options) {
        const width = this.#fullDisplayWidth * percent;

        this.#scene.tweens.add({
            targets: this.#middleEXPCap,
            displayWidth: width,
            duration: options?.duration || 1000,
            ease: Phaser.Math.Easing.Sine.Out,
            onUpdate: () => {
                this.#rightEXPCap.x = this.#middleEXPCap.x + this.#middleEXPCap.displayWidth;
                const isVisible = this.#middleEXPCap.displayWidth > 0;
                this.#leftEXPCap.visible = isVisible;
                this.#middleEXPCap.visible = isVisible;
                this.#rightEXPCap.visible = isVisible;
            },
            onComplete: options?.callback,
        });
    }
}