import { HealthBar } from "./healthbar.js";

/**
 * Player-specific HealthBar. Defaults to a wider bar and allows further custom behavior.
 */
export class PlayerHealthBar extends HealthBar {
    constructor(scene, x = 32, y = 32, z = 400) {
        super(scene, x, y, z);
        // If needed, player-specific adjustments can go here (scale, tint, etc.)
        // For example: this.container.setScale(0.5);
    }
}
