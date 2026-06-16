import Phaser from "../../lib/phaser.js"; 
import { StateMachine } from "../utils/state-machine.js";

// Changed to Arcade Sprite
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(data) {
        const { scene, x, y, texture, frame } = data;
        // Call super with just scene (not scene.matter.world)
        super(scene, x, y, texture, frame);
        
        scene.add.existing(this);
        scene.physics.add.existing(this); // Enable Arcade Physics

        // Physics setup
        this.setCollideWorldBounds(true);
        // Reduce hitbox size for better walking feeling
        this.body.setSize(16, 16); 
        this.body.setOffset(8, 16); // Center it on feet

        this.inputKeys = undefined;

        // --- STATE MACHINE INITIALIZATION ---
        this.stateMachine = new StateMachine('player', this);

        this.stateMachine.addState({
            name: 'IDLE',
            onEnter: () => {
                this.setVelocity(0, 0);
                this.anims.play('player_idle', true);
            },
            update: () => {
                if (this.isMoving()) {
                    if (this.inputKeys.shift && this.inputKeys.shift.isDown) {
                        this.stateMachine.setState('RUN');
                    } else {
                        this.stateMachine.setState('WALK');
                    }
                }
            }
        });

        this.stateMachine.addState({
            name: 'WALK',
            update: () => {
                // Arcade speed is higher than Matter (pixels per second)
                this.handleMovement(120); 
                
                if (!this.isMoving()) {
                    this.stateMachine.setState('IDLE');
                } else if (this.inputKeys.shift && this.inputKeys.shift.isDown) {
                    this.stateMachine.setState('RUN');
                }
            }
        });

        this.stateMachine.addState({
            name: 'RUN',
            onEnter: () => {
                this.anims.timeScale = 1.6; 
            },
            onExit: () => {
                this.anims.timeScale = 1;
            },
            update: () => {
                // Higher speed for run
                this.handleMovement(200); 
                
                if (!this.isMoving()) {
                    this.stateMachine.setState('IDLE');
                } else if (this.inputKeys.shift && !this.inputKeys.shift.isDown) {
                    this.stateMachine.setState('WALK');
                }
            }
        });

        this.stateMachine.addState({
            name: 'BATTLE',
            onEnter: () => {
                this.setVelocity(0, 0);
                this.anims.play('player_idle', true);
            }
        });

        this.stateMachine.setState('IDLE');
    }

    isMoving() {
        if (!this.inputKeys) return false;
        return (this.inputKeys.left.isDown || this.inputKeys.right.isDown || 
                this.inputKeys.up.isDown || this.inputKeys.down.isDown);
    }

    /**
     * @param {number} speed
     */
    handleMovement(speed) {
        let velocity = new Phaser.Math.Vector2();

        if (this.inputKeys.left.isDown) {
            velocity.x = -1;
            this.setFlipX(false);
            this.anims.play('player_walk_left', true);
        } else if (this.inputKeys.right.isDown) {
            velocity.x = 1;
            this.setFlipX(true);
            this.anims.play('player_walk_left', true);
        }

        if (this.inputKeys.up.isDown) {
            velocity.y = -1;
            if (velocity.x === 0) this.anims.play('player_walk_up', true);
        } else if (this.inputKeys.down.isDown) {
            velocity.y = 1;
            if (velocity.x === 0) this.anims.play('player_walk_down', true);
        }

        velocity.normalize().scale(speed);
        this.setVelocity(velocity.x, velocity.y);
    }

    update() {
        this.stateMachine.update();
    }

    static preload(scene) {
        scene.load.atlas('player_movement', 
            'assets/images/coding_game/characters/Player/player_movement.png', 
            'assets/images/coding_game/characters/Player/player_movement_atlas.json');
        scene.load.animation('player_anim', 
            'assets/images/coding_game/characters/Player/player_movement_anim.json');
    }
}