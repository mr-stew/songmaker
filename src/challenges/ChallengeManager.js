import { EventEmitter } from 'events';
import { bus } from 'data/EventBus'; // Assuming a shared event bus exists
import { challenges as challengeDefinitions } from './ChallengesData';
import * as validators from './ChallengeValidators';

const STORAGE_KEY = 'songMakerChallengeStatus';

// Define the required scales/subdivisions for exploration challenges
const REQUIRED_SCALES = new Set(['major', 'pentatonic', 'chromatic']);
// Assuming subdivision values can be 1, 2, 3, 4 - adjust if needed
const REQUIRED_SUBDIVISIONS = new Set([1, 2, 3, 4]); 

export class ChallengeManager extends EventEmitter {
    constructor(midiData, songOptions) {
        super();
        this.midiData = midiData;
        this.songOptions = songOptions;
        this.validators = validators;
        this.challenges = challengeDefinitions;
        this.completedChallenges = this.loadCompletionStatus();

        // --- State Tracking Properties ---
        this.lastValidatedTempo = songOptions.tempo;
        this.lastValidatedInstrument = songOptions.instrument;
        this.lastValidatedBars = songOptions.bars;
        this.lastValidatedScale = songOptions.scale;
        this.lastValidatedSubdivision = songOptions.subdivision;
        // Sets to track successful exploration steps (scale/subdivision changed AND notes exist)
        this.validatedScaleCreations = new Set();
        this.validatedSubdivisionCreations = new Set();
        // --- State for Change Instrument Challenge ---
        this._initInstrumentChangeState();
        // --- State for Extend Melody Challenge ---
        this._initExtendMelodyState();
        // Store initial state if notes exist
        if (this.midiData.instrument.length > 0) {
            this.validatedScaleCreations.add(songOptions.scale);
        }
        
        // Bind the validation function to ensure `this` context is correct
        // Pass event data along if available
        const boundValidate = (eventData = null) => this.validateChallenges(eventData);

        // Listen for changes in song options (tempo, scale, key, etc.) 
        // Settings changes don't pass event data relevant here
        this.songOptions.on('change', () => boundValidate()); 

        // Listen for changes in the musical content (notes added/removed)
        // Pass the event object from MidiTrack directly
        this.midiData.instrument.on('add', (event) => boundValidate({ type: 'note_add', track: 'instrument', data: event }));
        this.midiData.instrument.on('remove', (event) => boundValidate({ type: 'note_remove', track: 'instrument', data: event }));
        this.midiData.percussion.on('add', (event) => boundValidate({ type: 'note_add', track: 'percussion', data: event }));
        this.midiData.percussion.on('remove', (event) => boundValidate({ type: 'note_remove', track: 'percussion', data: event }));

        // Listen for generic changes (clear, replace) on MidiTrack
        // Pass a generic type
        this.midiData.instrument.on('changed', () => boundValidate({ type: 'track_changed', track: 'instrument' })); 
        this.midiData.percussion.on('changed', () => boundValidate({ type: 'track_changed', track: 'percussion' }));

        // Optional: Listen for history events if needed (might be redundant)
        // bus.on('history:pop:add', boundValidate);
        // bus.on('history:pop:remove', boundValidate);

        console.log("Challenge Manager Initialized. Completed:", this.completedChallenges);
        // Initial validation run in case the user loads a song that already completes a challenge
        this.validateChallenges();
    }

    // --- Helper to initialize/reset instrument change state ---
    _initInstrumentChangeState() {
        this.instrumentChangeChallengeState = {
            instrumentChanged: false, 
            changesSinceInstrumentChange: 0,
            initialInstrument: this.songOptions.instrument // Store the instrument at initialization
        };
    }

    // --- Helper to initialize/reset extend melody state ---
    _initExtendMelodyState() {
        this.extendMelodyState = {
            awaitingNoteInExtension: false,
            requiredOriginalEndTime: -1 // Time index where the new bars start
        };
    }

    loadCompletionStatus() {
        try {
            const savedStatus = localStorage.getItem(STORAGE_KEY);
            return savedStatus ? JSON.parse(savedStatus) : {};
        } catch (e) {
            console.error("Error loading challenge status:", e);
            return {};
        }
    }

    saveCompletionStatus() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.completedChallenges));
        } catch (e) {
            console.error("Error saving challenge status:", e);
        }
    }

    validateChallenges(eventInfo = null) { // Accept optional event info
        // console.log("Validating challenges... Event:", eventInfo);
        let newlyCompleted = false;
        let changeDetected = false; // Flag to track if any change happened this validation cycle

        // --- Store state from PREVIOUS validation BEFORE checking --- 
        const previousTempo = this.lastValidatedTempo;
        const previousInstrument = this.lastValidatedInstrument;
        const previousBars = this.lastValidatedBars;
        const previousScale = this.lastValidatedScale;
        const previousSubdivision = this.lastValidatedSubdivision;

        // --- Update Extend Melody State --- 
        if (this.songOptions.bars > previousBars) { // If bars increased this cycle
            console.log(`[ChallengeManager] Detected bar increase (${previousBars} -> ${this.songOptions.bars}). Setting awaitingNoteInExtension = true.`);
            this.extendMelodyState.awaitingNoteInExtension = true;
            // Calculate and store the end time of the original bars
            this.extendMelodyState.requiredOriginalEndTime = previousBars * this.songOptions.beats * this.songOptions.subdivision;
            console.log(`[ChallengeManager] Stored requiredOriginalEndTime: ${this.extendMelodyState.requiredOriginalEndTime}`);
        } else if (this.extendMelodyState.awaitingNoteInExtension && this.songOptions.bars < previousBars) {
            // If we were awaiting a note, but the user EXPLICITLY reduced the bars again, reset the state.
            console.log("[ChallengeManager] Bars DECREASED while awaiting note. Resetting extend melody state.");
             this._initExtendMelodyState();
        } else if (this.extendMelodyState.awaitingNoteInExtension) {
             console.log(`[ChallengeManager] Still awaiting note. State:`, JSON.stringify(this.extendMelodyState));
        }

        // --- Update Last Validated State NOW (for the *next* cycle) ---
        this.lastValidatedTempo = this.songOptions.tempo;
        this.lastValidatedInstrument = this.songOptions.instrument;
        this.lastValidatedBars = this.songOptions.bars;
        this.lastValidatedScale = this.songOptions.scale;
        this.lastValidatedSubdivision = this.songOptions.subdivision;
        // --- End State Update ---

        // --- Update Exploration History Based on Events ---
        if (eventInfo && eventInfo.type === 'note_add') {
            // Track Scale (only for instrument notes)
            if (eventInfo.track === 'instrument') {
                if (!this.validatedScaleCreations.has(this.songOptions.scale)) {
                     console.log(`[ChallengeManager] Instrument note added in scale '${this.songOptions.scale}'. Adding to validatedScaleCreations.`);
                     this.validatedScaleCreations.add(this.songOptions.scale);
                }
            }
            
            // Track Subdivision (for ANY note add - instrument or percussion)
            const currentSubdivision = parseInt(this.songOptions.subdivision, 10); // Ensure it's a number
            // Only add if it's a valid required subdivision and not already tracked
            if (!isNaN(currentSubdivision) && REQUIRED_SUBDIVISIONS.has(currentSubdivision) && !this.validatedSubdivisionCreations.has(currentSubdivision)) {
                console.log(`[ChallengeManager] Note added (${eventInfo.track}) with valid subdivision '${currentSubdivision}'. Adding to validatedSubdivisionCreations.`);
                this.validatedSubdivisionCreations.add(currentSubdivision);
            } else if (!isNaN(currentSubdivision) && !REQUIRED_SUBDIVISIONS.has(currentSubdivision)) {
                console.warn(`[ChallengeManager] Note added with unexpected subdivision '${currentSubdivision}'. Not adding to set.`);
            }
        }

        // --- Track if a change relevant to counting occurred ---
        // Compare CURRENT options with the PREVIOUS state we just stored
        if (this.songOptions.tempo !== previousTempo ||
            this.songOptions.instrument !== previousInstrument ||
            this.songOptions.bars !== previousBars ||
            this.songOptions.scale !== previousScale ||
            this.songOptions.subdivision !== previousSubdivision) {
            changeDetected = true;
        }
        // TODO: Need a better way to detect note add/remove for the counter
        // The event listeners trigger this function, but we need to know *if* 
        // it was specifically a note change event for the counter.
        // For now, any call to validateChallenges might increment the counter incorrectly.
        // A potential solution involves passing the event type or a flag from the listeners.

        // --- Update Instrument Change State ---
        const instrumentState = this.instrumentChangeChallengeState;
        // Check if the instrument changed from the *initial* one (if not already flagged)
        if (!instrumentState.instrumentChanged && 
            this.songOptions.instrument !== instrumentState.initialInstrument && 
            this.midiData.instrument.length > 0) { // Ensure melody exists when instrument changes
            instrumentState.instrumentChanged = true;
            instrumentState.changesSinceInstrumentChange = 0; // Reset counter on change
            changeDetected = true; // Instrument change counts as a change
            console.log("Instrument changed, tracking subsequent changes...");
        }
        // If instrument has changed and another change is detected, increment counter
        else if (instrumentState.instrumentChanged && changeDetected) {
            instrumentState.changesSinceInstrumentChange++;
            console.log(`Change detected after instrument change. Count: ${instrumentState.changesSinceInstrumentChange}`);
        }

        this.challenges.forEach(challenge => {
            // Only check challenges that are not already completed
            if (!this.completedChallenges[challenge.id]) {
                const validatorFn = this.validators[challenge.validator];
                if (typeof validatorFn === 'function') {
                    try {
                        let isComplete = false;
                        // Pass previous state based on validator name
                        switch (challenge.validator) {
                            case 'validateTempoChange':
                                isComplete = validatorFn(this.midiData, this.songOptions, previousTempo);
                                break;
                            case 'validateExtendMelody':
                                console.log("[ChallengeManager] Calling validateExtendMelody with state:", JSON.stringify(this.extendMelodyState), "Event:", eventInfo);
                                // Pass the dedicated state object AND the event info to the validator
                                isComplete = validatorFn(this.midiData, this.songOptions, this.extendMelodyState, eventInfo);
                                break;
                            case 'validateInstrumentChange':
                                // Pass the state object (which includes initial instrument)
                                isComplete = validatorFn(this.midiData, this.songOptions, instrumentState);
                                break;
                            case 'validateExploreScales':
                                // Pass the tracked set and required set
                                isComplete = validatorFn(this.midiData, this.songOptions, this.validatedScaleCreations, REQUIRED_SCALES);
                                break;
                            case 'validateExploreSubdivisions':
                                // Log set contents clearly
                                console.log(`[ChallengeManager] Checking Explore Subdivisions. Current Set Contents: [${Array.from(this.validatedSubdivisionCreations).join(', ')}] Required Set Contents: [${Array.from(REQUIRED_SUBDIVISIONS).join(', ')}]`);
                                // Pass the tracked set and required set
                                isComplete = validatorFn(this.midiData, this.songOptions, this.validatedSubdivisionCreations, REQUIRED_SUBDIVISIONS);
                                console.log(`[ChallengeManager] validateExploreSubdivisions result: ${isComplete}`);
                                break;
                            default:
                                // Default validators only need current state
                                isComplete = validatorFn(this.midiData, this.songOptions);
                                break;
                        }

                        if (isComplete) {
                            console.log(`Challenge Completed: ${challenge.title}`);
                            this.completedChallenges[challenge.id] = true;
                            this.emit('challenge-completed', challenge);
                            bus.emit('challenge-completed', challenge); // Also emit on global bus
                            newlyCompleted = true;

                            // --- Reset state for specific challenges upon completion ---
                            if (challenge.id === 'extend-melody' && isComplete) { // Only reset if completed
                                console.log("[ChallengeManager] extend-melody completed. Resetting state.");
                                this._initExtendMelodyState();
                            }
                            if (challenge.id === 'change-instrument' && isComplete) { // Only reset if completed
                                // Optionally reset instrument state here too, or let it persist
                                // console.log("[ChallengeManager] change-instrument completed. Resetting state.");
                                // this._initInstrumentChangeState();
                            }
                        }
                    } catch (error) {
                        console.error(`Error validating challenge ${challenge.id}:`, error);
                    }
                } else {
                    console.warn(`Validator function ${challenge.validator} not found for challenge ${challenge.id}`);
                }
            }
        });

        if (newlyCompleted) {
            this.saveCompletionStatus();
        }
    }

    getChallengeStatus(challengeId) {
        return !!this.completedChallenges[challengeId];
    }

    getAllChallengesWithStatus() {
        return this.challenges.map(challenge => ({
            ...challenge,
            isComplete: this.getChallengeStatus(challenge.id)
        }));
    }

    getChallengeCounts() {
        const totalCount = this.challenges.length;
        const completedCount = Object.keys(this.completedChallenges).length;
        return { completedCount, totalCount };
    }

    resetChallenges() {
        this.completedChallenges = {};
        this.saveCompletionStatus();
        this.validatedScaleCreations.clear();
        this.validatedSubdivisionCreations.clear();
        // Re-initialize state tracking based on current settings
        this.lastValidatedTempo = this.songOptions.tempo;
        this.lastValidatedInstrument = this.songOptions.instrument;
        this.lastValidatedBars = this.songOptions.bars;
        this.lastValidatedScale = this.songOptions.scale;
        this.lastValidatedSubdivision = this.songOptions.subdivision;
        // --- Reset instrument change state ---
        this._initInstrumentChangeState(); 
        // --- Reset extend melody state ---
        this._initExtendMelodyState();
        if (this.midiData.instrument.length > 0) {
            this.validatedScaleCreations.add(this.songOptions.scale);
        }
        
        this.emit('challenges-reset');
        bus.emit('challenges-reset');
        console.log("Challenge statuses reset.");
    }
} 