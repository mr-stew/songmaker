import { Modal } from './Modal';
import challengeHtml from './challenge_modal.html';
import './challenge_modal.scss';

export class ChallengeModal extends Modal {
    constructor(challengeManager) { // Accept ChallengeManager instance
        super(challengeHtml);

        this.challengeManager = challengeManager;
        this.element.classList.add('challenge-modal-container');

        // --- Get the list container --- 
        this.challengeListContainer = this.element.querySelector('#challenge-list');

        if (!this.challengeListContainer) {
            console.error("Challenge list container (#challenge-list) not found in modal HTML.");
            return;
        }

        // --- Populate the challenge list --- 
        this.renderChallenges();

        // --- Add event listener for the close button --- 
        const cancelButton = this.element.querySelector('#cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.close();
                this.emit('cancel');
            });
        }
        
        // Listen for updates from ChallengeManager (e.g., a challenge is completed while modal is open)
        this.challengeManager.on('challenge-completed', this.renderChallenges.bind(this));
        // Optional: Listen for reset if you want the modal to update immediately
        this.challengeManager.on('challenges-reset', this.renderChallenges.bind(this));
    }

    renderChallenges() {
        if (!this.challengeManager || !this.challengeListContainer) return;

        // --- Get and display counts ---
        const { completedCount, totalCount } = this.challengeManager.getChallengeCounts();
        const countElement = this.element.querySelector('#challenge-count');
        if (countElement) {
            countElement.textContent = `Completed: ${completedCount} / ${totalCount}`;
        }
        // --- End count display ---

        // Clear existing list items
        this.challengeListContainer.innerHTML = '';

        const challenges = this.challengeManager.getAllChallengesWithStatus();
        console.log("[ChallengeModal] Rendering challenges with statuses:", challenges); 

        challenges.forEach(challenge => {
            const listItem = document.createElement('li');
            listItem.classList.add('challenge-item');
             
            // === Focused Log ===
            console.log(`[ChallengeModal] Checking challenge: '${challenge.title}', isComplete = ${challenge.isComplete}`); 
            
            if (challenge.isComplete) {
                console.log(`[ChallengeModal]   -> Adding 'completed' class for '${challenge.title}'`);
                listItem.classList.add('completed');
            } else {
                console.log(`[ChallengeModal]   -> NOT adding 'completed' class for '${challenge.title}'`);
            }

            // Tooltip (using title attribute for simplicity first)
            const tooltipText = `${challenge.standard.code}: ${challenge.standard.description}`;
            // listItem.setAttribute('title', tooltipText);
            // listItem.setAttribute('data-tooltip', tooltipText); 
            // listItem.classList.remove('tooltip-trigger'); 

            const standardCodeText = challenge.standard.code;
            const standardDescriptionText = challenge.standard.description;
            // --- Remove DEBUG LOG --- 
            // console.log(`[ChallengeModal] For challenge '${challenge.title}', standardDescriptionText is:`, standardDescriptionText);
            // --- END DEBUG LOG ---

            // Ensure checkmark span is correctly structured
            listItem.innerHTML = `
                <span class="checkmark">✔</span>
                <span class="title">${challenge.title}</span>
                <span class="description">${challenge.description}</span>
                <div class="standard-container"> 
                    <span class="standard-code">NY state music standard: (${standardCodeText})</span>
                    <span class="standard-tooltip-trigger tooltip-trigger">&#9432;</span>
                </div>
            `;
            
            // Find the icon span and set data-tooltip using dataset API
            const iconSpan = listItem.querySelector('.standard-container .standard-tooltip-trigger');
            if (iconSpan) {
                iconSpan.dataset.tooltip = standardDescriptionText;
            }

            // NOTE: Setting innerHTML *after* adding the class might reset the class list!
            // Let's re-add the class *after* setting innerHTML.
            if (challenge.isComplete) { 
                listItem.classList.add('completed');
            }

            this.challengeListContainer.appendChild(listItem);
        });
        
        // Initialize tooltips if using a JS library or custom script
        // this.initializeTooltips(); 
    }
    
    // Optional: If using a JS tooltip library
    // initializeTooltips() {
    //     // Find all elements with tooltip triggers and initialize
    //     // Example using a hypothetical Tooltip.init() function
    //     this.element.querySelectorAll('.tooltip-trigger').forEach(el => {
    //         // new Tooltip(el, { placement: 'top' });
    //     });
    // }
} 