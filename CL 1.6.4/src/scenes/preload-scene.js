/**
 * PreloadScene: loads fonts, audio and all battle-related assets and game data JSON files.
 */
import Phaser from "../../lib/phaser.js";
import { 
    TITLE_ASSET_KEYS, 
    BATTLE_ASSET_KEYS, 
    BATTLE_CONTAINERS_KEYS, 
    BATTLE_BACKGROUND_ASSET_KEYS, 
    HEALTH_BAR_ASSET_KEYS, 
    RAM_BAR_ASSET_KEYS, 
    SHADOW_BAR_ASSET_KEYS, 
    EXP_BAR_ASSET_KEYS, 
    PLAYER_ASSET_KEYS, 
    UI_ASSET_KEYS, 
    VIRUSED_ASSET_KEYS, 
    DATA_ASSET_KEYS, 
    AUDIO_ASSET_KEYS
} from "../assets/assets-keys/asset-keys.js";
import { SCENE_KEYS } from "./scene-keys.js";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ 
            key: SCENE_KEYS.PRELOAD_SCENE,
        });
    }

    preload() {
        // Preload assets and game data used during battles (fonts, audio, images, JSON)
        console.log(`[${PreloadScene.name}:preload] invoked`);

        // --- PATH DEFINITIONS ---
        const codingGameAssetPath = 'assets/images/coding_game/';
        const kenneysAssetPath = 'assets/images/kenneys-assets/';
        const gameDataAssetPath = 'assets/game-data';
        const fontPath = 'assets/images/kenneys-assets/fonts/';
        const audioPath = 'assets/audio/';


        // --- FONTS ---
        this.load.font('PressStart2P', `${fontPath}/PressStart2P-Regular.ttf`, 'truetype');
        this.load.font('BoldPixels', `${fontPath}/BoldPixels.ttf`, 'truetype');
        this.load.font('FutureNarrow', `${fontPath}/Kenney-Future-Narrow.ttf`, 'truetype');

        // --- AUDIO ---
        this.load.audio(AUDIO_ASSET_KEYS.INTRO_BG_MUSIC, `${audioPath}/1. Winning Sight.wav`);
        this.load.audio(AUDIO_ASSET_KEYS.TITLE_BG_MUSIC, `${audioPath}/6. Energizer Cult.wav`);
        this.load.audio(AUDIO_ASSET_KEYS.WORLD_BG_MUSIC, `${audioPath}/7. Zapping Through the Finish.wav`);
        this.load.audio(AUDIO_ASSET_KEYS.BATTLE_BG_MUSIC, `${audioPath}/xDeviruchi/Decisive-Battle.wav`);

        // --- CUTSCENE ---
        this.load.video(TITLE_ASSET_KEYS.TTTLE_INTRO_CUTSCENE, 'assets/video/intro.mp4');
        this.load.video(TITLE_ASSET_KEYS.WORLD_FLASHBACK1, 'assets/video/flashback1.mp4');

        // --- TITLE & UI ---
        this.load.image(TITLE_ASSET_KEYS.TITLE_BG, `${codingGameAssetPath}/title/title_bg.png`);
        this.load.image(UI_ASSET_KEYS.CURSOR, `${codingGameAssetPath}/ui/cursor.png`);

        // --- BATTLE BACKGROUNDS & PLATFORMS ---
        this.load.image(BATTLE_BACKGROUND_ASSET_KEYS.TUTORIAL_BG, `${codingGameAssetPath}/battle-backgrounds/blue_bg 1.png`);
        this.load.image(BATTLE_ASSET_KEYS.PLATFORM, `${codingGameAssetPath}/battle-assets/platform1-Sheet.png`);

        // --- BATTLE UI CONTAINERS ---
        this.load.image(BATTLE_CONTAINERS_KEYS.PANEL0, `${kenneysAssetPath}/ui-space-expansion/panel/system-panel0.png`);
        this.load.image(BATTLE_CONTAINERS_KEYS.PANEL1, `${kenneysAssetPath}/ui-space-expansion/panel/system-panel1.png`);
        this.load.image(BATTLE_CONTAINERS_KEYS.PANEL2, `${kenneysAssetPath}/ui-space-expansion/panel/system-panel2.png`);
        this.load.image(BATTLE_CONTAINERS_KEYS.EDITOR_PANEL, `${kenneysAssetPath}/ui-space-expansion/panel/code-editor-Panel.png`);
        this.load.image(BATTLE_CONTAINERS_KEYS.PLAYER_PANEL, `${kenneysAssetPath}/ui-space-expansion/panel/player_Panel.png`);
        this.load.image(BATTLE_CONTAINERS_KEYS.HISTORY_PANEL, `${kenneysAssetPath}/ui-space-expansion/panel/history_Panel.png`);

        // --- BUTTONS ---
        this.load.image(BATTLE_ASSET_KEYS.RUN_BUTTON, `${kenneysAssetPath}/ui-pack/run-Button.png`);
        this.load.image(BATTLE_ASSET_KEYS.RUN_BUTTON_HOVER, `${kenneysAssetPath}/ui-pack/run-Button-Hover.png`);
        this.load.image(BATTLE_ASSET_KEYS.RECHARGE_BUTTON, `${kenneysAssetPath}/ui-pack/recharge-Button.png`);
        this.load.image(BATTLE_ASSET_KEYS.RECHARGE_BUTTON_HOVER, `${kenneysAssetPath}/ui-pack/recharge-Button-Hover.png`);
        this.load.image(BATTLE_ASSET_KEYS.BACK_BUTTON, `${kenneysAssetPath}/ui-pack/back-Button.png`);
        this.load.image(BATTLE_ASSET_KEYS.BACK_BUTTON_HOVER, `${kenneysAssetPath}/ui-pack/back-Button-Hover.png`);

        // --- BARS (HP, RAM, EXP, SHADOW) ---
        // HP
        this.load.image(HEALTH_BAR_ASSET_KEYS.HP_LEFT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_green_left.png`);
        this.load.image(HEALTH_BAR_ASSET_KEYS.HP_MIDDLE_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_green_mid.png`);
        this.load.image(HEALTH_BAR_ASSET_KEYS.HP_RIGHT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_green_right.png`);
        // RAM
        this.load.image(RAM_BAR_ASSET_KEYS.RAM_LEFT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_blue_left.png`);
        this.load.image(RAM_BAR_ASSET_KEYS.RAM_MIDDLE_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_blue_mid.png`);
        this.load.image(RAM_BAR_ASSET_KEYS.RAM_RIGHT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_blue_right.png`);
        // EXP
        this.load.image(EXP_BAR_ASSET_KEYS.EXP_LEFT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_yellow_left.png`);
        this.load.image(EXP_BAR_ASSET_KEYS.EXP_MIDDLE_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_yellow_mid.png`);
        this.load.image(EXP_BAR_ASSET_KEYS.EXP_RIGHT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_yellow_right.png`);
        // SHADOW
        this.load.image(SHADOW_BAR_ASSET_KEYS.SHADOW_LEFT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_shadow_left.png`);
        this.load.image(SHADOW_BAR_ASSET_KEYS.SHADOW_MIDDLE_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_shadow_mid.png`);
        this.load.image(SHADOW_BAR_ASSET_KEYS.SHADOW_RIGHT_CAP, `${kenneysAssetPath}/ui-space-expansion/bar/barHorizontal_shadow_right.png`);

        // --- PLAYER ASSETS ---
        this.load.atlas(PLAYER_ASSET_KEYS.PLAYER, 
            `${codingGameAssetPath}characters/Player/player_movement.png`,
            `${codingGameAssetPath}characters/Player/player_movement_atlas.json`
        );
        this.load.animation(PLAYER_ASSET_KEYS.PLAYER_ANIMATIONS, `${codingGameAssetPath}characters/Player/player_movement_anim.json`);

        // --- ENEMY ASSETS (VIRUSED & CORRUPTED) ---
        // V_Dog
        this.load.atlas(VIRUSED_ASSET_KEYS.V_DOG, 
            `${codingGameAssetPath}characters/Virused/virused/v_dog_file/v_dog.png`,
            `${codingGameAssetPath}characters/Virused/virused/v_dog_file/v_dog_atlas.json`
        );
        this.load.animation(VIRUSED_ASSET_KEYS.V_DOG_ANIMATIONS, `${codingGameAssetPath}characters/Virused/virused/v_dog_file/v_dog_anim.json`);

        // C_Sister
        this.load.atlas(VIRUSED_ASSET_KEYS.C_SISTER, 
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_sister/corrupted_sister.png`,
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_sister/corrupted_sister_atlas.json`
        );
        this.load.animation(VIRUSED_ASSET_KEYS.C_SISTER_ANIMATIONS, `${codingGameAssetPath}characters/Virused/corrupted/corrupted_sister/corrupted_sister_anim.json`);

        // C_Human
        this.load.atlas(VIRUSED_ASSET_KEYS.C_HUMAN, 
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_human/corrupted_human.png`,
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_human/corrupted_human_atlas.json`
        );
        this.load.animation(VIRUSED_ASSET_KEYS.C_HUMAN_ANIMATIONS, `${codingGameAssetPath}characters/Virused/corrupted/corrupted_human/corrupted_human_anim.json`);

        // C_Plant
        this.load.atlas(VIRUSED_ASSET_KEYS.C_PLANT, 
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_plant/corrupted_plant.png`,
            `${codingGameAssetPath}characters/Virused/corrupted/corrupted_plant/corrupted_plant_atlas.json`
        );
        this.load.animation(VIRUSED_ASSET_KEYS.C_PLANT_ANIMATIONS, `${codingGameAssetPath}characters/Virused/corrupted/corrupted_plant/corrupted_plant_anim.json`);

        // --- DATA FILES ---
        this.load.json(DATA_ASSET_KEYS.CODE_SYNTAX, `${gameDataAssetPath}/code-syntax-data.json`);
        this.load.json(DATA_ASSET_KEYS.ENEMY_DATA, `${gameDataAssetPath}/enemy-data.json`);
        this.load.json(DATA_ASSET_KEYS.PLAYER_DATA, `${gameDataAssetPath}/player-data.json`);
    }

    create() {
        console.log(`[${PreloadScene.name}:create] invoked`);
        // Redirect to Title Scene
        this.scene.start(SCENE_KEYS.TITLE_SCENE);
        // this.scene.start(SCENE_KEYS.BATTLE_SCENE);
        // this.scene.start(SCENE_KEYS.WORLD_SCENE);


    }
}