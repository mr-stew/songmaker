import newSongHtml from './start_song.html'
import { Modal } from './Modal'
import { SongOptions } from 'data/SongOptions'
import { BadgesModal } from './Badges'
// --- Import LevelSystem (for type hint/reference) --- 
// import { LevelSystem } from '../functions/LevelSystem'
import { ChallengeManager } from '../challenges/ChallengeManager';
// --- Import BadgeSystem (for type hint/reference) --- 
// import { BadgeSystem } from 'data/BadgeSystem'

export class StartSongModal extends Modal {
    /**
     * @param {SongOptions} currentSongOptions
     * @param {BadgeSystem} badgeSystem
     * @param {LevelSystem} levelSystem
     * @param {ChallengeManager} challengeManager // Add challengeManager instance
     */
    constructor(currentSongOptions, badgeSystem, levelSystem, challengeManager) { // Add challengeManager
        super(newSongHtml)

        this.element.classList.add('start-song')
        this.currentSongOptions = currentSongOptions
        this.currentSettingsToKeep = ['instrument', 'percussion', 'tempo']
        this.badgeSystem = badgeSystem
        this.levelSystem = levelSystem
        this.challengeManager = challengeManager // Store challengeManager

        const quant = document.getElementById('settings-modal').querySelectorAll('.quantity')
        const selects = document.getElementById('settings-modal').querySelectorAll('.select-wrap')
        this.options = currentSongOptions.toJSON()

        for (var i = 0; i < quant.length; i++) {
            this.setupQuantity(quant[i])
        }

        for (var j = 0; j < selects.length; j++) {
            this.setupSelect(selects[j])
        }
        this.setUpOctave()
        this.setupDifficulty()
        this.setupBadgeToggle()
        // --- Call setup for reset button ---
        this.setupResetButton()

        this.on('submit', () => {
            this.emit('options', this.options)
        })

        this.on('update-options', options => {
            this.options = options
            this.updateQuantity(quant)
        })

        // Get badges toggle checkbox and button
        this.badgesEnabledCheckbox = this.element.querySelector('#badges-enabled')
        this.viewBadgesButton = this.element.querySelector('#view-badges-button')
        this.badgesSettingsSection = this.element.querySelector('.badge-settings-section')

        // --- Get leveling toggle checkbox --- 
        this.levelsEnabledCheckbox = this.element.querySelector('#levels-enabled')
        this.levelingSettingsSection = this.element.querySelector('.leveling-settings-section')

        // Badges modal setup
        this.badgesModal = null

        // --- Handle Leveling Toggle Visibility and State --- 
        if (this.levelSystem && this.levelsEnabledCheckbox && this.levelingSettingsSection) {
            // Set initial checkbox state
            this.levelsEnabledCheckbox.checked = this.levelSystem.enabled;

            // Add event listener for changes
            this.levelsEnabledCheckbox.addEventListener('change', (event) => {
                this.levelSystem.setEnabled(event.target.checked);
            });

            // Optional: Listen for external changes (e.g., if loaded state changes after modal opens)
            this.levelSystem.on('levels-toggled', (enabled) => {
                this.levelsEnabledCheckbox.checked = enabled;
            });

        } else {
             // If level system doesn't exist or checkbox not found, hide section
             if(this.levelingSettingsSection) this.levelingSettingsSection.style.display = 'none';
        }

        this.closeButton = this.element.querySelector('#cancel')
    }

    // --- Add setup function for reset button ---
    setupResetButton() {
        const resetButton = this.element.querySelector('#reset-game-button');
        if (!resetButton) return;

        resetButton.addEventListener('click', () => {
            // Confirmation dialog
            const confirmed = confirm("Are you sure you want to reset all your progress? This includes challenges, badges, and levels, and cannot be undone.");

            if (confirmed) {
                console.log("Resetting game progress...");

                // Reset Challenges
                if (this.challengeManager) {
                    this.challengeManager.resetChallenges();
                }

                // Reset Badges
                if (this.badgeSystem) {
                    this.badgeSystem.resetAllBadges();
                    // Optionally update the badge toggle state if badges are disabled after reset
                    if (this.badgesEnabledCheckbox) {
                         this.badgesEnabledCheckbox.checked = this.badgeSystem.enabled;
                    }
                }

                // Reset Levels
                if (this.levelSystem) {
                    this.levelSystem.reset();
                    // Optionally update the level toggle state 
                    if (this.levelsEnabledCheckbox) {
                         this.levelsEnabledCheckbox.checked = this.levelSystem.enabled;
                    }
                }
                
                // Give feedback to the user
                alert("All progress has been reset.");
                
                // Optional: Close the modal after reset?
                // this.close(); 
            }
        });
    }
    // --- End setup function ---

    // Setup badge toggle functionality
    setupBadgeToggle() {
        if (!this.badgeSystem) return;
        
        const badgeToggle = document.getElementById('badges-enabled');
        const viewBadgesButton = document.getElementById('view-badges-button');
        
        // Set initial state
        badgeToggle.checked = this.badgeSystem.enabled;
        
        // Add change listener
        badgeToggle.addEventListener('change', () => {
            this.badgeSystem.toggleBadges(badgeToggle.checked);
        });
        
        // Handle view badges button
        viewBadgesButton.addEventListener('click', () => {
            // Always create a new modal instance when the button is clicked
            const badgesModal = new BadgesModal(this.badgeSystem);
            
            // When the modal is closed, handle cleanup
            badgesModal.on('cancel', () => {
                // No need to do anything since the modal removes itself
            });
        });
    }

    Event(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined }
        var evt = document.createEvent('CustomEvent')
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
        return evt
    }

    updateQuantity(els) {
        for (var i = 0; i < els.length; i++) {
            var input = els[i].querySelector('input')
            var cover = els[i].querySelector('.quantity-cover')
            cover.value = input.value
        }
    }

    setupSelect(el) {
        var dupe = document.createElement('div')
        var select = el.querySelector('select')
        select.style.opacity = 0
        dupe.classList.add('dupe')
        el.appendChild(dupe)
        select.addEventListener('change', () => {
            var optionText = select.querySelector('option[value="' + select.value + '"]').textContent
            dupe.textContent = optionText
            select.parentNode.style.width = (dupe.offsetWidth + 40) + 'px'
        })
        select.dispatchEvent(new Event('change'));
        select.style.opacity = 1
    }

    setupQuantity(el) {
        var container = document.createElement('div')
        var up = document.createElement('div')
        var down = document.createElement('div')
        var upImage = document.createElement('img')
        var downImage = document.createElement('img')
        var label = document.createElement('div')
        var cover = document.createElement('input')
        var input = el.querySelector('input')
        var event = new Event('change')
        var min = input.getAttribute('min')
        var max = input.getAttribute('max')
        var addLabel = input.getAttribute('data-label') ? ' ' + input.getAttribute('data-label') : ''
        var pressTimeout = false

        input.changeMax = function (newMax) {
            max = newMax
            if (input.value > newMax) {
                changeInputTo(newMax)
            }
        }

        var changeInput = function (change) {
            var oldValue = parseInt(input.value, 10)
            var newVal = oldValue
            if ((change > 0 && (oldValue + change) <= max) || (change < 0 && (oldValue + change) >= min)) {
                newVal = oldValue + change
                input.value = newVal
                cover.value = input.value
            }
            input.dispatchEvent(event)
        }

        var changeInputTo = function (changeTo) {
            var oldValue = parseInt(input.value, 10)
            var newValue = parseInt(changeTo, 10)
            // Use the stored min/max attributes for validation when forcing
            const currentMin = parseInt(input.getAttribute('min'), 10);
            const currentMax = parseInt(input.getAttribute('max'), 10);
            if (!isNaN(newValue) && newValue >= currentMin && newValue <= currentMax) {
                input.value = newValue
                cover.value = input.value
            } else if (!isNaN(newValue) && newValue < currentMin){
                 // Snap to min if below
                 input.value = currentMin;
                 cover.value = currentMin;
            } else if (!isNaN(newValue) && newValue > currentMax){
                // Snap to max if above
                input.value = currentMax;
                cover.value = currentMax;
            } else {
                // Revert cover if invalid input
                cover.value = oldValue
            }
            input.dispatchEvent(event)
        }

        // Add a function to force the value directly, bypassing internal max check temporarily
        // changeMax should be called afterwards to set the correct limit.
        input.forceValue = function(newValue) {
            const val = parseInt(newValue, 10);
            if (!isNaN(val)) {
                 // We assume the forced value is valid in the *new* context (difficulty)
                 // so we set it directly. The subsequent changeMax call will enforce the *new* limit.
                input.value = val;
                if (cover) cover.value = val;
                input.dispatchEvent(event); // Trigger update for listeners and cover display
            }
        }

        var setChangeTimeout = function (change) {
            pressTimeout = setTimeout(() => {
                if (pressTimeout) {
                    changeInput(change)
                    setChangeTimeout(change)
                }
            }, 100)
        }

        container.classList.add('quantity-nav')
        el.appendChild(container)
        cover.classList.add('quantity-cover')
        label.classList.add('quantity-label')
        up.classList.add('quantity-button', 'quantity-up')
        down.classList.add('quantity-button', 'quantity-down')
        container.appendChild(up)
        container.appendChild(down)
        container.appendChild(label)
        container.appendChild(cover)
        upImage.setAttribute('src', 'images/icon-quantity-add.svg')
        downImage.setAttribute('src', 'images/icon-quantity-minus.svg')
        up.appendChild(upImage)
        down.appendChild(downImage)
        // cover.innerHTML = input.value + (input.getAttribute('data-label') ?  ' ' + input.getAttribute('data-label') : '')
        label.innerHTML = addLabel
        cover.value = input.value

        cover.addEventListener('change', () => {
            changeInputTo(cover.value)
        })

        input.addEventListener('change', () => {
            if (cover.value !== input.value) {
                cover.value = input.value
            }
        })

        label.onclick = function () {
            cover.focus()
        }

        cover.addEventListener('focus', () => {
            cover.select()
        })

        cover.onkeypress = function (event) {
            // allow only numbers
            return event.charCode >= 48 && event.charCode <= 57
        }

        up.onclick = function () {
            changeInput(1)
        }

        up.onmousedown = function () {
            pressTimeout = setTimeout(() => {
                setChangeTimeout(1)
            }, 500)
        }

        down.onmousedown = function () {
            pressTimeout = setTimeout(() => {
                setChangeTimeout(-1)
            }, 500)
        }

        down.onmouseup = down.onmouseout = up.onmouseup = up.onmouseout = function () {
            clearTimeout(pressTimeout)
            pressTimeout = false
        }

        down.onclick = function () {
            changeInput(-1)
        }
    }

    setUpOctave() {
        const startOctaveInput = document.getElementById('settings-modal').querySelector('select[name="rootOctave"]')
        const numOctaveInput = document.getElementById('settings-modal').querySelector('input[name="octaves"]')

        startOctaveInput.addEventListener('change', () => {
            let v = parseInt(startOctaveInput.value, 10)
            if (v > 4) {
                numOctaveInput.changeMax(2)
            } else {
                numOctaveInput.changeMax(3)
            }
        })
    }

    setupDifficulty() {
        const difficultySelect = document.getElementById('settings-modal').querySelector('select[name="difficulty"]')
        // Keep references to other inputs if needed elsewhere, but applyDifficultySettings gets them directly now
        // const scaleSelect = document.getElementById('settings-modal').querySelector('select[name="scale"]')
        // const octavesInput = document.getElementById('settings-modal').querySelector('input[name="octaves"]')
        // const subdivisionInput = document.getElementById('settings-modal').querySelector('input[name="subdivision"]')
        
        // Set initial difficulty constraints based on the default selected value
        this.applyDifficultySettings(difficultySelect.value)
        
        difficultySelect.addEventListener('change', () => {
            this.applyDifficultySettings(difficultySelect.value)
        })
    }
    
    applyDifficultySettings(difficulty) {
        const scaleSelect = document.getElementById('settings-modal').querySelector('select[name="scale"]');
        const octavesInput = document.getElementById('settings-modal').querySelector('input[name="octaves"]');
        const subdivisionInput = document.getElementById('settings-modal').querySelector('input[name="subdivision"]');
        const barsInput = document.getElementById('settings-modal').querySelector('input[name="bars"]'); // Get bars input
        // Covers are updated automatically by the change event dispatched from forceValue/changeInputTo

        switch(difficulty) {
            case 'beginner':
                // Bars: Force 2
                if (barsInput.forceValue) barsInput.forceValue(2);
                // barsInput.changeMax(?); // Max not specified, leave default (16)

                // Scale: Force Pentatonic, disable Chromatic
                scaleSelect.value = 'pentatonic';
                Array.from(scaleSelect.options).forEach(option => {
                    option.disabled = (option.value === 'chromatic');
                });
                scaleSelect.dispatchEvent(new Event('change')); // Update UI

                // Octaves: Force 1, Max 1
                if (octavesInput.forceValue) octavesInput.forceValue(1);
                octavesInput.changeMax(1);
                // No need to manually update cover, forceValue dispatches change

                // Subdivision: Force 2, Max 2
                if (subdivisionInput.forceValue) subdivisionInput.forceValue(2);
                subdivisionInput.changeMax(2);
                // No need to manually update cover

                break;
                
            case 'intermediate':
                // Bars: Force 4
                if (barsInput.forceValue) barsInput.forceValue(4);
                // barsInput.changeMax(?);

                // Scale: Force Major, enable all
                scaleSelect.value = 'major';
                Array.from(scaleSelect.options).forEach(option => {
                    option.disabled = false;
                });
                scaleSelect.dispatchEvent(new Event('change')); // Update UI

                // Octaves: Force 2, Max 2
                if (octavesInput.forceValue) octavesInput.forceValue(2);
                octavesInput.changeMax(2);

                // Subdivision: Force 3, Max 3
                if (subdivisionInput.forceValue) subdivisionInput.forceValue(3);
                subdivisionInput.changeMax(3);

                break;
                
            case 'advanced':
                 // Bars: Force 8
                 if (barsInput.forceValue) barsInput.forceValue(8);
                 // barsInput.changeMax(?);

                 // Scale: Force Chromatic, enable all
                 scaleSelect.value = 'chromatic';
                 Array.from(scaleSelect.options).forEach(option => {
                     option.disabled = false;
                 });
                  scaleSelect.dispatchEvent(new Event('change')); // Update UI

                // Octaves: Force 3, Max 3
                if (octavesInput.forceValue) octavesInput.forceValue(3);
                octavesInput.changeMax(3);

                // Subdivision: Force 4, Max 4
                if (subdivisionInput.forceValue) subdivisionInput.forceValue(4);
                subdivisionInput.changeMax(4);

                break;
        }
         // Final dispatch is likely redundant now as forceValue and select setting dispatch changes,
         // but keeping them doesn't hurt.
        // octavesInput.dispatchEvent(new Event('change'));
        // subdivisionInput.dispatchEvent(new Event('change'));
    }

    get options() {
        const tempOptions = new SongOptions()
        const keys = tempOptions.toJSON() // get a list of keys
        for (let opt in keys) {
            const input = this.element.querySelector(`[name=${opt}]`)
            if (input) {
                //convert it to a number if possible
                if (!isNaN(parseFloat(input.value))) {
                    tempOptions[opt] = parseFloat(input.value)
                } else {
                    tempOptions[opt] = input.value
                }
            }
            if (this.currentSettingsToKeep.indexOf(opt) > -1) {
                tempOptions[opt] = this.currentSongOptions[opt]
            }
        }
        //merge with default options
        return tempOptions.toJSON()
    }

    set options(options) {
        for (let opt in options) {
            const input = this.element.querySelector(`[name=${opt}]`)
            if (input) {
                input.value = options[opt]
            }
        }
    }
}
