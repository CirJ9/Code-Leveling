import Phaser from "../../lib/phaser.js";

export default class BaseScene extends Phaser.Scene {
    constructor(key) {
        super(key);
    }

    createBackground(color = 0x031d3aad) {
        this.cameras.main.setBackgroundColor(color);
    }

    addCenteredText(y, text, style = {}) {
        return this.add.text(this.scale.width / 2, y, text, style).setOrigin(0.5);
    }
}