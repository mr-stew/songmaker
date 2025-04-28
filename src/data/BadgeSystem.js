import { EventEmitter } from 'events'
import { nameToScale } from 'data/ScaleMap'

// Badge definitions with metadata - REMOVED exporter, dailyCreator, rhythmVariety
const BADGES = {
    firstComposition: {
        id: 'firstComposition',
        name: 'First Composition',
        description: 'Create and save your first song', // Note: save might still be tied to cloud save simulation
        icon: '🎵'
    },
    scaleExplorer: {
        id: 'scaleExplorer',
        name: 'Scale Explorer',
        description: 'Create songs using all three scales (Major, Pentatonic, Chromatic)',
        icon: '🔍'
    },
    noteCompletionist: {
        id: 'noteCompletionist',
        name: 'Note Completionist',
        description: 'Use all available notes in a single composition',
        icon: '✓'
    },
    percussionMaster: {
        id: 'percussionMaster',
        name: 'Percussion Master',
        description: 'Utilize both percussion tracks in a composition',
        icon: '🥁'
    },
    durationAchievement: {
        id: 'durationAchievement',
        name: 'Duration Achievement',
        description: 'Create songs of different lengths (1, 4, 8, and 16 bars)',
        icon: '⏱️'
    },
    difficultyPioneer: {
        id: 'difficultyPioneer',
        name: 'Difficulty Pioneer',
        description: 'Create songs at all three difficulty levels',
        icon: '🏆'
    },
    instrumentCollector: {
        id: 'instrumentCollector',
        name: 'Instrument Collector',
        description: 'Create songs using each available instrument', // Needs check for 5 instruments
        icon: '🎹'
    },
    firstChallenge: {
        id: 'firstChallenge',
        name: 'First Steps',
        description: 'Completed your first Song Maker challenge!',
        icon: '⭐'
    }
};

export class BadgeSystem extends EventEmitter {
    constructor() {
        super();
        console.log("[BadgeSystem] Constructor started."); // Keep existing logs for now

        // Initialize badge storage
        this.enabled = this.loadBadgePreference();
        this.earnedBadges = this.loadEarnedBadges();
        this.progressData = this.loadProgressData();
        console.log("[BadgeSystem] Loaded progressData:", this.progressData);

        // Initialize tracking variables - ONLY for remaining badges
        this.usedScales = new Set(this.progressData.usedScales || []);
        this.usedDurations = new Set(this.progressData.usedDurations || []);
        this.usedDifficulties = new Set(this.progressData.usedDifficulties || []);
        this.usedInstruments = new Set(this.progressData.usedInstruments || []);
        console.log("[BadgeSystem] Initialized usedScales:", this.usedScales); // Keep log
    }

    // Load/save functions for badge state (with error handling)
    loadBadgePreference() {
        try {
            return localStorage.getItem('badges_enabled') !== 'false';
        } catch (e) { console.error("Error reading badge preference:", e); return true; }
    }
    saveBadgePreference() {
        try { localStorage.setItem('badges_enabled', this.enabled); } catch (e) { console.error("Error saving badge preference:", e); }
    }
    loadEarnedBadges() {
        try {
            const savedBadges = localStorage.getItem('earned_badges');
            return savedBadges ? JSON.parse(savedBadges) : [];
        } catch (e) { console.error("Error loading/parsing earned badges:", e); return []; }
    }
    saveEarnedBadges() {
        try { localStorage.setItem('earned_badges', JSON.stringify(this.earnedBadges)); } catch (e) { console.error("Error saving earned badges:", e); }
    }
    loadProgressData() {
        try {
            const savedProgress = localStorage.getItem('badge_progress');
            return savedProgress ? JSON.parse(savedProgress) : {};
        } catch (e) { console.error("Error loading/parsing badge progress:", e); return {}; }
    }
    saveProgressData() {
        console.log("[BadgeSystem] saveProgressData called."); // Keep log
        try {
            // Save ONLY state for remaining badges
            const progressData = {
                usedScales: Array.from(this.usedScales),
                usedDurations: Array.from(this.usedDurations),
                usedDifficulties: Array.from(this.usedDifficulties),
                usedInstruments: Array.from(this.usedInstruments)
            };
            localStorage.setItem('badge_progress', JSON.stringify(progressData));
            console.log("[BadgeSystem] Saved progress data:", progressData); // Keep log
        } catch (e) { console.error("Error saving badge progress:", e); }
    }

    // Toggle badge system on/off
    toggleBadges(enabled) {
        this.enabled = enabled;
        this.saveBadgePreference();
        this.emit('badges-toggled', enabled);
    }

    // Award a specific badge if not already earned
    awardBadge(badgeId) {
        console.log(`[BadgeSystem] Attempting to award badge: ${badgeId}`); // Keep log
        // Specific log for firstComposition
        if (badgeId === 'firstComposition') {
             console.log("[BadgeSystem] awardBadge called for firstComposition.");
        }
        if (!this.enabled) {
            console.log(`[BadgeSystem] Awarding failed for ${badgeId}: Badges disabled.`); // Keep log
            return false;
        }
        // Ensure the badge ID exists in our definitions before awarding
        if (!BADGES[badgeId]) {
             console.warn(`[BadgeSystem] Awarding failed: Badge ID "${badgeId}" not defined.`);
             return false;
        }
        if (this.hasBadge(badgeId)) {
            console.log(`[BadgeSystem] Awarding failed for ${badgeId}: Badge already earned.`); // Keep log
            return false;
        }

        console.log(`[BadgeSystem] Awarding badge: ${badgeId}`); // Keep log
        this.earnedBadges.push(badgeId);
        this.saveEarnedBadges(); // Save immediately
        this.emit('badge-earned', BADGES[badgeId]);
        return true;
    }

    // Get all badge definitions (now returns only the 7/8 defined ones)
    getAllBadges() {
        return Object.values(BADGES);
    }

    // Get earned badges with details
    getEarnedBadges() {
        // Filter out any potentially invalid IDs that might be in storage somehow
        return this.earnedBadges
                   .filter(id => BADGES[id]) // Ensure badge exists
                   .map(id => BADGES[id]);
    }

    // Check if a specific badge has been earned
    hasBadge(badgeId) {
        const earned = this.earnedBadges.includes(badgeId);
        return earned;
    }

    // Track song creation and check for badges
    trackSongCreated(songOptions, midiData) {
        console.log("[BadgeSystem] trackSongCreated called."); // Keep log
        if (!this.enabled) {
            console.log("[BadgeSystem] Badges are disabled, skipping checks."); // Keep log
            return;
        }
        console.log("[BadgeSystem] Badges enabled, proceeding with checks."); // Keep log
        // Keep logs for debugging state
        console.log("[BadgeSystem] Current songOptions:", songOptions);
        console.log("[BadgeSystem] midiData.instrument.timeline.notes before checks:", midiData?.instrument?.timeline?.notes);
        console.log("[BadgeSystem] midiData.percussion.timeline.notes before checks:", midiData?.percussion?.timeline?.notes);
        console.log("[BadgeSystem] Earned badges before checks:", JSON.stringify(this.earnedBadges));

        // --- Checks for Remaining Badges ---

        // Track scale used
        this.usedScales.add(songOptions.scale);
        console.log(`[BadgeSystem] Added scale: ${songOptions.scale}. Used scales:`, Array.from(this.usedScales));
        if (this.usedScales.size >= 3 && !this.hasBadge('scaleExplorer')) {
            console.log("[BadgeSystem] Checking for badge: scaleExplorer");
            this.awardBadge('scaleExplorer');
        }

        // Track song duration
        this.usedDurations.add(songOptions.bars);
        console.log(`[BadgeSystem] Added duration: ${songOptions.bars}. Used durations:`, Array.from(this.usedDurations));
        // Ensure check uses correct 4 required values
        if (this.usedDurations.has(1) &&
            this.usedDurations.has(4) &&
            this.usedDurations.has(8) &&
            this.usedDurations.has(16) &&
            !this.hasBadge('durationAchievement')) {
            console.log("[BadgeSystem] Checking for badge: durationAchievement");
            this.awardBadge('durationAchievement');
        }

        // Track difficulty level
        this.usedDifficulties.add(songOptions.difficulty);
        console.log(`[BadgeSystem] Added difficulty: ${songOptions.difficulty}. Used difficulties:`, Array.from(this.usedDifficulties));
        if (this.usedDifficulties.size >= 3 && !this.hasBadge('difficultyPioneer')) {
            console.log("[BadgeSystem] Checking for badge: difficultyPioneer");
            this.awardBadge('difficultyPioneer');
        }

        // Track instrument used (Check for 5 instruments)
        this.usedInstruments.add(songOptions.instrument);
        console.log(`[BadgeSystem] Added instrument: ${songOptions.instrument}. Used instruments:`, Array.from(this.usedInstruments));
        if (this.usedInstruments.size >= 5 && !this.hasBadge('instrumentCollector')) { // Corrected size check to 5
            console.log("[BadgeSystem] Checking for badge: instrumentCollector");
            this.awardBadge('instrumentCollector');
        }

        // Check if all notes in scale are used
        console.log("[BadgeSystem] Calling checkNoteCompletionist");
        this.checkNoteCompletionist(songOptions, midiData);

        // Check for percussion master badge
        console.log("[BadgeSystem] Calling checkPercussionMaster");
        this.checkPercussionMaster(midiData);

        // Save updated progress for remaining badges
        console.log("[BadgeSystem] Saving progress data after checks."); // Keep log
        this.saveProgressData();
    }

    // Check if all available notes in the current scale were used
    checkNoteCompletionist(songOptions, midiData) {
        console.log("[BadgeSystem] checkNoteCompletionist running..."); // Keep log
        if (this.hasBadge('noteCompletionist')) {
             console.log("[BadgeSystem] Note Completionist already earned.");
             return;
        }

        const scale = nameToScale(songOptions.scale);
        if (!scale) {
            console.log("[BadgeSystem] Note Completionist check skipped: Invalid scale.");
             return;
        }
        const notesInScale = new Set();
        const usedNotes = new Set();

        // Calculate all notes required for the current scale/octave range
        for (let octave = 0; octave < songOptions.octaves; octave++) {
            for (const noteOffset of scale) {
                notesInScale.add(songOptions.rootNote + noteOffset + (octave * 12));
            }
        }
        console.log("[BadgeSystem] Required notes for completion:", Array.from(notesInScale).sort((a, b) => a - b)); // Log required notes

        // Get notes currently used in the instrument track
        if (!midiData || !midiData.instrument || midiData.instrument.length === 0) {
            console.log("[BadgeSystem] Note Completionist check skipped: No instrument notes found.");
            return; // Cannot complete if there are no notes
        }
        midiData.instrument.forEach(event => { usedNotes.add(event.note); });
        console.log("[BadgeSystem] Used instrument notes:", Array.from(usedNotes).sort((a, b) => a - b)); // Keep log

        // Check if all required notes are present in the used notes
        let allUsed = true;
        if (notesInScale.size === 0) {
             console.log("[BadgeSystem] Note Completionist check: No notes required for this scale/octave setup.");
             allUsed = false; // Cannot complete if no notes are required
        } else {
            for (const note of notesInScale) {
                if (!usedNotes.has(note)) {
                    console.log(`[BadgeSystem] Note Completionist check: Missing required note ${note}`);
                    allUsed = false;
                    break; // No need to check further
                }
            }
        }

        if (allUsed) {
            console.log("[BadgeSystem] Note Completionist requirements met. Awarding badge.");
            this.awardBadge('noteCompletionist');
        } else {
            console.log("[BadgeSystem] Note Completionist requirements not met.");
        }
    }

    // Check if both percussion tracks are used
    checkPercussionMaster(midiData) {
        console.log("[BadgeSystem] checkPercussionMaster running..."); // Keep log
        if (this.hasBadge('percussionMaster')) { /* ... log and return ... */ return; }

        if (!midiData || !midiData.percussion) { /* ... log and return ... */ return; }

        const usedPercussionNotes = new Set();
        midiData.percussion.forEach(event => { usedPercussionNotes.add(event.note); });

        console.log(`[BadgeSystem] checkPercussionMaster: Unique percussion notes used: ${Array.from(usedPercussionNotes)}. Set size: ${usedPercussionNotes.size}`); // Keep log

        if (usedPercussionNotes.size >= 2) { /* ... log and award ... */ this.awardBadge('percussionMaster'); }
        else { /* ... log not met ... */ }
    }

    // Reset all earned badges and progress (for testing)
    resetAllBadges() {
        console.log("[BadgeSystem] resetAllBadges called."); // Keep log
        this.earnedBadges = [];
        // Clear state ONLY for remaining badges
        this.usedScales.clear();
        this.usedDurations.clear();
        this.usedDifficulties.clear();
        this.usedInstruments.clear();

        this.saveEarnedBadges();
        this.saveProgressData();
        this.emit('badges-reset');
        console.log("[BadgeSystem] \'badges-reset\' event emitted.");
        console.log("[BadgeSystem] All badge progress reset."); // Keep log
    }
} 