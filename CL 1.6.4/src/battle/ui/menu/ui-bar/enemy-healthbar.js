import { HealthBar } from "./healthbar.js";

/**
 * Enemy-specific HealthBar. Defaults to the original width but allows custom behavior.
 */
export class EnemyHealthBar extends HealthBar {
    constructor(scene, x = 32, y = 32, z = 340) {
        super(scene, x, y, z);
        // Enemy specific adjustments can be made here
    }
}
