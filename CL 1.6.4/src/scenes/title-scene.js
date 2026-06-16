import BaseScene from './base-scene.js';
import TitleMenu from '../title/title-menu.js';
import SceneKeys from './scene-keys.js';
import { AUDIO_ASSET_KEYS, TITLE_ASSET_KEYS } from '../assets/assets-keys/asset-keys.js';
import SaveManager from "../utils/save-manager.js";

export default class TitleScene extends BaseScene {
    constructor() {
        super(SceneKeys.TITLE);

    // Text Styles 
    this.textStyle = { fontFamily: 'BoldPixels', fontSize: '14px', color: '#e0f7fa', fontStyle: 'bold' };

    }

    create() {
        const introVideo = this.add.video(0, 0, TITLE_ASSET_KEYS.TTTLE_INTRO_CUTSCENE).setOrigin(0).setScale(0.5);
    
    // Force the video to be exactly 1024x576
    introVideo.setDisplaySize(140, 120);
    
    introVideo.play();
    // Stop all other sounds to prevent overlapping
    this.sound.stopAll();

    // Play menu music with looping enabled
    // this.introBGM = this.sound.add(AUDIO_ASSET_KEYS.INTRO_BG_MUSIC, { loop: true, volume: 0.5 });
    // this.introBGM.play();

        // Transition to the next scene when the video finishes
        introVideo.on('complete', () => {
            this.#createMainMenu();        
            });

        // Allow skipping with a click or key press
        this.input.on('pointerdown', () => {
            introVideo.stop();
             this.#createMainMenu();
        });

    }

    #createMainMenu() {
        // Stop all other sounds to prevent overlapping
        this.sound.stopAll();

        // Play menu music with looping enabled
        this.menuBGM = this.sound.add(AUDIO_ASSET_KEYS.TITLE_BG_MUSIC, { loop: true, volume: 0.5 });
        this.menuBGM.play();

        this.#createBackground();

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.titleMenu = new TitleMenu(this, {
            x: centerX,
            y: centerY,
            spacing: 50,
            onNewGame: () => {
                this.scene.start(SceneKeys.WORLD);
            },
            onContinue: () => {
                const saved = SaveManager.loadGame();
                if (!saved || !saved.player) {
                    console.log('No saved game found');
                    return;
                }
                // If the save stored a world position / map it can be used here; default to world start
                const mapId = saved.world?.mapId ?? 'world_map0';
                const spawnPoint = saved.world?.spawnPoint ?? { x: 370, y: 430 };
                this.scene.start(SceneKeys.WORLD, { mapId, spawnPoint });
            },
            onOptions: () => {
                console.log('Options pressed — implement options UI');
            }
        });
    }

        #createBackground() {
            this.add.image(10, 10, TITLE_ASSET_KEYS.TITLE_BG, 0).setOrigin(0,0);
        }

        #createTitleText() {
            this.add.rectangle(this.scale.width / 2, 100, 400, 80, 0x000000, 0.5).setOrigin(0.5);
            this.add.text(this.scale.width / 2, 100, 'Code Leveling', {
                fontFamily: `BoldPixels`,
                fontSize: '48px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);
            
    }
}