import { nameToScale } from 'data/ScaleMap';

/**
 * Validates if only 'so' (5th degree) and 'mi' (3rd degree) notes of the current scale are used.
 *
 * @param {MidiData} midiData - The current MIDI data containing instrument and percussion tracks.
 * @param {SongOptions} songOptions - The current song settings (key, scale, etc.).
 * @returns {boolean} True if the challenge is met, false otherwise.
 */
export function validateSoMiOnly(midiData, songOptions) {
    const scaleName = songOptions.scale;
    const rootNote = songOptions.rootNote;
    const scaleSteps = nameToScale(scaleName); // Gets intervals (e.g., Major: [0, 2, 4, 5, 7, 9, 11])

    if (!scaleSteps || scaleSteps.length < 5) {
        console.warn(`Scale "${scaleName}" not found or too short for so-mi validation.`);
        return false; // Cannot validate if scale doesn't have at least 5 notes (so = 5th degree)
    }

    // Find the MIDI interval numbers for 'mi' (3rd degree) and 'so' (5th degree)
    // Scale degrees are 1-based, array indices are 0-based.
    const miInterval = scaleSteps[2]; // 3rd degree
    const soInterval = scaleSteps[4]; // 5th degree

    let onlySoMiUsed = true;
    let noteFound = false;

    midiData.instrument.forEach(event => {
        noteFound = true; // Mark that we found at least one note
        const noteMidi = event.note;
        // Ensure rootNote is treated as the base for interval calculation
        const rootNoteMidi = songOptions.rootNote;
        const intervalFromRoot = (noteMidi - rootNoteMidi) % 12; 
        const normalizedInterval = (intervalFromRoot + 12) % 12; 

        // Check if the interval matches mi or so
        if (normalizedInterval !== miInterval && normalizedInterval !== soInterval) {
            onlySoMiUsed = false;
            // console.log(`Invalid note found: ${noteMidi}, Interval: ${normalizedInterval}, Expected: ${miInterval} or ${soInterval}`);
            // Exiting forEach early is not possible directly, but we can stop checking logic.
        }
    });
    
    // Check onlySoMiUsed status *after* the loop finishes
    return noteFound && onlySoMiUsed;
}

/**
 * Validates if the melody contains at least one upward and one downward motion.
 */
export function validateUpDownMelody(midiData, songOptions) {
    const notes = [];
    midiData.instrument.forEach(event => notes.push({ time: event.time, pitch: event.note }));
    
    // Need at least three notes for two movements
    if (notes.length < 3) return false; 
    
    // Sort notes by time
    notes.sort((a, b) => a.time - b.time);

    let upwardSteps = 0; // Count upward steps
    let downwardSteps = 0; // Count downward steps

    for (let i = 1; i < notes.length; i++) {
        const pitchDiff = notes[i].pitch - notes[i-1].pitch;
        if (pitchDiff > 0) {
            upwardSteps++;
        }
        if (pitchDiff < 0) {
            downwardSteps++;
        }
        // If enough steps found, no need to check further
        // Require at least 2 of each type of step
        if (upwardSteps >= 2 && downwardSteps >= 2) {
            console.log("[validateUpDownMelody] Found >= 2 upward and >= 2 downward steps. Challenge complete.");
            return true;
        }
    }
    
    console.log(`[validateUpDownMelody] Conditions not fully met. Upward: ${upwardSteps}, Downward: ${downwardSteps}`);
    return false; // Didn't find enough upward and downward motion
}

/**
 * Validates if the melody contains the scale degree sequence for "Rain Rain Go Away"
 * Target Sequence: 5 3 5 5 | 3 5 5 3 | 6 5 5 3
 * Checks only the sequence of scale degrees, ignoring rhythm.
 */
export function validateRecreateRainRain(midiData, songOptions) {
    // Target pattern of scale degrees
    const targetDegreeSequence = [5, 3, 5, 5, 3, 5, 5, 3, 6, 5, 5, 3];
    console.log("[RainRainValidator] Checking challenge..."); // Added log
    
    // Basic checks: Must be in Major scale
    if (songOptions.scale !== 'major') {
        console.log("[RainRainValidator] Failed: Scale is not Major (", songOptions.scale, ")"); // Added log
        return false;
    }
    
    const scale = nameToScale(songOptions.scale);
    if (!scale) {
        console.log("[RainRainValidator] Failed: Could not get scale steps for Major"); // Added log
        return false; // Should not happen if scale is major, but good practice
    }
    const rootNote = songOptions.rootNote;

    // Get user's notes, sorted by time
    const userNotes = [];
    midiData.instrument.forEach(event => {
        userNotes.push(event);
    });
    userNotes.sort((a, b) => a.time - b.time);

    // Extract the sequence of scale degrees from user's notes, ignoring duplicates at the same time
    const userDegreeSequence = [];
    let lastNoteTime = -1; // Initialize to a value no time can have
    userNotes.forEach(event => {
        // Only process if the time is different from the last processed note
        if (event.time !== lastNoteTime) {
            const interval = (event.note - rootNote + 12) % 12;
            const degreeIndex = scale.indexOf(interval);
            if (degreeIndex !== -1) { // Only consider notes within the scale
                userDegreeSequence.push(degreeIndex + 1); // 1-based degree
                lastNoteTime = event.time; // Update the time of the last added note
            }
        }
    });
    
    console.log("[RainRainValidator] Target Sequence:", targetDegreeSequence.join(' ')); // Added log
    console.log("[RainRainValidator] User Sequence:", userDegreeSequence.join(' ')); // Added log

    // Check if the user sequence is long enough
    if (userDegreeSequence.length < targetDegreeSequence.length) {
        console.log("[RainRainValidator] Failed: User sequence too short."); // Added log
        return false;
    }

    // Check if the target sequence exists as a subsequence in the user's sequence
    let foundMatch = false; // Added flag for final log
    for (let i = 0; i <= userDegreeSequence.length - targetDegreeSequence.length; i++) {
        let match = true;
        for (let j = 0; j < targetDegreeSequence.length; j++) {
            if (userDegreeSequence[i + j] !== targetDegreeSequence[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            foundMatch = true; // Found the target subsequence
            break; // Exit outer loop once match found
        }
    }

    console.log("[RainRainValidator] Match Found:", foundMatch); // Added log
    return foundMatch; // Return the result
}

/**
 * Validates if the melody matches "Doggy Doggy Where's Your Bone" 
 * G G E C | D D B G | G G E C | D B G - | (using scale degrees in C Major)
 * 5 5 3 1 | 2 2 7 5 | 5 5 3 1 | 2 7 5 - |
 */
export function validateFillDoggyDoggy(midiData, songOptions) {
    // Target pattern (Scale degrees relative to root)
    const targetPattern = [
        // Bar 1
        { time: 0, degree: 5 }, { time: 1, degree: 5 }, { time: 2, degree: 3 }, { time: 3, degree: 1 },
        // Bar 2
        { time: 4, degree: 2 }, { time: 5, degree: 2 }, { time: 6, degree: 7 }, { time: 7, degree: 5 }, 
        // Bar 3
        { time: 8, degree: 5 }, { time: 9, degree: 5 }, { time: 10, degree: 3 }, { time: 11, degree: 1 },
        // Bar 4
        { time: 12, degree: 2 }, { time: 13, degree: 7 }, { time: 14, degree: 5 } 
    ];

    // Basic checks: needs at least 4 bars, 4 beats, 2 subdivisions, Major scale
    // Adjust these checks if the target song requires different settings
     if (songOptions.bars < 4 || songOptions.beats !== 4 || songOptions.subdivision !== 2 || songOptions.scale !== 'major') {
        // console.log("Settings mismatch for Doggy Doggy");
        return false;
    }
    
    const scale = nameToScale(songOptions.scale);
    const rootNote = songOptions.rootNote;

    let noteCount = 0;
    let match = true;

    const userNotesMap = new Map(); // Store user notes by time
    midiData.instrument.forEach(event => {
        noteCount++;
        if (!userNotesMap.has(event.time)) {
            userNotesMap.set(event.time, []);
        }
        userNotesMap.get(event.time).push(event.note);
    });

    if (noteCount < targetPattern.length) return false; // Not enough notes

    for (const targetNote of targetPattern) {
        if (!userNotesMap.has(targetNote.time)) {
            match = false; // Missing note at target time
            // console.log(`Doggy Doggy: Missing note at time ${targetNote.time}`);
            break;
        }
        
        const notesAtTime = userNotesMap.get(targetNote.time);
        let foundDegreeMatch = false;
        for (const userNote of notesAtTime) {
            const interval = (userNote - rootNote + 12) % 12;
            const degreeIndex = scale.indexOf(interval);
             // Ensure degreeIndex is valid before calculating userDegree
            if (degreeIndex === -1) {
                 // console.log(`Doggy Doggy: Note ${userNote} at time ${targetNote.time} is not in the ${songOptions.scale} scale.`);
                 continue; // Skip notes not in the scale
            }
            const userDegree = degreeIndex + 1; // 1-based degree

            if (userDegree === targetNote.degree) {
                foundDegreeMatch = true;
                break; // Found a note with the correct scale degree at this time
            }
        }
        if (!foundDegreeMatch) {
            match = false; // No note with correct degree found at this time
            // console.log(`Doggy Doggy: Incorrect degree at time ${targetNote.time}. Expected ${targetNote.degree}`);
            break;
        }
    }

    // Optionally, check if there are *extra* notes not matching the pattern time slots
    // for (const time of userNotesMap.keys()) {
    //     if (!targetPattern.some(note => note.time === time)) {
    //         // Found a note at a time slot not in the target pattern
    //         // Depending on strictness, this could invalidate the match
    //         // match = false; 
    //         // break;
    //     }
    // }

    return match;
}

/**
 * Validates if the tempo has changed from a previous state.
 * NOTE: This validator currently CANNOT be fully implemented because it only
 * receives the current state. It requires the ChallengeManager (or caller) 
 * to provide the tempo *before* the potential change occurred.
 */
export function validateTempoChange(midiData, songOptions, previousTempo) {
    // Basic check: Make sure a melody exists before checking for tempo change
    if (midiData.instrument.length === 0 && midiData.percussion.length === 0) {
        return false;
    }
    // Check if the current tempo is different from the last validated tempo
    const tempoChanged = songOptions.tempo !== previousTempo;
    // console.log(`Validating Tempo Change: Current=${songOptions.tempo}, Previous=${previousTempo}, Changed=${tempoChanged}`);
    return tempoChanged; 
}

/**
 * Validates if a melody was extended AFTER the bars were increased.
 * Relies on state passed from ChallengeManager AND re-checks bar increase.
 * Also uses eventInfo to detect immediate note addition.
 */
export function validateExtendMelody(midiData, songOptions, extendMelodyState, eventInfo) {
    console.log(`[validateExtendMelody] Received state: ${JSON.stringify(extendMelodyState)}, Event: ${JSON.stringify(eventInfo)}`);
    // Condition 1: Manager must indicate we are expecting a note.
    if (!extendMelodyState.awaitingNoteInExtension) {
        console.log('[validateExtendMelody] Not awaiting note. Returning false.');
        return false;
    }

    // Condition 2: The note must exist at/after the required time.
    const requiredOriginalEndTime = extendMelodyState.requiredOriginalEndTime;
    console.log(`[validateExtendMelody] Awaiting note. Checking for notes >= time ${requiredOriginalEndTime}`);
    if (requiredOriginalEndTime < 0) { // Safety check
        console.error("[validateExtendMelody] Invalid requiredOriginalEndTime in state.");
        return false;
    }
    
    // Condition 2: Check for immediate note addition event
    if (eventInfo && eventInfo.type === 'note_add' && eventInfo.data && eventInfo.data.time >= requiredOriginalEndTime) {
        console.log(`[validateExtendMelody] Detected immediate note add event in extension at time ${eventInfo.data.time}. Challenge Complete!`);
        return true;
    }

    // Condition 3: Fallback - Check current midiData (might be stale)
    console.log(`[validateExtendMelody] No immediate event. Checking current midiData for notes >= time ${requiredOriginalEndTime}`);
    let noteFoundInExtension = false;
    midiData.instrument.forEach(event => {
        console.log(`[validateExtendMelody] Checking instrument note time ${event.time} against required time ${requiredOriginalEndTime}`);
        if (event.time >= requiredOriginalEndTime) {
            console.log(`[validateExtendMelody] Found valid instrument note at time ${event.time}`);
            noteFoundInExtension = true;
        }
    });
    if (!noteFoundInExtension) { // Check percussion only if not found in instrument
        midiData.percussion.forEach(event => {
             console.log(`[validateExtendMelody] Checking percussion note time ${event.time} against required time ${requiredOriginalEndTime}`);
            if (event.time >= requiredOriginalEndTime) {
                console.log(`[validateExtendMelody] Found valid percussion note at time ${event.time}`);
                noteFoundInExtension = true;
            }
        });
    }

    // Condition 3: Re-verify that the note was actually found.
    if (noteFoundInExtension) {
         console.log(`[validateExtendMelody] Found note in extension (time >= ${requiredOriginalEndTime}). Challenge Complete!`);
         return true; // Challenge is met
    } else {
        // If we are awaiting a note but didn't find one, keep waiting.
        console.log(`[validateExtendMelody] Awaiting note in extension (time >= ${requiredOriginalEndTime}), but none found yet.`);
         return false; // Keep challenge incomplete, manager state remains `awaitingNoteInExtension=true`
    }
}

/**
 * Validates if the instrument sound has changed.
 * NOTE: This validator currently CANNOT be fully implemented because it only
 * receives the current state. It requires the ChallengeManager (or caller) 
 * to provide the instrument *before* the potential change occurred.
 * UPDATE: Now receives the state object from ChallengeManager to track changes after instrument switch.
 */
export function validateInstrumentChange(midiData, songOptions, instrumentChangeState) {
     // Basic check: Make sure a melody exists before checking for instrument change
    if (midiData.instrument.length === 0) {
        return false;
    }

    // Check if the instrument has been changed AND at least 3 subsequent changes have been made
    const challengeComplete = instrumentChangeState.instrumentChanged && instrumentChangeState.changesSinceInstrumentChange >= 3;
    
    // console.log(`Validating Instrument Change: State=`, instrumentChangeState, `Complete=${challengeComplete}`);
    return challengeComplete; 
}

/**
 * Validates if there is at least one percussion note.
 */
export function validateSimpleRhythm(midiData, songOptions) {
    let noteFound = false;
    midiData.percussion.forEach(event => {
        noteFound = true;
        // No need to continue once one is found
    });
    return noteFound;
}

/**
 * Validates if there is at least one melody note AND one percussion note.
 */
export function validateCombineMelodyRhythm(midiData, songOptions) {
    let melodyNoteFound = false;
    midiData.instrument.forEach(event => {
        melodyNoteFound = true;
    });

    let percussionNoteFound = false;
    midiData.percussion.forEach(event => {
        percussionNoteFound = true;
    });

    return melodyNoteFound && percussionNoteFound;
}

/**
 * Validates if there are any simultaneous melody notes (simple harmony check).
 */
export function validateSimpleHarmony(midiData, songOptions) {
    const times = new Set();
    let harmonyFound = false;
    midiData.instrument.forEach(event => {
        if (times.has(event.time)) {
            harmonyFound = true;
             // Found two notes at the same time
        } else {
            times.add(event.time);
        }
    });
    return harmonyFound;
}

/**
 * Validates if the melody matches "Twinkle Twinkle Little Star" 
 * C C G G | A A G - | F F E E | D D C - | (using scale degrees in C Major)
 * 1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - |
 */
export function validateRecreateByEar(midiData, songOptions) {
    // Target pattern (Scale degrees relative to root)
    const targetPattern = [
        // Bar 1
        { time: 0, degree: 1 }, { time: 1, degree: 1 }, { time: 2, degree: 5 }, { time: 3, degree: 5 },
        // Bar 2
        { time: 4, degree: 6 }, { time: 5, degree: 6 }, { time: 6, degree: 5 }, 
        // Bar 3
        { time: 8, degree: 4 }, { time: 9, degree: 4 }, { time: 10, degree: 3 }, { time: 11, degree: 3 },
        // Bar 4
        { time: 12, degree: 2 }, { time: 13, degree: 2 }, { time: 14, degree: 1 } 
    ];

    // Basic checks: needs at least 4 bars, 4 beats, 2 subdivisions, Major scale
     if (songOptions.bars < 4 || songOptions.beats !== 4 || songOptions.subdivision !== 2 || songOptions.scale !== 'major') {
        // console.log("Settings mismatch for Twinkle Twinkle");
        return false;
    }

    const scale = nameToScale(songOptions.scale);
    const rootNote = songOptions.rootNote;

    let noteCount = 0;
    let match = true;

    const userNotesMap = new Map(); // Store user notes by time
    midiData.instrument.forEach(event => {
        noteCount++;
        if (!userNotesMap.has(event.time)) {
            userNotesMap.set(event.time, []);
        }
        userNotesMap.get(event.time).push(event.note);
    });

    if (noteCount < targetPattern.length) return false; // Not enough notes

    for (const targetNote of targetPattern) {
        if (!userNotesMap.has(targetNote.time)) {
            match = false; // Missing note at target time
            // console.log(`Twinkle Twinkle: Missing note at time ${targetNote.time}`);
            break;
        }
        
        const notesAtTime = userNotesMap.get(targetNote.time);
        let foundDegreeMatch = false;
        for (const userNote of notesAtTime) {
            const interval = (userNote - rootNote + 12) % 12;
            const degreeIndex = scale.indexOf(interval);
             if (degreeIndex === -1) {
                 // console.log(`Twinkle Twinkle: Note ${userNote} at time ${targetNote.time} is not in the ${songOptions.scale} scale.`);
                 continue; 
             }
            const userDegree = degreeIndex + 1; // 1-based degree

            if (userDegree === targetNote.degree) {
                foundDegreeMatch = true;
                break; 
            }
        }
        if (!foundDegreeMatch) {
            match = false; // No note with correct degree found at this time
            // console.log(`Twinkle Twinkle: Incorrect degree at time ${targetNote.time}. Expected ${targetNote.degree}`);
            break;
        }
    }
    
    return match;
}

/**
 * Validates if the user explored different scales and created melodies within them.
 * NOTE: This validator currently CANNOT be fully implemented because it only
 * receives the current state. It requires the ChallengeManager (or caller) 
 * to track which scales were selected AND that notes were added *while* those scales were active.
 */
export function validateExploreScales(midiData, songOptions, validatedScaleCreations, requiredScales) {
    // console.log(`Validating Explore Scales: Validated Creations =`, validatedScaleCreations);
    // Check if the set of validated scale creations contains all required scales
    if (requiredScales.size === 0) return true; // No scales required?
    
    let allRequiredFound = true;
    requiredScales.forEach(reqScale => {
        if (!validatedScaleCreations.has(reqScale)) {
            allRequiredFound = false;
        }
    });
    
    // console.log(`Validating Explore Scales: All Required Found = ${allRequiredFound}`);
    return allRequiredFound;
}

/**
 * Validates if the user explored different subdivisions and created rhythms within them.
 * NOTE: This validator currently CANNOT be fully implemented because it only
 * receives the current state. It requires the ChallengeManager (or caller) 
 * to track which subdivisions were selected AND that percussion notes were added *while* those subdivisions were active.
 */
export function validateExploreSubdivisions(midiData, songOptions, validatedSubdivisionCreations, requiredSubdivisions) {
    // console.log(`Validating Explore Subdivisions: Validated Creations =`, validatedSubdivisionCreations);
    // Check if the set of validated subdivision creations contains all required subdivisions
    if (requiredSubdivisions.size === 0) return true; // No subdivisions required?

    let allRequiredFound = true;
    requiredSubdivisions.forEach(reqSub => {
        if (!validatedSubdivisionCreations.has(reqSub)) {
            allRequiredFound = false;
        }
    });

    // console.log(`Validating Explore Subdivisions: All Required Found = ${allRequiredFound}`);
    return allRequiredFound;
}

/**
 * Validates if the melody contains exactly 3 unique pitches.
 *
 * @param {MidiData} midiData - The current MIDI data containing instrument and percussion tracks.
 * @param {SongOptions} songOptions - The current song settings.
 * @returns {boolean} True if the challenge is met, false otherwise.
 */
export function validateUniqueNoteCount(midiData, songOptions) {
    const uniquePitches = new Set();

    midiData.instrument.forEach(event => {
        uniquePitches.add(event.note);
    });

    // Check if the number of unique pitches is exactly 3
    return uniquePitches.size === 3;
}

/**
 * Validates if the melody is symmetrical (reads the same forwards and backwards).
 * Compares notes at time `t` with notes at `maxTime - 1 - t`.
 */
export function validateSymmetryHorizontal(midiData, songOptions) {
    // Need at least one note to be symmetrical
    if (midiData.instrument.timeline.length === 0) {
        return false;
    }

    const maxTime = songOptions.bars * songOptions.beats * songOptions.subdivision;
    const melodyGrid = new Map();

    // Populate grid map (time -> Set of pitches)
    midiData.instrument.forEach(event => {
        if (!melodyGrid.has(event.time)) {
            melodyGrid.set(event.time, new Set());
        }
        melodyGrid.get(event.time).add(event.note);
    });

    // Helper function to compare two sets
    function compareSets(setA, setB) {
        if (setA.size !== setB.size) return false;
        // Convert to sorted arrays for comparison
        const arrA = Array.from(setA).sort((a, b) => a - b);
        const arrB = Array.from(setB).sort((a, b) => a - b);
        for (let i = 0; i < arrA.length; i++) {
            if (arrA[i] !== arrB[i]) return false;
        }
        return true;
    }

    // Check for symmetry
    // Iterate only up to half the duration (floor handles the middle column if maxTime is odd)
    for (let t = 0; t < Math.floor(maxTime / 2); t++) {
        const notesAtT = melodyGrid.get(t) || new Set();
        const mirroredTime = maxTime - 1 - t;
        const notesAtMirroredT = melodyGrid.get(mirroredTime) || new Set();

        if (!compareSets(notesAtT, notesAtMirroredT)) {
            // console.log(`[validateSymmetryHorizontal] Asymmetry found at time ${t} vs ${mirroredTime}`);
            return false; // Not symmetrical
        }
    }

    // If loop completes, it's symmetrical
    // console.log("[validateSymmetryHorizontal] Melody appears symmetrical.");
    return true; 
}

// --- Add other validation functions here ---
/*
export function validateUpwardDownward(midiData, songOptions) {
    // TODO: Implement logic to check for upward/downward melodic movement
    return false;
}

export function validateTempoChange(midiData, songOptions, originalTempo) {
    // TODO: Requires storing the original tempo before the change
    return songOptions.tempo !== originalTempo;
}
*/

// --- Add other validation functions here --- 