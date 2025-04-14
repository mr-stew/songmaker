import tinycolor from 'tinycolor2'
import { CanvasRenderer } from './CanvasRenderer'
import { midiToColor, blue20, blue25, blue40, blue70 } from 'data/Colors'

export class InstrumentCanvasRenderer extends CanvasRenderer {
    drawNotes(notesArray, scroll, position, beatsState) {
        // Draw some notes
        for (let j = this.bounds.yMin; j < this.bounds.yMax; j++) {
            for (let i = this.bounds.xMin; i < this.bounds.xMax; i++) {
                let note = notesArray.get(i, notesArray.flipY(j)) // flipY because (0,0) is notes array is bottom left, not top left
                if (note) {
                    let noteColor = midiToColor(note)
                    this.context.fillStyle = tinycolor.mix(noteColor, 'white', beatsState[i].on * 100).toRgbString()
                    
                    // Original fillRect call restored
                    this.context.fillRect(
                        i * this.tileWidth * this.dpi - scroll.x * this.dpi,
                        j * this.tileHeight * this.dpi - scroll.y * this.dpi,
                        this.tileWidth * this.dpi,
                        this.tileHeight * this.dpi
                    );
                }
            }
        }
    }

    drawGrid(notesArray, scroll) {
        // Draw Horizontal Grid
        if (this.tileHeight > 5) {
            // Default style for regular horizontal lines
            const defaultLineColor = blue25;
            const octaveLineColor = blue40; // Darker color for octave lines
            const defaultThickness = this.isEmbed ? 0.5 : 1;
            const octaveThickness = this.isEmbed ? 1.5 : 4; // Make octave lines significantly thicker

            for (let j = this.bounds.yMin + 1; j < this.bounds.yMax; j++) {
                let thickness = defaultThickness;
                let color = defaultLineColor;
                
                // Check if this line is an octave boundary (MODIFIED: Fixed 7-row cycle, shifted up)
                let noteIndex = notesArray.flipY(j - 1); // Note index below the line (0 is bottom)

                // New logic: Thick line above the 8th row (index 7) in each 7-row cycle
                 if (noteIndex % 7 === 0 && notesArray.rows > 7 && noteIndex > 0) { // Check modulo 7 is 0, ensure rows > 7, and avoid the line above the very first row (index 0)
                     thickness = octaveThickness; 
                     color = octaveLineColor;
                }

                // Draw the line with the determined thickness and color
                this.context.fillStyle = color;
                this.context.fillRect(
                    0,
                    j * this.tileHeight * this.dpi - scroll.y * this.dpi,
                    this.width * this.dpi,
                    thickness * this.dpi // Use calculated thickness
                );
            }
        }

        // Draw Vertical Grid
        this.context.fillStyle = blue40
        for (let i = this.bounds.xMin + 1; i < this.bounds.xMax; i++) {
            let originalFillStyle = this.context.fillStyle; // Store original color
            if (this.subdivision > 1 && i % this.subdivision === 0) {
                this.context.fillStyle = blue70 // Beat lines
            } else if (this.subdivision > 1) {
                this.context.fillStyle = blue20 // Subdivision lines
            }
            let thickness = 1
            if (this.isEmbed) thickness = 0.5
            this.context.fillRect(
                i * this.tileWidth * this.dpi - scroll.x * this.dpi,
                0,
                thickness * this.dpi,
                this.height * this.dpi
            )
            // Reset color for next iteration (important if changed above)
             this.context.fillStyle = originalFillStyle;
        }
    }
}
