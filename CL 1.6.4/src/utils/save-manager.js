const SAVE_KEY = 'cl_save_v1';

export default class SaveManager {
    static saveGame(state = {}) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, timestamp: Date.now(), state }));
            return true;
        } catch (e) {
            console.warn('[SaveManager] save failed', e);
            return false;
        }
    }

    static loadGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.state ?? null;
        } catch (e) {
            console.warn('[SaveManager] load failed', e);
            return null;
        }
    }

    static clearSave() {
        localStorage.removeItem(SAVE_KEY);
    }
}