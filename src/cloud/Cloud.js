import { SAVE_URL_PATH, MIDI_URL_PATH, DATA_URL_PATH, SITE_URL_PATH } from 'data/Config'
import { Url } from './Url'
import { EventEmitter } from 'events'

export class Cloud extends EventEmitter {
    constructor(options, midiData) {
        super()

        this.options = options
        this.midiData = midiData

        this.url = new Url()
        this.url.on('change', id => {
            this.load(id)
        })
    }

    loadSong(id) {
        this.load(id)
        if (document.getElementById('edit-link')) {
            let editLink = document.getElementById('edit-link')
            editLink.parentNode.getElementById('edit-link').removeChild(editLink)
        } else {
            let editLink = document.createElement('a')
            editLink.id = 'edit-link'
            editLink.textContent = 'Edit with Song Maker'
            editLink.setAttribute('target', '_blank')
            editLink.setAttribute('href', `${SITE_URL_PATH}/song/` + id)
            document.body.appendChild(editLink)
        }
    }

    async save() {
        // --- Simulate save locally, perform real fetch in production ---
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log("[Cloud.js] Running locally. Simulating successful save.");
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 500)); 
            const dummyId = `local_${Date.now()}`;
            this.emit('save-success', dummyId); 
            // this.url.setId(dummyId); // Optionally update URL
            // Return a RESOLVED PROMISE containing the ID object
            return Promise.resolve({ id: dummyId }); 
        } else {
             // --- Original Fetch Logic for Production --- 
            console.log("[Cloud.js] Running in production environment. Attempting real save.");
            // post the data
            const form = new FormData()
            form.append('midi', this.midiData.encode(this.options))
            form.append('data', JSON.stringify(this.options.toJSON()))
    
            const response = await fetch(SAVE_URL_PATH, {
                method: 'POST',
                body: form
            }).then(ret => {
                if (ret.ok) {
                    var rj = ret.json()
                    console.log("[Cloud.js] Save fetch successful. Emitting 'save-success'.")
                    this.emit('save-success', rj.id)
                    return rj
                } else {
                    console.error(`[Cloud.js] Save fetch failed with status: ${ret.status}`);
                    throw new Error(`could not post file: ${ret.status}`)
                }
            })
    
            //apply the url
            this.url.setId(response.id)
            return response; // Return the actual response object
        }
    }
    async load(id) {
        this.emit('load-start', id)
        //get the midi file and midi data from the url
        const midiPromise = fetch(`https://storage.googleapis.com/song-maker-midifiles-prod/${id}.mid`,).then(ret => {
            if (ret.ok) {
                return ret.arrayBuffer()
            } else {
                window.location = SITE_URL_PATH
                throw new Error(`could not load midi file ${id}`)
            }
        })

        const dataPromise = fetch(`${DATA_URL_PATH}/${id}`, { method: 'POST' }).then(ret => {
            if (ret.ok) {
                return ret.json()
            } else {
                window.location = SITE_URL_PATH
                throw new Error(`could not load data file ${id}`)
            }
        })

        const [midiBuffer, songData] = await Promise.all([midiPromise, dataPromise])


        //set the options
        this.options.fromJSON(songData)

        //decode the midi
        this.midiData.decode(midiBuffer, this.options)
    }
    clear() {
        this.url.clear()
    }
}
