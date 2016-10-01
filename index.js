const App = {
    init() {
        // App.initCamera()
        App.bindEvents()
    },

    initCamera() {
        // setTimeout(() => {
        //     Webcam.reset()
        // }, 5 * 1000)
        Webcam.attach('#camera')
        Webcam.set({
            flip_horiz: true
        })
    },

    bindEvents() {
        $('#takePhoto').on('click', () => {
            App.takeSnapshot()
        })

    },

    dataURItoBlob(dataURI) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        const byteString = atob(dataURI.split(',')[1])

        // separate out the mime component
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
        }

        // write the ArrayBuffer to a blob, and you're done
        const blob = new Blob([ab], { type: mimeString })
        return blob
    },

    takeSnapshot() {
        Webcam.snap(function(dataUri) {
            App.submitImage(dataUri)
            $('#result').innerHTML = '<img src="' + dataUri + '"/>'
        })
    },

    submitImage(dataUri) {
        const rawBinary = App.dataURItoBlob(dataUri)
        $.ajax('https://api.projectoxford.ai/emotion/v1.0/recognize', {
            method: 'POST',
            headers: {
                // This is the API key that I obtained from Microsoft
                'Ocp-Apim-Subscription-Key': '85ed9c6a9b0f48f9839786c0e9ca6e26'
            },
            processData: false, //we dont want jquery to parse the raw binary
            contentType: 'application/octet-stream',
            data: rawBinary
        }).done((data) => {
            console.log(data)
            console.log(data[0].scores.happiness > data[1].scores.happiness ? 'Clarence Wins!!' : 'Edison Wins!!')
            console.log()
        })
    }
}

$(document).ready(() => {
    App.init()
})
