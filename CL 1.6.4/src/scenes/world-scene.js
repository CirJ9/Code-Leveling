import Phaser from "../../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import Player from "../world/player.js";
import Enemy from "../world/enemy.js";
import { AUDIO_ASSET_KEYS, TITLE_ASSET_KEYS } from "../assets/assets-keys/asset-keys.js";

export default class WorldScene extends Phaser.Scene {
    /** @type {Player} */
    player;
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    Wall1;
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    Wall2;
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    Building1;
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    Building2;

    constructor() {
        super({
            key: SCENE_KEYS.WORLD_SCENE,
        });
    }
    init(data) {
        // Default to 'world_map0' if no map key is provided
        this.mapId = data.mapId || 'world_map0';
        this.spawnPoint = data.spawnPoint || { x: 370, y: 430 };
    }

    preload() {
        console.log("preload loaded");
        
        this.load.image('world_tiles', 'assets/images/coding_game/map/map_files/pokemon_diamond.png');
        this.load.tilemapTiledJSON('world_map0', 'assets/images/coding_game/map/map_files/world_map_0.json');
        this.load.tilemapTiledJSON('world_map1', 'assets/images/coding_game/map/map_files/main_world_map_1.json');
        this.load.tilemapTiledJSON('world_map2', 'assets/images/coding_game/map/map_files/main_world_map_2.json');
        this.load.tilemapTiledJSON('world_map_insides', 'assets/images/coding_game/map/map_files/main_world_map_inside.json');

        
        this.load.atlas(
            'enemy_markers', 
            'assets/images/coding_game/characters/character_asset/enemy_markers.png', 
            'assets/images/coding_game/characters/character_asset/enemy_markers_atlas.json'
        );
        this.load.animation('enemy_anim', 'assets/images/coding_game/characters/character_asset/enemy_markers_anim.json');
    }

    create() {
        // Flags to prevent double-initialisation
        this._worldCreated = false;

        // If the flashback has already been played this session, skip it
        if (this.registry.get('flashbackPlayed')) {
            this._worldCreated = true;
            this.createWorld();
            return;
        }

        this._skipRequested = false;

        // Bind skip handlers so we can remove them later
        this._skipHandler = () => this.skipFlashback();
        this._skipKeyHandler = () => this.skipFlashback();

        this.input.on('pointerdown', this._skipHandler);
        this.input.keyboard.on('keydown', this._skipKeyHandler);

        this.playFlashbackVideo().then(() => {
            if (!this._worldCreated) {
                this._worldCreated = true;
                // Mark as played so future map changes don't replay it
                this.registry.set('flashbackPlayed', true);
                this.createWorld();
            }
        });
    }

    playFlashbackVideo() {
        this.sound.stopAll();

        const flashbackVideo = this.add.video(0,0, TITLE_ASSET_KEYS.WORLD_FLASHBACK1);
        flashbackVideo.setOrigin(0);
        flashbackVideo.setScale(0.5);
        flashbackVideo.setDisplaySize(140, 120);
        flashbackVideo.setDepth(1000);

        // Minimum time to keep the video on screen (ms)
        const MIN_DISPLAY_MS = 15000;

        return new Promise((resolve) => {
            let resolved = false;
            let minTimer = null;
            let fallbackTimer = null;
            let ended = false;
            let minElapsed = false;

            const cleanup = () => {
                if (resolved) return;
                resolved = true;
                try {
                    if (flashbackVideo.video && onEnded) {
                        flashbackVideo.video.removeEventListener('ended', onEnded);
                    }
                } catch (e) { /* ignore */ }
                if (minTimer) minTimer.remove(false);
                if (fallbackTimer) fallbackTimer.remove(false);

                // Remove skip handlers if present
                if (this._skipHandler) {
                    this.input.off('pointerdown', this._skipHandler);
                    this._skipHandler = null;
                }
                if (this._skipKeyHandler) {
                    this.input.keyboard.off('keydown', this._skipKeyHandler);
                    this._skipKeyHandler = null;
                }

                flashbackVideo.destroy();

                // Mark the flashback as played for the session
                try { this.registry.set('flashbackPlayed', true); } catch (e) { /* ignore */ }

                // Clear internal refs
                this._flashbackCleanup = null;
                this._flashbackActive = false;

                resolve();
            };

            const onEnded = () => {
                ended = true;
                if (minElapsed) cleanup();
            };

                // Listen to native HTMLVideo 'ended' if available, otherwise Phaser 'complete' event
            if (flashbackVideo.video) {
                flashbackVideo.video.addEventListener('ended', onEnded);
            } else {
                flashbackVideo.once('complete', onEnded);
            }

            // If user already requested skip before playback started, cleanup immediately
            if (this._skipRequested) {
                flashbackVideo.destroy();
                return Promise.resolve();
            }

            // Start playback (no looping so 'ended' will fire)
            try { flashbackVideo.play(false); } catch (e) { /* ignore */ }

            // Start minimum display timer; only cleanup after both minimum has elapsed and the video ended
            minTimer = this.time.delayedCall(MIN_DISPLAY_MS, () => {
                minElapsed = true;
                if (ended) cleanup();
            }, [], this);

            // Expose cleanup so external code can skip the video early
            this._flashbackCleanup = cleanup;
            this._flashbackActive = true;
            // Fallback timer: use duration if available, otherwise at least MIN_DISPLAY_MS + 5s
            const duration = (typeof flashbackVideo.getDuration === 'function') ? flashbackVideo.getDuration() : 0;
            const fallbackMs = Math.max(duration > 0 ? (duration * 1000 + 500) : 10000, MIN_DISPLAY_MS + 5000);
            fallbackTimer = this.time.delayedCall(fallbackMs, () => {
                if (!resolved) cleanup();
            }, [], this);
        });

        
    };

    /**
     * Skip the currently playing flashback (or request skip if it hasn't started yet).
     */
    skipFlashback() {
        if (this._skipRequested) return;
        this._skipRequested = true;

        // Remove input handlers immediately
        if (this._skipHandler) {
            this.input.off('pointerdown', this._skipHandler);
            this._skipHandler = null;
        }
        if (this._skipKeyHandler) {
            this.input.keyboard.off('keydown', this._skipKeyHandler);
            this._skipKeyHandler = null;
        }

        // If a cleanup exists (video playing), call it to end early
        if (this._flashbackCleanup) {
            this._flashbackCleanup();
        } else {
            if (!this._worldCreated) {
                this._worldCreated = true;
                // Mark as played so we don't show it again
                try { this.registry.set('flashbackPlayed', true); } catch (e) { /* ignore */ }
                this.createWorld();
            }
        }
    }

    createWorld() {
        this.sound.stopAll();
        this.worldBGM = this.sound.add(AUDIO_ASSET_KEYS.WORLD_BG_MUSIC, { loop: true, volume: 0.4 });
        this.worldBGM.play();

        console.log("create loaded");

        this.isTransitioning = false;

        const map = this.make.tilemap({ key: this.mapId });
        const tileset = map.addTilesetImage('pokemon_diamond', 'world_tiles', 32, 32, 0, 0);

        // Create layers and assign high layers to class properties
        const Ground = map.createLayer('Ground', tileset, 0, 0);
        const GroundPath = map.createLayer('GroundPath', tileset, 0, 0);
        this.Wall1 = map.createLayer('Wall1', tileset, 0, 0); 
        this.Wall2 = map.createLayer('Wall2', tileset, 0, 0); 
        this.Building1 = map.createLayer('Building1', tileset, 0, 0); 
        this.Building2 = map.createLayer('Building2', tileset, 0, 0); 

        const layers = [Ground, GroundPath, this.Wall1, this.Wall2, this.Building1, this.Building2];

        layers.forEach(layer => {
            layer.setCullPadding(2, 2); 
            layer.setSkipCull(false); 
        });

        if (!Ground || !GroundPath || !this.Wall1 || !this.Wall2 || !this.Building1 || !this.Building2) {
            console.error("Layer not found! Check your Tiled map layer names.");
            return;
        }

        // Set Depths (Player is 99, so buildings must be higher to cover him)
        Ground.setDepth(0);  
        GroundPath.setDepth(10);
        this.Wall1.setDepth(105);
        this.Wall2.setDepth(110);
        this.Building1.setDepth(120);
        this.Building2.setDepth(130);

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- ARCADE COLLISION SETUP ---
        const obstacles = [GroundPath, this.Wall1, this.Wall2, this.Building1, this.Building2];
        obstacles.forEach(layer => {
            layer.setCollisionByProperty({ collide: true });
        });

        // --- PLAYER SETUP ---
        this.player = new Player({
            scene: this, 
            x: this.spawnPoint.x || 200, 
            y: this.spawnPoint.y || 250, 
            texture: 'player_movement', 
            frame: 'idle1'
        });
        
        this.player.setDepth(99); 

        // Add collision between player and world walls
        this.physics.add.collider(this.player, obstacles);

        this.player.inputKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT 
        });

        this.cameras.main.setZoom(2);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // --- ENEMY SPAWNING ---
        // this.enemies = this.physics.add.group();
        // const enemyCount = 1;
        // const padding = 64; 

        // for (let i = 0; i < enemyCount; i++) {
        //     let rx, ry;
        //     let isValidLocation = false;
        //     let attempts = 0;

        //     while (!isValidLocation && attempts < 50) {
        //         rx = Phaser.Math.Between(padding, map.widthInPixels - padding);
        //         ry = Phaser.Math.Between(padding, map.heightInPixels - padding);

        //         const tileWall = map.getTileAtWorldXY(rx, ry, true, this.cameras.main, 'Wall1');
        //         const tileBuild = map.getTileAtWorldXY(rx, ry, true, this.cameras.main, 'Building1');

        //         if ((!tileWall || !tileWall.collides) && (!tileBuild || !tileBuild.collides)) {
        //             isValidLocation = true;
        //         }
        //         attempts++;
        //     }

        //     const enemy = new Enemy({
        //         scene: this,
        //         x: rx,
        //         y: ry,
        //         texture: 'enemy_markers',
        //         frame: 'enemy-here-common1'
        //     });

        //     enemy.setDepth(99);
        //     const anims = ['enemy-common', 'enemy-rare', 'enemy-boss'];
        //     enemy.play(Phaser.Utils.Array.GetRandom(anims));
            
        //     this.enemies.add(enemy); 
        // }

// --- ENEMY SPAWNING ---
    this.enemies = this.physics.add.group();

    const enemyLayer = map.getObjectLayer('Enemy');

    if (!enemyLayer || !enemyLayer.objects) {
        console.log("Map has no enemy layer — skipping enemy spawn.");
    } else {
        enemyLayer.objects.forEach(obj => {
            if (!obj.properties) return;

            const props = {};
            obj.properties.forEach(p => props[p.name] = p.value);

            if (!props.enemy_spawn) return;

            const enemy = new Enemy({
                scene: this,
                x: obj.x,
                y: obj.y,
                texture: 'enemy_markers',
                frame: 'enemy-here-common1'
            });

            enemy.setDepth(99);

            switch (props.enemy_type) {
                case 'boss':
                    enemy.play('enemy-boss');
                    enemy.setData('enemyId', 'boss');
                    break;
                case 'rare':
                    enemy.play('enemy-rare');
                    enemy.setData('enemyId', 'rare');
                    break;
                default:
                    enemy.play('enemy-common');
                    enemy.setData('enemyId', 'common');
            }

            this.enemies.add(enemy);
        });
    }

    

        this.physics.add.overlap(this.player, this.enemies, this.handleTransition, null, this);

        this.events.on('wake', () => {
            console.log("World Scene Woke Up");
            this.isTransitioning = false;

            // Re-enable player movement and reset input
            if (this.player) {
                // @ts-ignore
                this.player.body.moves = true; 
                this.player.state = 'IDLE';
                this.player.setVelocity(0, 0);
                this.input.keyboard.resetKeys();
            }

            // Check enemies for any cooldowns and schedule re-enabling
            if (this.enemies && this.enemies.children) {
                // @ts-ignore
                this.enemies.children.iterate(enemy => {
                    if (!enemy) return true;
                    try {
                        const cooldownUntil = enemy.getData && enemy.getData('cooldownUntil');
                        const isOnCooldown = enemy.getData && enemy.getData('isOnCooldown');
                        if (isOnCooldown && cooldownUntil) {
                            const remaining = Math.max(0, cooldownUntil - Date.now());
                            if (remaining <= 0) {
                                // Re-enable immediately
                                // @ts-ignore: Phaser body typings differ; we know body.enable exists at runtime
                                try { if (enemy.body) (/** @type {any} */ enemy.body).enable = true; } catch (e) { /*ignore*/ }
                                // @ts-ignore: clearTint exists on Sprite instances
                                try { (/** @type {any} */ enemy).clearTint && (/** @type {any} */ enemy).clearTint(); } catch (e) { /*ignore*/ }
                                enemy.setData && enemy.setData('isOnCooldown', false);
                                enemy.setData && enemy.setData('cooldownUntil', null);
                            } else {
                                // Schedule re-enable after remaining ms
                                this.time.delayedCall(remaining, () => {
                                    // @ts-ignore: Phaser body typings differ; we know body.enable exists at runtime
                                    try { if (enemy.body) (/** @type {any} */ enemy.body).enable = true; } catch (e) { /*ignore*/ }
                                    // @ts-ignore: clearTint exists on Sprite instances
                                    try { (/** @type {any} */ enemy).clearTint && (/** @type {any} */ enemy).clearTint(); } catch (e) { /*ignore*/ }
                                    enemy.setData && enemy.setData('isOnCooldown', false);
                                    enemy.setData && enemy.setData('cooldownUntil', null);
                                }, [], this);
                            }
                        }
                    } catch (e) { /* ignore individual enemy errors */ }
                    return true;
                });
            }
        });

        this.setupPortals(map);
    }

    handleTransition(player, enemy) {
        // Ignore if we're already transitioning or this enemy is on a temporary cooldown
        if (this.isTransitioning) return;
        if (enemy && enemy.getData && enemy.getData('isOnCooldown')) return;

        this.isTransitioning = true;
        console.log("BATTLE TRIGGERED!");
        this.player.state = 'BATTLE'; 
        this.player.setVelocity(0, 0);
        // @ts-ignore
        this.player.body.moves = false; 
        this.scene.sleep(SCENE_KEYS.WORLD_SCENE);
        // Pass the encounter point and the enemy reference so the battle can return the player and apply cooldowns
        this.scene.launch(SCENE_KEYS.BATTLE_SCENE, { encounterPoint: { x: enemy.x, y: enemy.y }, encounterEnemy: enemy }); 
    }

    update() {
        if (this.isTransitioning || (this.player && this.player.state === 'BATTLE')) {
            return;
        }

        if (this.player) {
            this.player.update(); 

            // --- TRANSPARENCY LOGIC ---
            const highLayers = [this.Building1, this.Building2, this.Wall1 ,this.Wall2]; 

            highLayers.forEach(layer => {
                if (!layer) return;
                // Check if there is a tile at the player's position (using head offset)
                const tile = layer.getTileAtWorldXY(this.player.x, this.player.y - 12);
                if (tile) {
                    layer.setAlpha(0.5); 
                } else {
                    layer.setAlpha(1);
                }
            });
        }

        // Iterate enemies only if the group exists (createWorld may not have run yet)
        if (this.enemies && this.enemies.children) {
            // @ts-ignore
            this.enemies.children.iterate(enemy => {
                if (enemy) {
                    enemy.update(this.player);
                    return true;
                }
            });
        }
    }

    setupPortals(map) {
        const portalLayer = map.getObjectLayer('Portals');
        if (!portalLayer) return;

        portalLayer.objects.forEach(obj => {
            // Create an invisible area for the player to hit
            const portal = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0);
            this.physics.add.existing(portal, true);

            // Extract properties from Tiled
            const properties = {};
            if (obj.properties) {
                obj.properties.forEach(p => { properties[p.name] = p.value; });
            }

            this.physics.add.overlap(this.player, portal, () => {
                if (this.isTransitioning) return;
                this.isTransitioning = true;

                // Simple Fade Out transition
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.restart({
                        mapId: properties.targetMap,
                        spawnPoint: { x: properties.targetX, y: properties.targetY }
                    });
                });
            });
        });
    }
}