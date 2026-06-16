import Phaser from "../lib/phaser.js";                               
import SceneKeys, { SCENE_KEYS } from './scenes/scene-keys.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { BattleScene } from "./scenes/battle-scene.js";
import CityScene from "./scenes/world-scene.js";
import TitleScene from "./scenes/title-scene.js";

const canvasSizes = {
    width: 1024,
    height: 576
}

const config = {
    type: Phaser.CANVAS,
    pixelArt: true,
    scale: {    
        parent: 'game-container',
        width: canvasSizes.width,
        height: canvasSizes.height,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    
    dom: {
        createContainer: true
    },
    
    backgroundColor: '#000000',
    scene: [PreloadScene, TitleScene, CityScene, BattleScene],

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, 
            debug: false,       
            fps: 60,
        },
    },
};

// @ts-ignore
const game = new Phaser.Game(config);