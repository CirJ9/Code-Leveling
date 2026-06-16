// import Phaser from "../../lib/phaser";

// Changed to Arcade Sprite
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(data) {
        const { scene, x, y, texture, frame } = data;
        // Call super without matter world
        super(scene, x, y, texture, frame);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Settings
        this.speed = 80; // Scaled up for Arcade (approx 60x Matter value)
        this.chaseRange = 80; 
    }

    update(player) {
        if (!player) return;

        // Calculate distance to player
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.chaseRange) {
            // Chase logic: Move toward player
            // Arcade provides a handy helper for this, but keeping your logic logic is fine too:
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
            
            // Optional: Flip sprite based on direction
            this.setFlipX(this.body.velocity.x < 0);
        } else {
            // Stop moving if player is out of range
            this.setVelocity(0, 0);
        }
    }
}