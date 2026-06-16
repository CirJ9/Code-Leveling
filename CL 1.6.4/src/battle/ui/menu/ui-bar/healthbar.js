import Phaser from "../../../../../lib/phaser.js";
import { HEALTH_BAR_ASSET_KEYS, SHADOW_BAR_ASSET_KEYS} from "../../../../assets/assets-keys/asset-keys.js";

/**
 * Reusable health bar UI component. Handles shadow and foreground caps and animated width.
 */
export class HealthBar {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Container} */
    #healthBarContainer;
    /** @type {Phaser.GameObjects.Container} */
    #healthShadowBarContainer;
    /** @type {number} */
    #fullDisplayWidth;
    /** @type {Phaser.GameObjects.Image} */
    #leftHPCap
    /** @type {Phaser.GameObjects.Image} */
    #middleHPCap
    /** @type {Phaser.GameObjects.Image} */
    #rightHPCap
    /** @type {Phaser.GameObjects.Image} */
    #leftShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #middleShadowCap
    /** @type {Phaser.GameObjects.Image} */
    #rightShadowCap

    /**
    *
    * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
    * @param {number} x horizontal position of the health bar
    * @param {number} y vertical position of the health bar
    * @param {number} [z] Full width of the health bar
    * @returns {void}
    */

    /** @param {Phaser.Scene} scene the Phaser Scene HealthBar will be added*/

    constructor(scene, x, y, z){
    /** @type {Phaser.Scene} */
        this.#scene = scene;
        this.#fullDisplayWidth = z;          
        this.#healthBarContainer = this.#scene.add.container(x, y, []); 
        this.#createHealthBarShadowAssets(x, y); 
        this.#createHealthBarAssets(x, y);
        this.#setMeterPercentage(1);
        // this.setMeterPercentageAnimated(0.5, {
        //     // duration: 1500
        // });
    }

    get container() {
        return this.#healthBarContainer; 
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

        this.#healthBarContainer.add([this.#leftShadowCap, this.#middleShadowCap, this.#rightShadowCap]).setScale(0.5);
    }

    /**
    * @param {number} x horizontal position of the health bar
    * @param {number} y vertical position of the health bar
    * @returns {void}
    */

    #createHealthBarAssets(x, y) {
        this.#leftHPCap = this.#scene.add.image(x, y, HEALTH_BAR_ASSET_KEYS.HP_LEFT_CAP)
            .setOrigin(0, 0.5);
        this.#middleHPCap = this.#scene.add
            .image(this.#leftHPCap.x + this.#leftHPCap.width, y, HEALTH_BAR_ASSET_KEYS.HP_MIDDLE_CAP)
            .setOrigin(0, 0.5);
        this.#rightHPCap = this.#scene.add
            .image(this.#middleHPCap.x + this.#middleHPCap.displayWidth, y, HEALTH_BAR_ASSET_KEYS.HP_RIGHT_CAP)
            .setOrigin(0, 0.5);

        this.#healthBarContainer.add([this.#leftHPCap, this.#middleHPCap, this.#rightHPCap]).setScale(0.5);
    }

    /**
     * 
     * @param {number} [percent = 1] a number between 0 and 1 that is used to set how full the bar should be
     */

    #setMeterPercentage(percent = 1){
        const width = this.#fullDisplayWidth * percent;

        this.#middleHPCap.displayWidth = width;
        this.#rightHPCap.x = this.#middleHPCap.x + this.#middleHPCap.displayWidth + 8;
    }

    /**
     * 
     * @param {number} [percent = 1] a number between 0 and 1 that is used to set how full the bar should be
     * @param {object} [options] 
     * @param {object} [options.duration=1000]      
     * @param {object} [options.callback] 
     */

    // Animate the width of the HP fill to `percent` using a tween. Calls `options.callback` when finished.
    setMeterPercentageAnimated(percent, options, ){
        const width = this.#fullDisplayWidth * percent;

        this.#scene.tweens.add({
            targets: this.#middleHPCap,
            displayWidth: width,
            duration: options?.duration || 1000,
            ease: Phaser.Math.Easing.Sine.Out,
            onUpdate: () => {
                this.#rightHPCap.x = this.#middleHPCap.x + this.#middleHPCap.displayWidth;
                const isVisible = this.#middleHPCap.displayWidth > 0;
                this.#leftHPCap.visible = isVisible;
                this.#middleHPCap.visible = isVisible;
                this.#rightHPCap.visible = isVisible;
            },
            onComplete: options?.callback,

        });

    }

}