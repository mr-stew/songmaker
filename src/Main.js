import 'style/main.scss'

///////////////////////////////////////////////////////////////////////////////
// EMBED ONLY
///////////////////////////////////////////////////////////////////////////////
const embedId = window.location.pathname.indexOf('/embed/') > -1 ? window.location.pathname.match(/\/[0-9]+/i)[0].substr(1) : false
if (embedId) {
    document.body.classList.add('embed-only')
}

///////////////////////////////////////////////////////////////////////////////
// EMBED ONLY
///////////////////////////////////////////////////////////////////////////////
const songId = window.location.pathname.indexOf('/song/') > -1 ? window.location.pathname.match(/\/[0-9]+/i)[0].substr(1) : false


///////////////////////////////////////////////////////////////////////////////
// MODEL
///////////////////////////////////////////////////////////////////////////////

import { bus } from 'data/EventBus'
import { SongOptions } from 'data/SongOptions'
import { MidiData } from 'midi/Data'
import { History } from 'history/History'
import { BadgeSystem } from 'data/BadgeSystem'
import { LevelSystem } from 'functions/LevelSystem'
import { ChallengeManager } from './challenges/ChallengeManager'

new History()
const songOptions = new SongOptions()
const midiData = new MidiData()
const badgeSystem = new BadgeSystem()
const levelSystem = new LevelSystem()
const challengeManager = new ChallengeManager(midiData, songOptions)

// --- Load LevelSystem state from localStorage --- 
try {
    const savedLevelState = localStorage.getItem('songMakerLevelState');
    if (savedLevelState) {
        levelSystem.fromJSON(JSON.parse(savedLevelState));
    }
    // --- Apply initial enabled state to UI (if needed) --- 
    // This assumes TopBar will hide/show itself based on the initial state.
    // No explicit call here, TopBar should handle it on init/event.
} catch (e) {
    console.error("Error loading level state:", e);
}

// --- Save LevelSystem state whenever it updates --- 
const saveLevelState = () => {
    try {
        localStorage.setItem('songMakerLevelState', JSON.stringify(levelSystem.toJSON()));
    } catch (e) {
        console.error("Error saving level state:", e);
    }
};
levelSystem.on('points-update', saveLevelState);
// --- Save state when toggled as well --- 
levelSystem.on('levels-toggled', saveLevelState);

// --- Function to show Level Up Animation --- 
function showLevelUpAnimation(level) {
    const animationElement = document.createElement('div');
    animationElement.id = 'level-up-animation';
    animationElement.innerHTML = `
        <span class="level-up-text">Level Up!</span>
        <span class="level-up-number">${level}</span>
    `;
    document.body.appendChild(animationElement);

    // Trigger the animation by adding a class
    // Use requestAnimationFrame to ensure the element is in the DOM before adding the class
    requestAnimationFrame(() => {
         animationElement.classList.add('show');
    });

    // Remove the element after the animation completes
    setTimeout(() => {
        animationElement.remove();
    }, 2500); // Duration should match CSS animation
}

// --- Listen for level-up events --- 
levelSystem.on('level-up', (data) => {
    showLevelUpAnimation(data.newLevel);
    // Optional: Add a sound effect here too?
    // sound.playLevelUpSound();
});

songOptions.on('load-success', () => {
    //sound.options.changeInstrument()
    if (modals.loading) {
        modals.loading.close('sampler')
        if (!embedId && !songId) {
            modals.loading.close('grid')
        }
    }
})


///////////////////////////////////////////////////////////////////////////////
// MODALS (loading, so putting at top)
///////////////////////////////////////////////////////////////////////////////

import { LoadingModal } from 'modal/Loading'
const modals = {}
modals.loading = new LoadingModal()

///////////////////////////////////////////////////////////////////////////////
// BADGE NOTIFICATION
///////////////////////////////////////////////////////////////////////////////

// Create badge notification element
const badgeNotification = document.createElement('div')
badgeNotification.className = 'badge-notification'
document.body.appendChild(badgeNotification)

// Listen for badge earned events
badgeSystem.on('badge-earned', badge => {
    badgeNotification.innerHTML = `
        <div class="badge-notification-icon">${badge.icon}</div>
        <div class="badge-notification-content">
            <h3>Badge Earned: ${badge.name}</h3>
            <p>${badge.description}</p>
        </div>
    `
    
    badgeNotification.classList.add('show')
    
    // --- Award points for earning a badge --- 
    if (levelSystem) {
        levelSystem.addPoints(50, `badge: ${badge.id || 'unknown'}`); // Award 50 points per badge
    }

    // Hide after 3 seconds
    setTimeout(() => {
        badgeNotification.classList.remove('show')
    }, 3000)
})

///////////////////////////////////////////////////////////////////////////////
// SOUND
///////////////////////////////////////////////////////////////////////////////

import { Sound } from 'sound/Sound'

const sound = new Sound(songOptions, midiData)

sound.on('export-start', () => {
    topBar.modals.share.exportStart()
})
sound.on('export-complete', () => {
    topBar.modals.share.exportEnd()
})

///////////////////////////////////////////////////////////////////////////////
// GRID UI
///////////////////////////////////////////////////////////////////////////////

import { Grid } from 'grid/Grid'

const grid = new Grid(document.body, songOptions, midiData, sound, !!embedId, levelSystem)
// grid.fitBars()
grid.instrument.on('add', note => {
    sound.resumeContext()
    sound.instrumentTrack.playNote(note, undefined, undefined, 0.8)
})
grid.percussion.on('add', note => {
    sound.resumeContext()
    sound.percussionTrack.playNote(note, undefined, undefined, 0.8)
})
grid.on('load-success', () => {
    if (modals.loading) {
        modals.loading.close('grid')
    }
})


///////////////////////////////////////////////////////////////////////////////
// INPUT
///////////////////////////////////////////////////////////////////////////////

import { InputManager } from 'input/Manager'
const inputManager = new InputManager()
inputManager.registerInstrument(grid.percussion)
inputManager.registerInstrument(grid.instrument, true)
inputManager.on('select', pos => grid.select(pos))
inputManager.on('outofbounds', () => {
    grid.flashSelector()
    sound.bump()
})
inputManager.on('play-delete-sound', () => sound.playDelete())
inputManager.on('song-changed', () => onSongChanged())

function onSongChanged() {
    bottom.songChanged = true
    if (midiData.instrument.timeline._length + midiData.percussion.timeline._length < 1) {
        bottom.disableSaveButton(true)
    } else {
        bottom.disableSaveButton(false)
    }
}

function onSettingsUpdate(options, clear = false) {
    let prevOptions = songOptions.toJSON()
    bus.emit('history:push', {
        type: 'save',
        options: prevOptions,
        timelines: midiData.timelines,
    })
    if (clear) midiData.clear()
    midiData.morph(options, prevOptions)
    songOptions.fromJSON(options)
    sound.syncWithMidiTrack()
    cloud.clear()
}

// REGULAR KEYBOARD
import { KeyboardInput } from 'input/Keyboard'
new KeyboardInput(inputManager)

// MIDI Keyboard
import { Keyboard } from 'keyboard/Keyboard'
const keyboard = new Keyboard(songOptions, inputManager)
keyboard.connected().then(() => {
    bottom.enableKeyboard()
})
keyboard.on('outofbounds', () => {
    grid.flashSelector()
    sound.bump()
})

// MICROPHONE
import { Microphone } from 'mic/Microphone'
const microphone = new Microphone(songOptions, inputManager)
grid.instrument.renderer.registerDrawMethod(microphone.render)


///////////////////////////////////////////////////////////////////////////////
// accessibility
///////////////////////////////////////////////////////////////////////////////

import { TabClickOutline } from 'functions/TabClickOutline'
new TabClickOutline()


///////////////////////////////////////////////////////////////////////////////
// focus
///////////////////////////////////////////////////////////////////////////////

import { WindowFocus } from 'functions/WindowFocus'
const windowFocus = new WindowFocus()
windowFocus.on('focus-change', (bool) => {
    if (!bool && document.body.classList.contains('touch-device')) {
        sound.stop()
    }
})


///////////////////////////////////////////////////////////////////////////////
// TOP BAR
///////////////////////////////////////////////////////////////////////////////

import { TopBar } from 'top/TopBar'

const topBar = new TopBar(document.body, inputManager, midiData, badgeSystem, levelSystem, challengeManager)

//when a new song is created
topBar.on('settings-update', onSettingsUpdate)
bus.on('history:pop:save', event => {
    midiData.replace(event.timelines)
    songOptions.fromJSON(event.options)
    sound.syncWithMidiTrack()
    cloud.clear()
})
//call stop when it opens the menus
topBar.on('stop', () => {
    sound.stop()
})
topBar.on('back', () => {
    window.location = '/'
})
topBar.on('restart', () => {
    bottom.firstLoad = true
    bottom.disableSaveButton(true)
})
topBar.on('request-wav', (id) => {
    sound.generateWave(id)
})

topBar.on('request-midi', () => {
    sound.downloadMidi()
})

///////////////////////////////////////////////////////////////////////////////
// SONG MAKER
///////////////////////////////////////////////////////////////////////////////

import { Bottom } from 'bottom/Bottom'

const bottom = new Bottom(document.body, songOptions, sound)
bottom.on('play', start => {
    sound.resumeContext()
    if (start) {
        sound.start('+.1', 0)
    } else {
        sound.stop()
    }
})

bottom.on('play-from-selector', start => {
    sound.resumeContext()
    if (start) {
        let duration = (songOptions.totalBeats * 60 / songOptions.tempo)
        let offset = duration * inputManager.selector.position.x / songOptions.totalSubBeats
        sound.start('+.1', offset)
    } else {
        sound.stop()
    }
})


bottom.on('restart', () => {
    bottom.firstLoad = true
    bottom.disableSaveButton(true)
})
bottom.on('instrument-change', (name) => {
    sound.options.instrument = name
    sound.options.changeInstrument()
    onSongChanged()
})
bottom.on('percussion-change', (name) => {
    sound.options.percussion = name
    sound.options.changeInstrument()
    onSongChanged()
})
bottom.on('tempo', tempo => {
    sound.tempo = tempo
    grid.updateTempo(tempo)
})
bottom.on('undo', () => {
    bus.emit('history:undo')
    if (midiData.instrument.timeline._length + midiData.percussion.timeline._length < 1) {
        bottom.disableSaveButton(true)
    } else {
        bottom.disableSaveButton(false)
    }
    console.log("hello")
})
bottom.on('save', () => {
    cloud.save()
    topBar.triggerShare()
})
bottom.on('stop', () => {
    sound.stop()
})
bottom.on('share', () => {
    topBar.triggerShare('immediate')
})
bottom.on('settings', () => {
    topBar.triggerSettingsModal(songOptions)
})
bottom.on('midi', () => {
    keyboard.recording = !keyboard.recording
    bottom.midiRecording = keyboard.recording
})
bottom.on('mic', async () => {
    sound.stop()
    if (!microphone.recording) {
        await microphone.open()
    }
    microphone.recording = !microphone.recording
})
//when a new song is created
bottom.on('settings-update', onSettingsUpdate)

microphone.on('start', () => {
    // Turn off keyboard if it is on
    keyboard.recording = false
    bottom.micRecording = microphone.recording
    sound.instrumentTrack.setHotMic(true)
    sound.percussionTrack.setHotMic(true)
    inputManager.selector.showNoPick()
})
microphone.on('end', () => {
    bottom.micRecording = microphone.recording
    sound.instrumentTrack.setHotMic(false)
    sound.percussionTrack.setHotMic(false)
})
keyboard.on('start', () => {
    // Turn off micrphone if it is on
    microphone.recording = false
    bottom.midiRecording = keyboard.recording
    sound.instrumentTrack.setHotMic(true)
    sound.percussionTrack.setHotMic(true)
    inputManager.selector.show()
})
keyboard.on('end', () => {
    bottom.midiRecording = keyboard.recording
    sound.instrumentTrack.setHotMic(false)
    sound.percussionTrack.setHotMic(false)
})

microphone.supported().then(supported => {
    if (supported) bottom.enableMicrophone()
})

//click anywhere removes microphone mode
document.body.addEventListener('click', () => {
    microphone.recording = false
    keyboard.recording = false
})

let firstTouch = true
document.body.addEventListener('touchstart', () => {
    if (firstTouch) {
        firstTouch = false
        document.body.classList.add('touch-device')
    }
    microphone.recording = false
    keyboard.recording = false
})

document.body.addEventListener('touchend', () => {
    sound.resumeContext()
})



///////////////////////////////////////////////////////////////////////////////
// CLOUD
///////////////////////////////////////////////////////////////////////////////

import { Cloud } from 'cloud/Cloud'
const cloud = new Cloud(songOptions, midiData)

cloud.on('save-success', id => {
    console.log("[Main] Save successful (simulated), ID:", id); // Keep log if helpful
    if (!topBar.modals.share) {
        topBar.triggerShare({ id })
    } else {
        topBar.modals.share.populateSaveData({ id })
    }
})

///////////////////////////////////////////////////////////////////////////////
// EMBED ONLY
///////////////////////////////////////////////////////////////////////////////

if (embedId) {
    cloud.loadSong(embedId)
}


///////////////////////////////////////////////////////////////////////////////
// PRELOAD images
///////////////////////////////////////////////////////////////////////////////

[
    'images/instruments/tonal-marimba.svg',
    'images/instruments/perc-drum-machine.svg',
    'images/icon-mic.svg',
    'images/icon-quantity-add.svg',
    'images/icon-quantity-minus.svg',
    'images/icon-down-caret.svg',
    'images/instruments/tonal-piano.svg',
    'images/instruments/tonal-synth.svg',
    'images/instruments/tonal-violin.svg',
    'images/instruments/tonal-woodwind.svg',
    'images/instruments/perc-woodblock.svg',
    'images/instruments/perc-snare-drum.svg',
    'images/instruments/perc-conga.svg',
    'images/icon-mic-red.svg',
    'images/animated-mic.svg',
    'images/animated-midi.svg'
].forEach((image) => {
    var fakeImg = new Image()
    fakeImg.src = image
})

// --- Badge Check Triggered by Note/Option Changes --- 
const checkBadgesOnNoteChange = () => {
    // Debounce or throttle this if performance becomes an issue
    console.log(`[Main] checkBadgesOnNoteChange triggered. Current songOptions.scale: ${songOptions?.scale}, difficulty: ${songOptions?.difficulty}`);
    try {
        // Ensure badge system is enabled before checking
        if (badgeSystem.enabled) { 
             // Pass the centrally managed instances
             badgeSystem.trackSongCreated(songOptions, midiData);
        } else {
             console.log("[Main] Badge check skipped (badges disabled).")
        }
    } catch (error) {
        console.error("[Main] Error calling trackSongCreated from checkBadgesOnNoteChange listener:", error);
    }
};

// Listen for changes that might affect badges
midiData.instrument.on('add', checkBadgesOnNoteChange);
midiData.instrument.on('remove', checkBadgesOnNoteChange);
midiData.percussion.on('add', checkBadgesOnNoteChange);
midiData.percussion.on('remove', checkBadgesOnNoteChange);
songOptions.on('change', checkBadgesOnNoteChange);

// --- Challenge Completion Listener --- 
challengeManager.on('challenge-completed', (challenge) => {
    console.log(`Challenge Completed event received in Main.js: ${challenge.title}`);
    // Award points via LevelSystem
    levelSystem.addPoints(100, `challenge: ${challenge.id}`); // Base points

    // Award the 'firstChallenge' badge if it hasn't been earned yet
    if (!badgeSystem.hasBadge('firstChallenge')) {
        console.log("[Main] First challenge completed, awarding 'firstChallenge' badge.");
        // Use the correct method name
        badgeSystem.awardBadge('firstChallenge');
    }
});
