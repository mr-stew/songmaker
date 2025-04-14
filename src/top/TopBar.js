import 'style/top.scss'
import { EventEmitter } from 'events'
import { StartSongModal } from 'modal/StartSong'
import { AboutModal } from 'modal/About'
import { BackModal } from 'modal/Back'
import { ShareModal } from 'modal/Share'
import { SongOptions } from 'data/SongOptions'
import { GamePad } from './GamePad'
import { GA } from 'functions/GA'
import { BadgesModal } from 'modal/Badges'
import { ChallengeModal } from 'modal/ChallengeModal'

// --- Add LevelSystem import (though not strictly needed for type hints, good practice) ---
// import { LevelSystem } from 'functions/LevelSystem'
// --- Import ChallengeManager (needed for type hints / passing instance) ---
// import { ChallengeManager } from 'challenges/ChallengeManager'

export class TopBar extends EventEmitter {
    constructor(container = document.body, inputManager, midiData, badgeSystem, levelSystem, challengeManager) {
        super()

        this.modals = {
            startSong: false,
            about: false,
            share: false,
            challenge: false
        }
        
        this.badgeSystem = badgeSystem
        // --- Store levelSystem instance --- 
        this.levelSystem = levelSystem 
        // --- Store challengeManager instance --- 
        this.challengeManager = challengeManager

        //gamepad
        this.gamePad = new GamePad(container, inputManager)
        this.gamePad.on('change', gamePadInput => this.emit('GamePad', gamePadInput))

        this.container = document.createElement('div')
        this.container.id = 'topbar'
        this.toplinks = document.createElement('div')
        this.toplinks.id = 'toplinks'
        this.container.appendChild(this.toplinks)
        container.appendChild(this.container)
        
        // Create the Challenge button
        this.challengeButton = document.createElement('button')
        this.challengeButton.id = 'header-challenge'
        this.challengeButton.classList.add('header-link')
        // Initial text will be set by updateChallengeButtonText
        // this.challengeButton.textContent = 'Challenges'
        this.toplinks.appendChild(this.challengeButton)

        // --- Create Level Display Elements --- 
        this.levelDisplayContainer = document.createElement('div');
        this.levelDisplayContainer.id = 'level-display-container';
        this.toplinks.appendChild(this.levelDisplayContainer);

        this.levelText = document.createElement('span');
        this.levelText.id = 'level-text';
        this.levelText.textContent = 'Level: 1'; // Initial text
        this.levelDisplayContainer.appendChild(this.levelText);

        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.id = 'progress-bar-container';
        this.levelDisplayContainer.appendChild(this.progressBarContainer);

        this.progressBar = document.createElement('div');
        this.progressBar.id = 'progress-bar';
        this.progressBarContainer.appendChild(this.progressBar);

        this.pointsText = document.createElement('span');
        this.pointsText.id = 'points-text';
        this.pointsText.textContent = '0/100 XP'; // Initial text
        this.progressBarContainer.appendChild(this.pointsText); // Added inside the bar container
        
        // --- Insert Level Display before Challenges button --- 
        this.toplinks.insertBefore(this.levelDisplayContainer, this.challengeButton);

        // --- Update challenge button text initially ---
        this.updateChallengeButtonText();

        this.challengeButton.addEventListener('click', e => {
            e.preventDefault()
            this.emit('stop')
            if (!this.modals.challenge) {
                // --- Pass challengeManager to the modal --- 
                this.modals.challenge = new ChallengeModal(this.challengeManager)
                this.modals.challenge.on('cancel', () => {
                    this.modals.challenge = false
                })
            }
            GA.track({ eventCategory: 'top', eventLabel: 'challenge' })
        })

        // Create the badge icons container
        if (this.badgeSystem) {
            // Create a wrapper div for the badges section
            this.badgesSection = document.createElement('div')
            this.badgesSection.id = 'badges-section'
            this.toplinks.insertBefore(this.badgesSection, this.settingsButton)
            
            // Create the "Badges:" label and add it to the section
            this.badgesLabel = document.createElement('span')
            this.badgesLabel.id = 'badges-label'
            this.badgesLabel.textContent = 'Badges:'
            this.badgesSection.appendChild(this.badgesLabel)
            
            // Create the badge count display element
            this.badgeCountDisplay = document.createElement('span')
            this.badgeCountDisplay.id = 'badge-count-display'
            this.badgesSection.appendChild(this.badgeCountDisplay) // Add after label
            
            // Create the icons container and add it to the section
            this.badgeIconsContainer = document.createElement('div')
            this.badgeIconsContainer.id = 'badge-icons-container'
            this.badgesSection.appendChild(this.badgeIconsContainer)
            
            // Update badge icons based on current earned status
            this.updateBadgeIcons()
            
            // Listen for badge changes
            this.badgeSystem.on('badge-earned', () => {
                this.updateBadgeIcons()
            })
            
            this.badgeSystem.on('badges-toggled', (enabled) => {
                this.toggleBadgeIcons(enabled)
            })
        }

        // --- Add listeners for challenge updates ---
        if (this.challengeManager) {
            this.challengeManager.on('challenge-completed', this.updateChallengeButtonText.bind(this));
            this.challengeManager.on('challenges-reset', this.updateChallengeButtonText.bind(this));
        }

        //make the new song button
        this.settingsButton = document.createElement('button')
        this.settingsButton.id = 'header-settings'
        this.settingsButton.classList.add('header-link')
        this.settingsButton.textContent = 'Restart'
        this.toplinks.appendChild(this.settingsButton)
        this.settingsButton.addEventListener('click', e => {
            e.preventDefault()
            this.emit('stop')
            // Emit 'settings-update' with default options and the 'fromReset' flag set to true
            this.emit('settings-update', new SongOptions().toJSON(), true)
            GA.track({ eventCategory: 'top', eventLabel: 'restart' })
        })

        this.aboutButton = document.createElement('button')
        this.aboutButton.id = 'header-about'
        this.aboutButton.classList.add('header-link')
        this.aboutButton.textContent = 'About'
        this.toplinks.appendChild(this.aboutButton)
        this.aboutButton.addEventListener('click', e => {
            e.preventDefault()
            if (!this.modals.about) {
                this.modals.about = new AboutModal()
                this.modals.about.on('cancel', () => {
                    this.modals.about = false
                })
            }

            this.emit('stop')

            GA.track({ eventCategory: 'top', eventLabel: 'about' })
        })

        // Back button removed as requested
        /*
        this.backButton = document.createElement('button')
        this.backButton.id = 'header-back'
        this.backButton.setAttribute('aria-label', 'Back to Music Lab website')
        this.backButton.textContent = 'Back'
        this.container.appendChild(this.backButton)
        this.backButton.addEventListener('click', e => {
            GA.track({ eventCategory: 'top', eventLabel: 'back' })
            e.preventDefault()
            if (midiData.instrument.timeline._length < 1 && midiData.percussion.timeline._length < 1) {
                this.emit('back')
            } else if (!this.modals.back) {
                this.modals.back = new BackModal()
                this.modals.back.on('cancel', () => {
                    this.modals.back = false
                })
                this.modals.back.on('confirm', () => {
                    this.modals.back = false
                    this.emit('back')
                })
            }
        })
        */

        // in case there's a share btn at top, lets put the share modal here
        this.triggerShare = (data = false) => {
            if (!this.modals.share) {
                if (data === false) {
                    this.modals.share = new ShareModal(data)
                } else if (data === 'immediate') {
                    this.modals.share = new ShareModal({ immediate: true })
                } else {
                    this.modals.share = new ShareModal(data)
                }
                this.modals.share.on('cancel', () => {
                    this.modals.share = false
                })
                this.modals.share.on('request-wav', (id) => {
                    this.emit('request-wav', id)
                })
                this.modals.share.on('request-midi', () => {
                    this.emit('request-midi')
                })
            }

            if (data !== false && data !== 'immediate') {
                this.modals.share.populateSaveData(data)
            }
        }

        this.triggerSettingsModal = (songOptions) => {
            this.emit('stop')
            if (!this.modals.startSong) {
                // --- Pass challengeManager to StartSongModal --- 
                this.modals.startSong = new StartSongModal(songOptions, this.badgeSystem, this.levelSystem, this.challengeManager)
                this.modals.startSong.on('options', options => {
                    this.emit('settings-update', options)
                })
                this.modals.startSong.on('cancel', () => {
                    this.modals.startSong = false
                })
            }
        }

        // --- Initialize and listen to Level System --- 
        if (this.levelSystem) {
            this.updateLevelDisplay(); // Initial update

            this.levelSystem.on('points-update', (data) => {
                this.updateLevelDisplay(data.leveledUp);
                // Add animation on point gain
                this.animateProgressBar(); 
            });

            // Separate listener for level up if specific UI changes needed only on level up
            // this.levelSystem.on('level-up', (data) => {
            //     console.log(`Level Up! New Level: ${data.newLevel}`);
            //     // Potentially add a special level-up animation/notification here
            // });
             this.levelSystem.on('state-loaded', () => {
                 this.updateLevelDisplay(); // Update UI when state is loaded (e.g., from storage)
                 // --- Also update visibility on load --- 
                 this.toggleLevelDisplay(this.levelSystem.enabled);
             });
             
             // --- Listen for enable/disable toggle --- 
             this.levelSystem.on('levels-toggled', (enabled) => {
                 this.toggleLevelDisplay(enabled);
             });
             
             // --- Set initial visibility --- 
             this.toggleLevelDisplay(this.levelSystem.enabled);
        }
    }
    
    // --- Add method to toggle level display visibility --- 
    toggleLevelDisplay(enabled) {
        if (this.levelDisplayContainer) {
            this.levelDisplayContainer.style.display = enabled ? 'flex' : 'none';
        }
    }

    // --- Add method to update level display --- 
    updateLevelDisplay(leveledUp = false) {
        if (!this.levelSystem) return;

        const level = this.levelSystem.level;
        const pointsInLevel = this.levelSystem.pointsInCurrentLevel;
        const pointsNeeded = this.levelSystem.pointsForNextLevel;
        const progressPercent = (pointsInLevel / pointsNeeded) * 100;

        this.levelText.textContent = `Level: ${level}`;
        this.pointsText.textContent = `${pointsInLevel.toFixed(0)}/${pointsNeeded.toFixed(0)} XP`;
        this.progressBar.style.width = `${progressPercent}%`;
        
        // Optional: Add a class for level up visual feedback
        if (leveledUp) {
            this.levelDisplayContainer.classList.add('level-up-flash');
            // Remove the class after the animation duration
            setTimeout(() => {
                 this.levelDisplayContainer.classList.remove('level-up-flash');
            }, 1000); // Match animation duration
        }
    }

    // --- Add method for progress bar animation --- 
    animateProgressBar() {
        this.progressBar.classList.add('progress-bar-animated');
        // Remove the class after animation completes to allow re-triggering
        // Use 'animationend' event for more robust handling
        this.progressBar.addEventListener('animationend', () => {
            this.progressBar.classList.remove('progress-bar-animated');
        }, { once: true }); // {once: true} automatically removes the listener after it fires
    }

    // Update the badge icons displayed in the top bar
    updateBadgeIcons() {
        if (!this.badgeSystem) return;
        
        // Get all badges and earned badge IDs
        const allBadges = this.badgeSystem.getAllBadges();
        const earnedBadgeIds = this.badgeSystem.earnedBadges;

        // Update the badge count display
        const totalBadges = allBadges.length;
        const earnedCount = earnedBadgeIds.length;
        this.badgeCountDisplay.textContent = `(${earnedCount}/${totalBadges})`;

        // Clear current icons
        this.badgeIconsContainer.innerHTML = '';
        
        // Hide section content (label, count, icons) if badges are disabled
        if (!this.badgeSystem.enabled) {
            this.badgesLabel.style.display = 'none';
            this.badgeCountDisplay.style.display = 'none';
            this.badgeIconsContainer.style.display = 'none'; // Hide icon container
            return;
        } else {
            // Ensure elements are visible if enabled
            this.badgesLabel.style.display = ''; // Reset display style
            this.badgeCountDisplay.style.display = ''; // Reset display style
            this.badgeIconsContainer.style.display = 'flex'; // Reset icon container display
        }
        
        // Show earned badges first, then unearned badges up to a maximum of 5 total
        const earnedBadges = allBadges.filter(badge => earnedBadgeIds.includes(badge.id));
        const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));
        
        // Calculate how many badges to display (prioritize earned badges)
        const maxBadges = 5;
        const badgesToShow = [
            ...earnedBadges,
            ...unearnedBadges.slice(0, Math.max(0, maxBadges - earnedBadges.length))
        ].slice(0, maxBadges);
        
        // Create icon for each badge
        badgesToShow.forEach((badge, index) => {
            const isEarned = earnedBadgeIds.includes(badge.id);
            
            const badgeIcon = document.createElement('div');
            badgeIcon.className = 'top-badge-icon' + (isEarned ? ' earned' : ' unearned');
            badgeIcon.innerHTML = badge.icon;
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'top-badge-tooltip';
            
            // Add positioning classes for first and last badges to prevent tooltip from going off-screen
            if (index === 0) {
                tooltip.classList.add('tooltip-shift-left');
            } else if (index === badgesToShow.length - 1 || index === maxBadges - 1) {
                tooltip.classList.add('tooltip-shift-right');
            }
            
            tooltip.innerHTML = `
                <div class="tooltip-title">${badge.name}</div>
                <div class="tooltip-description">${badge.description}</div>
            `;
            badgeIcon.appendChild(tooltip);
            
            // Add to container
            this.badgeIconsContainer.appendChild(badgeIcon);
            
            // Event to open badges modal on click
            badgeIcon.addEventListener('click', () => {
                const badgesModal = new BadgesModal(this.badgeSystem);
            });
        });
        
        // Add a "more" indicator if there are more badges than we're showing
        if (allBadges.length > maxBadges) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'top-badge-more';
            moreIndicator.textContent = '+';
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'top-badge-tooltip tooltip-shift-right'; // Always align right for the more indicator
            tooltip.innerHTML = `
                <div class="tooltip-title">More Badges</div>
                <div class="tooltip-description">Click to view all badges</div>
            `;
            moreIndicator.appendChild(tooltip);
            
            // Add click event to open badges modal
            moreIndicator.addEventListener('click', () => {
                const badgesModal = new BadgesModal(this.badgeSystem);
            });
            
            this.badgeIconsContainer.appendChild(moreIndicator);
        }
    }
    
    // Toggle the visibility of badge icons based on the enabled state
    toggleBadgeIcons(enabled) {
        // Call updateBadgeIcons which now handles visibility based on enabled state
        this.updateBadgeIcons();
    }

    // --- Method to update challenge button text ---
    updateChallengeButtonText() {
        if (!this.challengeManager || !this.challengeButton) return;

        try {
            const { completedCount, totalCount } = this.challengeManager.getChallengeCounts();
            this.challengeButton.textContent = `Challenges: ${completedCount}/${totalCount}`;
        } catch (error) {
            console.error("Error updating challenge button text:", error);
            // Fallback text if there's an error getting counts
            this.challengeButton.textContent = 'Challenges';
        }
    }

    closeModals() {
        for (const k in this.modals) {
            if (this.modals[k]) {
                this.modals[k].close();
            }
        }
    }
}
