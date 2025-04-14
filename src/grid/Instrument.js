import { AbstractInstrument } from './AbstractInstrument'
import { InstrumentCanvasRenderer } from './InstrumentCanvasRenderer'

export class Instrument extends AbstractInstrument {
    constructor(container, midiTrack, isEmbed, levelSystem) {
        super(container, midiTrack, isEmbed, 'instrument-canvas', levelSystem)
    }

    rendererClass() {
        return InstrumentCanvasRenderer
    }
}
