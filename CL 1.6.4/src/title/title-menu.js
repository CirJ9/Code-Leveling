/**
 * @typedef {Object} TitleMenuOptions
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [spacing=40]
 * @property {Function} [onNewGame]
 * @property {Function} [onContinue]
 * @property {Function} [onOptions]
 */

import { TITLE_ASSET_KEYS } from "../assets/assets-keys/asset-keys.js";

TITLE_ASSET_KEYS
export default class TitleMenu {
    /**
     * @param {Phaser.Scene} scene
     * @param {TitleMenuOptions} options
     */
    constructor(scene, { x = 0, y = 0, spacing = 40, onNewGame, onContinue, onOptions } = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.spacing = spacing;

        this.textStyle = { fontFamily: 'BoldPixels', fontSize: '14px', color: '#e0f7fa', fontStyle: 'bold' };

        document.fonts.load('10px BoldPixels').then(() => {
            console.log('Font loaded, creating UI');

            this.createTitleText();
            this.createMenu(onNewGame, onContinue, onOptions);
        });
    }

    createTitleText() {
            const titleTextBG = this.scene.add.rectangle(this.x, 260, 1100, 400, 0x000000, 0.8).setOrigin(0.5);
            const titleText = this.scene.add.text(this.x, 180, 'Code Leveling', {
                fontFamily: `BoldPixels`,
                fontSize: '60px',
                color: '#00d6fcff',
                fontStyle: 'bold',
            }).setOrigin(0.5);    
        }

    createMenu(onNewGame, onContinue, onOptions) {
        const style = { fontFamily: 'BoldPixels, monospace', fontSize: '28px', color: '#ffffff' };

        const newGame = this.scene.add.text(this.x, this.y, 'New Game', style).setOrigin(0.5);
        const cont = this.scene.add.text(this.x, this.y + this.spacing, 'Continue', style).setOrigin(0.5);
        const opts = this.scene.add.text(this.x, this.y + this.spacing * 2, 'Options', style).setOrigin(0.5);

        [newGame, cont, opts].forEach(t => {
            t.setInteractive({ useHandCursor: true });
            t.on('pointerover', () => t.setStyle({ color: '#ff0' }));
            t.on('pointerout', () => t.setStyle({ color: '#fff' }));
        });

        newGame.on('pointerup', () => onNewGame && onNewGame());
        cont.on('pointerup', () => onContinue && onContinue());
        opts.on('pointerup', () => onOptions && onOptions());
    }
}