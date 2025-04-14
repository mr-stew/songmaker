import { AbstractInstrument } from './AbstractInstrument'
import { PercussionCanvasRenderer } from './PercussionCanvasRenderer'

export class Percussion extends AbstractInstrument {
    constructor(container, midiTrack, isEmbed, levelSystem) {
        super(container, midiTrack, isEmbed, 'percussion-canvas', levelSystem)
    }

    rendererClass() {
        return PercussionCanvasRenderer
    }
}
