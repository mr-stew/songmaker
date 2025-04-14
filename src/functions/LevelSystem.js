import { EventEmitter } from 'events';

// --- Configuration for Scaling Levels --- 
const BASE_POINTS = 100; // Points needed for level 1 -> 2
const SCALING_FACTOR = 1.25; // Each level threshold is 25% higher than the previous one

export class LevelSystem extends EventEmitter {
    constructor(initialPoints = 0, initialLevel = 1, initialEnabled = true) {
        super();
        this._points = initialPoints;
        // Ensure level is at least 1, even if saved data was corrupted
        this._level = Math.max(1, initialLevel); 
        this._enabled = initialEnabled;
        // Calculate initial progress based on loaded data
        this.recalculateProgress(); 
    }

    // --- Getter for enabled state --- 
    get enabled() {
        return this._enabled;
    }

    // --- Method to set enabled state and emit event --- 
    setEnabled(isEnabled) {
        if (typeof isEnabled !== 'boolean') return;
        const changed = this._enabled !== isEnabled;
        this._enabled = isEnabled;
        if (changed) {
            this.emit('levels-toggled', this._enabled);
            // Optionally save state immediately when toggled
            // this.emit('state-needs-save'); // Or trigger save directly if Main.js listens
        }
    }

    // --- Helper to calculate points threshold for a specific level --- 
    calculateNextLevelThreshold(level) {
        // Ensure level is at least 1 for calculation
        const effectiveLevel = Math.max(1, level);
        // Round to avoid fractional points thresholds
        return Math.round(BASE_POINTS * Math.pow(SCALING_FACTOR, effectiveLevel - 1));
    }

    // --- Helper to calculate total points needed to REACH a specific level --- 
    calculateTotalPointsForLevel(targetLevel) {
        let total = 0;
        // Sum thresholds for all levels *before* the target level
        for (let i = 1; i < targetLevel; i++) {
            total += this.calculateNextLevelThreshold(i);
        }
        return total;
    }

    // --- Recalculates progress based on current _points and _level --- 
    recalculateProgress() {
        const totalPointsNeededForCurrentLevel = this.calculateTotalPointsForLevel(this._level);
        this._pointsForNextLevel = this.calculateNextLevelThreshold(this._level);
        this._pointsInCurrentLevel = this._points - totalPointsNeededForCurrentLevel;

        // Sanity check 1: Ensure pointsInCurrentLevel isn't negative
        if (this._pointsInCurrentLevel < 0) {
             console.warn(`Level state inconsistency: Points (${this._points}) too low for level (${this._level}). Resetting progress in level.`);
             this._pointsInCurrentLevel = 0;
             // Optional: Adjust total points to match the start of the current level
             // this._points = totalPointsNeededForCurrentLevel; 
        }
        
        // Sanity check 2: Ensure level is correct for the points (in case of loading bad/old data)
        // Keep leveling up if current points exceed threshold for the current level
        while (this._pointsInCurrentLevel >= this._pointsForNextLevel && this._level < 999) { // Added a safety break
            console.warn(`Level state inconsistency: Points (${this._points}) exceed threshold for level (${this._level}). Adjusting level upwards.`);
            this._level++;
            // Recalculate based on the *new* level
            const newTotalPointsNeeded = this.calculateTotalPointsForLevel(this._level);
            this._pointsForNextLevel = this.calculateNextLevelThreshold(this._level);
            this._pointsInCurrentLevel = this._points - newTotalPointsNeeded;
        }
    }

    get points() {
        return this._points;
    }

    get level() {
        return this._level;
    }

    get pointsInCurrentLevel() {
        // Ensure we don't display negative progress if a sanity check adjusted it internally
        return Math.max(0, this._pointsInCurrentLevel); 
    }

    get pointsForNextLevel() {
        return this._pointsForNextLevel;
    }

    /**
     * Adds points and checks for level ups.
     * @param {number} amount - The number of points to add.
     * @param {string} source - Optional description of where the points came from (e.g., 'composition', 'badge', 'challenge').
     */
    addPoints(amount, source = 'unknown') {
        // --- Check if system is enabled --- 
        if (!this._enabled || amount <= 0) return;

        this._points += amount;
        this._pointsInCurrentLevel += amount; // Add to current level progress first

        let leveledUp = false;
        // --- Use calculated threshold for level up check --- 
        while (this._pointsInCurrentLevel >= this._pointsForNextLevel) {
            this._pointsInCurrentLevel -= this._pointsForNextLevel; // Subtract the threshold just passed
            this._level++;
            // --- Update threshold for the new level --- 
            this._pointsForNextLevel = this.calculateNextLevelThreshold(this._level); 
            leveledUp = true;
            this.emit('level-up', { newLevel: this._level, source });
        }

        this.emit('points-update', {
            added: amount,
            totalPoints: this._points,
            pointsInCurrentLevel: this.pointsInCurrentLevel, // Use the getter to ensure non-negative
            pointsForNextLevel: this._pointsForNextLevel,
            level: this._level,
            source: source,
            leveledUp: leveledUp // Indicate if a level up occurred in this update
        });
    }

    toJSON() {
        return {
            points: this._points,
            level: this._level,
            enabled: this._enabled // --- Include enabled state --- 
        };
    }

    fromJSON(data) {
        this._points = data.points || 0;
        // Ensure loaded level is at least 1
        this._level = Math.max(1, data.level || 1);
        // --- Load enabled state (default to true if not found) --- 
        this._enabled = typeof data.enabled === 'boolean' ? data.enabled : true; 
        // Recalculate derived stats based on loaded points/level
        this.recalculateProgress(); 
        // Emit an update so UI can refresh if needed after loading state
        this.emit('state-loaded'); 
    }

    // --- Add reset method --- 
    reset() {
        this._points = 0;
        this._level = 1;
        // Keep enabled state as it was, or reset it too?
        // Let's keep it as is for now.
        // this._enabled = true;
        
        this.recalculateProgress(); // Update derived values

        // Emit event to notify UI and trigger save
        this.emit('points-update', { 
            added: 0, // Indicate no points added, just a state reset
            totalPoints: this._points,
            pointsInCurrentLevel: this.pointsInCurrentLevel,
            pointsForNextLevel: this._pointsForNextLevel,
            level: this._level,
            source: 'reset',
            leveledUp: false
        });
        this.emit('state-reset'); // Specific event for reset
        console.log("Level system reset.");
    }
} 