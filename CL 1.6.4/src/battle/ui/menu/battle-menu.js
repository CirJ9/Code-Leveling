/**
 * Battle UI management: builds and controls editor, choice menus, info panel and RAM predictions.
 * Exposes `setOnRunPressed` and `setOnEditorChange` callbacks so the scene can wire game logic.
 */
import Phaser from "../../../../lib/phaser.js";
import { BATTLE_ASSET_KEYS, BATTLE_CONTAINERS_KEYS, UI_ASSET_KEYS } from "../../../assets/assets-keys/asset-keys.js";
import { initMonacoLoader, initMonacoEditor } from "../../monaco/monaco-init.js";
import { destroyEditor, focusEditor, getEditor, getEditorContent } from "../../monaco/monaco-api.js";
import { showEditor, hideEditor } from "../../monaco/monaco-control.js";
import { DIRECTION } from "../../../common/direction.js";
import { ACTIVE_BATTLE_MENU, BATTLE_CHOICE_OPTIONS } from "./battle-menu-options.js";
import { BATTLE_UI_TEXT_STYLE, CHOICE_HOVER } from "./battle-menu-config.js";
import { BattleComponent } from "../../battle-components/battle-component.js";

const CHOICE_SELECTION_CURSOR_POS = Object.freeze({ x: 85, y: 61 })

export class BattleMenu {
    /** @type {Phaser.Scene} */
    #scene;
    /** @type {Phaser.GameObjects.Container} */
    #mainBattleUIMenuPhaserGameContainerGameObject;
    /** @type {Phaser.GameObjects.Container} */
    #ChoiceSelectionSubBattleUIPhaserContainerGameObject;
    /** @type {Phaser.GameObjects.Container} */
    #infoPanelContainerGameObject;
    /** @type {Phaser.GameObjects.Text} */
    #battleTextGameObjectLine1;
    /** @type {Phaser.GameObjects.Text} */
    #battleTextGameObjectLine2;
    /** @type {Phaser.GameObjects.Image} */
    #choiceSelectionCursorPhaserImageGameObject;
    /** @type {BATTLE_CHOICE_OPTIONS} */
    #selectedChoiceOption;
    /** @type {ACTIVE_BATTLE_MENU} */
    #activeBattleOption;
    /** @type {boolean} */
    #inputCooldown;
    /** @type {string[]} */
    #queuedInfoPanelMessages;
    /** @type {() => void | undefined} */
    #queuedInfoPanelCallback;
    /** @type {boolean} */
    #waitingForPlayerInput;
    /** @type {Phaser.GameObjects.Text} */
    #codeBtnTextGameObject;
    /** @type {Phaser.GameObjects.Text} */
    #itemBtnTextGameObject;
    /** @type {Phaser.GameObjects.Text} */
    #fleeBtnTextGameObject;
    /** @type {Phaser.GameObjects.Text} */
    #historyLogText;
    /** @type {Phaser.GameObjects.Text} */
    #editorRamDisplayValue; // NEW: To show prediction
    /** @type {(code: string) => void} */
    #onRunPressedCallback;
    /** @type {() => void} */
    #onRechargeRequested;
    /** @type {(code: string) => number} */
    #onEditorChangeCallback; // NEW: Hook for prediction
    /** @type {BattleComponent} */
    #activeEnemyMob

    constructor(scene, activeEnemy){
        this.#scene = scene;
        this.#activeEnemyMob = activeEnemy;
        this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.CODE;
        this.#activeBattleOption = ACTIVE_BATTLE_MENU.BATTLE_CHOICE_MAIN;
        this.#queuedInfoPanelCallback = undefined;
        this.#queuedInfoPanelMessages = [];
        this.#waitingForPlayerInput = false;

        this.#scene.input.on('pointerdown', () => {
            if (this.#waitingForPlayerInput) {
                this.#updateInfoPanelWithMessage();
            }
        });

        this.#createEditorUI();
        this.#createChoiceUI();
        this.#createInfoPanelUI();
        this.#createSubUI();
        this.showBattleTextMessage();
    }
    
    /**
     * Bind a callback invoked when the Run button is pressed or run is triggered.
     * @param {(code: string) => void} callback
     */
    setOnRunPressed(callback) {
        this.#onRunPressedCallback = callback;
    }

    /**
     * @param {() => void} callback
     */
    setOnRechargeRequested(callback) { // <-- NEW: Public setter
        this.#onRechargeRequested = callback;
    }

    /**
     * Set callback to calculate RAM cost on each editor change (live prediction).
     * @param {(code: string) => number} callback
     */
    setOnEditorChange(callback) {
        this.#onEditorChangeCallback = callback;
    }

    showMainBattleUI(){
        this.#mainBattleUIMenuPhaserGameContainerGameObject.setAlpha(1);
        showEditor();
        this.#scene.input.keyboard.enabled = false;
        
        // Remove captures
        const keys = ['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'SHIFT'];
        keys.forEach(k => this.#scene.input.keyboard.removeCapture(k));
    }

    hideMainBattleUI(){
        this.#mainBattleUIMenuPhaserGameContainerGameObject.setAlpha(0);
        hideEditor();
        this.#scene.input.keyboard.enabled = true;
        const keys = ['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'SHIFT'];
        keys.forEach(k => this.#scene.input.keyboard.addCapture(k));
    }
    
    showBattleChoices(){
        this.#activeBattleOption = ACTIVE_BATTLE_MENU.BATTLE_CHOICE_MAIN;
        this.hideMainBattleUI();
        this.#ChoiceSelectionSubBattleUIPhaserContainerGameObject.setAlpha(1);
        this.#moveChoiceSelectionCursor();
        this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.CODE
        this.#scene.input.keyboard.enabled = true;
    }

    hideBattleChoices(){
        this.#ChoiceSelectionSubBattleUIPhaserContainerGameObject.setAlpha(0);
    }

    showBattleTextMessage(){
        this.hideMainBattleUI();
        this.hideBattleChoices();
        this.updateInfoPanelMessagesAndWaitForInput(
            [`${this.#activeEnemyMob.name} HAS APPEARED!\nWHAT WILL YOU DO?`],
            () => { this.showBattleChoices(); }
        );
    }

    addToHistoryLog(text) {
        this.#historyLogText.setText(text);
    }

    /**
     * Update the small RAM cost display to reflect a predicted cost.
     * @param {number} cost
     * @returns {void}
     */
    // NEW: Update the yellow RAM text
    updateRamPrediction(cost) {
        if (this.#editorRamDisplayValue) {
            this.#editorRamDisplayValue.setText(cost.toString());
        }
    }

    /**
     * Handle menu input coming from keyboard or controller: directional, OK and CANCEL actions.
     * @param {string|import('../../../common/direction.js').DIRECTION} input
     * @returns {void}
     */
    handlePlayerInput(input){
        if (this.#waitingForPlayerInput && (input === 'CANCEL'|| input === 'OK')) {
            this.#updateInfoPanelWithMessage();
            return;
        }

        if(input === 'CANCEL'){
            this.#switchToChoiceMenu();
            return;
        }

        if(input === 'OK'){
            if (this.#activeBattleOption === ACTIVE_BATTLE_MENU.BATTLE_CHOICE_MAIN) {
                this.#handlePlayerSelectedChoiceOption();
                return;
            }
            return;
        }

        if (this.#inputCooldown) return; 
        this.#inputCooldown = true;
        this.#updateSelectedBattleChoiceFromInput(input);
        this.#moveChoiceSelectionCursor();

        this.#scene.time.delayedCall(150, () => {
            this.#inputCooldown = false;
        });
    }

    /**
     * Queue messages to show in the info panel and call `callback` when user has advanced through them.
     * @param {string[]} messages
     * @param {() => void} callback
     */
    updateInfoPanelMessagesAndWaitForInput(messages, callback){
        this.#queuedInfoPanelMessages = messages;
        this.#queuedInfoPanelCallback = callback;
        this.#updateInfoPanelWithMessage();
    }

    #updateInfoPanelWithMessage(){
        this.#waitingForPlayerInput = false;
        if (this.#queuedInfoPanelMessages.length === 0) {
            this.#infoPanelContainerGameObject.setAlpha(0); 
            if (this.#queuedInfoPanelCallback) {
                this.#queuedInfoPanelCallback();
                this.#queuedInfoPanelCallback = undefined;
            }
            return;
        }
        this.#infoPanelContainerGameObject.setAlpha(1);
        this.#battleTextGameObjectLine1.setText('')
        this.#battleTextGameObjectLine2.setText('')

        const messageToBeDisplayed = this.#queuedInfoPanelMessages.shift();
        this.#battleTextGameObjectLine1.setText(messageToBeDisplayed);
        this.#scene.time.delayedCall(200, () => {
            this.#waitingForPlayerInput = true;
        });
    }

    /**
     * Show info panel messages and automatically advance after `delayMs` per message.
     * @param {string[]} messages
     * @param {() => void} [callback]
     * @param {number} [delayMs=800]
     */
    showInfoPanelMessagesAuto(messages, callback, delayMs = 800) {
        if (!messages || messages.length === 0) {
            if (callback) callback();
            return;
        }

        // Clone messages so caller's array isn't mutated
        this.#queuedInfoPanelMessages = messages.slice();
        this.#queuedInfoPanelCallback = callback;
        this.#infoPanelContainerGameObject.setAlpha(1);
        this.#battleTextGameObjectLine1.setText('');
        this.#battleTextGameObjectLine2.setText('');

        const showNext = () => {
            if (this.#queuedInfoPanelMessages.length === 0) {
                this.#infoPanelContainerGameObject.setAlpha(0);
                if (this.#queuedInfoPanelCallback) {
                    const cb = this.#queuedInfoPanelCallback;
                    this.#queuedInfoPanelCallback = undefined;
                    cb();
                }
                return;
            }
            const msg = this.#queuedInfoPanelMessages.shift();
            this.#battleTextGameObjectLine1.setText(msg);
            this.#scene.time.delayedCall(delayMs, showNext, [], this);
        };

        showNext();
    }
    

    /**
     * Destroy any existing Monaco instance and create a new one attached to the editor panel.
     * Adds a change listener for live RAM prediction.
     * @returns {Promise<void>}
     */
    async createNewEditorInstance() {
        destroyEditor();
        const container = document.getElementById("monaco-panel");
        if (!container) return;
        container.innerHTML = '';
        
        // NEW: Assign editor to a variable we can attach listeners to
        const editor = await initMonacoEditor("monaco-panel", {
            value: `public class Spell {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}`,
        });
        
        // NEW: Listener for Live Prediction - on each edit, call the provided callback to update RAM cost prediction
        if (editor) {
            editor.onDidChangeModelContent(() => {
                const code = editor.getValue();
                if (this.#onEditorChangeCallback) {
                    const cost = this.#onEditorChangeCallback(code);
                    // Update the small UI widget that shows predicted RAM cost
                    this.updateRamPrediction(cost);
                }
            });
        }

        hideEditor();
    }

    #createEditorUI(){
        this.#mainBattleUIMenuPhaserGameContainerGameObject = this.#scene.add.container(0 , 446, [
            this.#scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.EDITOR_PANEL).setScale(0.94, 1).setOrigin(0, 0),
        ]);

        const panelX = 12.9;
        const panelY = 10;
        const panelWidth = 425;
        const panelHeight = 110;
        
        const domWrapperHTML = `<div id="monaco-panel"></div>`;
        const domEditor = this.#scene.add.dom(panelX - 5, panelY - 2).createFromHTML(domWrapperHTML);
        domEditor.setOrigin(0, 0).setDepth(1);
    
    /** @type {HTMLDivElement} */
        const node = domEditor.node.querySelector("#monaco-panel");
        if (node) {
            node.style.width = panelWidth + "px";
            node.style.height = panelHeight+ "px";
            node.style.position = "absolute";
            node.style.zIndex = "100";
            node.style.border = "2px solid #0cc0df";
            node.style.borderRadius = "6px";
            node.style.overflow = "hidden";
        }

        this.#mainBattleUIMenuPhaserGameContainerGameObject.add(domEditor);
        initMonacoLoader();
        this.createNewEditorInstance();
        this.#createEditorRamDisplayUI();
    }

    #createEditorRamDisplayUI(){
        const editorRamDisplayText = this.#scene.add.text(10, 10, 'RAM COST:', {
            fontFamily: 'FutureNarrow', fontSize: '10px', color: '#e5ff00ff', fontStyle: 'bold',
        });

        // Store reference to this text object
        this.#editorRamDisplayValue = this.#scene.add.text(24, 40, '00', {
            fontFamily: 'FutureNarrow', fontSize: '20px', color: '#ffffffff', fontStyle: 'bold',
        });

        const runButton = this.#scene.add.image(6.5, 100, BATTLE_ASSET_KEYS.RUN_BUTTON)
            .setOrigin(0, 0).setScale(0.9, 0.6).setInteractive({ useHandCursor: true });

        runButton.on('pointerover', () => runButton.setTexture(BATTLE_ASSET_KEYS.RUN_BUTTON_HOVER));
        runButton.on('pointerout', () => runButton.setTexture(BATTLE_ASSET_KEYS.RUN_BUTTON));
        // Run button: grab editor contents and invoke the bound Run callback (scene will evaluate it)
        runButton.on('pointerdown', async () => {
            const code = getEditorContent();
            if (this.#onRunPressedCallback) {
                this.#onRunPressedCallback(code);
            }
        });

        const rechargeButton = this.#scene.add.image(6, 75, BATTLE_ASSET_KEYS.RECHARGE_BUTTON)
            .setOrigin(0, 0).setScale(0.6).setInteractive({ useHandCursor: true })
            .on('pointerover', () => rechargeButton.setTexture(BATTLE_ASSET_KEYS.RECHARGE_BUTTON_HOVER))
            .on('pointerout', () => rechargeButton.setTexture(BATTLE_ASSET_KEYS.RECHARGE_BUTTON))
            .on('pointerdown', () => { 
                hideEditor();
                if (this.#onRechargeRequested) {
                    this.#onRechargeRequested();
                }
            });

        const backButton = this.#scene.add.image(
            rechargeButton.x + rechargeButton.displayWidth + 2, rechargeButton.y, BATTLE_ASSET_KEYS.BACK_BUTTON
        ).setOrigin(0, 0).setScale(0.6).setInteractive({ useHandCursor: true })
        .on('pointerover', () => backButton.setTexture(BATTLE_ASSET_KEYS.BACK_BUTTON_HOVER))
        .on('pointerout', () => backButton.setTexture(BATTLE_ASSET_KEYS.BACK_BUTTON));
        
        backButton.on('pointerdown', () => { this.showBattleChoices(); });

        const ramDisplayUIContainer = this.#scene.add.container(440, 0, [
            this.#scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.EDITOR_PANEL).setScale(0.13, 1).setOrigin(0, 0),
            editorRamDisplayText, this.#editorRamDisplayValue, runButton, rechargeButton, backButton
        ]);
        this.#mainBattleUIMenuPhaserGameContainerGameObject.add(ramDisplayUIContainer);
        this.hideMainBattleUI();
    }

    #createChoiceUI(){
        this.#choiceSelectionCursorPhaserImageGameObject = this.#scene.add.image(CHOICE_SELECTION_CURSOR_POS.x, CHOICE_SELECTION_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0.5).setScale(1.5);
    
        this.#codeBtnTextGameObject = this.#scene.add.text(100, 50, BATTLE_CHOICE_OPTIONS.CODE, BATTLE_UI_TEXT_STYLE)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.hideBattleChoices();
                this.showMainBattleUI();
            });

        this.#itemBtnTextGameObject = this.#scene.add.text(225, 50, BATTLE_CHOICE_OPTIONS.ITEM, BATTLE_UI_TEXT_STYLE)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.#handlePlayerSelectedChoiceOption(); });

        this.#fleeBtnTextGameObject = this.#scene.add.text(350, 50, BATTLE_CHOICE_OPTIONS.FLEE, BATTLE_UI_TEXT_STYLE)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.#scene.events.emit('attemptFlee'); });

        this.#ChoiceSelectionSubBattleUIPhaserContainerGameObject = this.#scene.add.container(0, 446, [
            this.#scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.EDITOR_PANEL).setScale(0.94, 1).setOrigin(0, 0),
            this.#codeBtnTextGameObject, this.#itemBtnTextGameObject, this.#fleeBtnTextGameObject,
            this.#choiceSelectionCursorPhaserImageGameObject, 
        ]);
    }
    
    #createInfoPanelUI() {
        const panelBG = this.#scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.EDITOR_PANEL).setScale(0.94, 1).setOrigin(0, 0);
        this.#battleTextGameObjectLine1 = this.#scene.add.text(20, 22, '', BATTLE_UI_TEXT_STYLE);
        this.#battleTextGameObjectLine2 = this.#scene.add.text(20, 66, '', BATTLE_UI_TEXT_STYLE);

        this.#infoPanelContainerGameObject = this.#scene.add.container(0, 446, [
            panelBG, this.#battleTextGameObjectLine1, this.#battleTextGameObjectLine2
        ]).setAlpha(0);
    }

    #createSubUI(){
        const historyBG = this.#scene.add.rectangle(10, 10, 205, 110, 0x000000,).setOrigin(0, 0);
        const historyText = this.#scene.add.text(10, 10, 'History Logs:', { fontFamily: 'FutureNarrow', fontSize: '10px', color: '#ffffffff', fontStyle: 'bold'});
        this.#historyLogText = this.#scene.add.text(20, 30, 'Ready...', { fontFamily: 'FutureNarrow', fontSize: '12px', color: '#ffffffff', fontStyle: 'bold', wordWrap: { width: 190 } });

        this.#scene.add.container(800, 446, [
            this.#scene.add.image(0, 0, BATTLE_CONTAINERS_KEYS.HISTORY_PANEL).setScale(1.16 , 1).setOrigin(0, 0),
            historyBG, historyText, this.#historyLogText
        ]);
    }
    
    #updateSelectedBattleChoiceFromInput(direction){
        if (this.#activeBattleOption !== ACTIVE_BATTLE_MENU.BATTLE_CHOICE_MAIN) return;
        
        if (direction === DIRECTION.RIGHT) {
            if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.CODE) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.ITEM;
            else if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.ITEM) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.FLEE;
            else if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.FLEE) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.CODE;
        } else if (direction === DIRECTION.LEFT) {
            if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.CODE) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.FLEE;
            else if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.ITEM) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.CODE;
            else if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.FLEE) this.#selectedChoiceOption = BATTLE_CHOICE_OPTIONS.ITEM;
        }
    }
     
    #moveChoiceSelectionCursor() {
        if (this.#activeBattleOption !== ACTIVE_BATTLE_MENU.BATTLE_CHOICE_MAIN) return;

        this.#codeBtnTextGameObject.setStyle(BATTLE_UI_TEXT_STYLE);
        this.#itemBtnTextGameObject.setStyle(BATTLE_UI_TEXT_STYLE);
        this.#fleeBtnTextGameObject.setStyle(BATTLE_UI_TEXT_STYLE);

        switch (this.#selectedChoiceOption) {
            case BATTLE_CHOICE_OPTIONS.CODE:
                this.#choiceSelectionCursorPhaserImageGameObject.setPosition(CHOICE_SELECTION_CURSOR_POS.x, CHOICE_SELECTION_CURSOR_POS.y);
                this.#codeBtnTextGameObject.setStyle(CHOICE_HOVER);
                break;
            case BATTLE_CHOICE_OPTIONS.ITEM:
                this.#choiceSelectionCursorPhaserImageGameObject.setPosition(210, CHOICE_SELECTION_CURSOR_POS.y);
                this.#itemBtnTextGameObject.setStyle(CHOICE_HOVER);
                break;
            case BATTLE_CHOICE_OPTIONS.FLEE:
                this.#choiceSelectionCursorPhaserImageGameObject.setPosition(335, CHOICE_SELECTION_CURSOR_POS.y);
                this.#fleeBtnTextGameObject.setStyle(CHOICE_HOVER);
                break;
        }
    }

    #switchToChoiceMenu(){
        this.hideMainBattleUI();
        this.showBattleChoices();
        this.#moveChoiceSelectionCursor();
    }

    #handlePlayerSelectedChoiceOption(){
        this.hideBattleChoices();
        if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.CODE) {
            this.#scene.time.delayedCall(10, () => focusEditor());
            this.showMainBattleUI();
            return;
        }
        if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.ITEM) {
            this.showBattleTextMessage();
            this.#activeBattleOption = ACTIVE_BATTLE_MENU.BATTLE_ITEM;
            this.updateInfoPanelMessagesAndWaitForInput(['Error 404: Bag is empty...'], () => {
                this.#switchToChoiceMenu();
            });
            return;
        }
        if (this.#selectedChoiceOption === BATTLE_CHOICE_OPTIONS.FLEE) {
            // Delegate flee logic to the scene so it can handle world transitions
            this.#scene.events.emit('attemptFlee');
            return;
        }
    }    
}