const Emotions = [
    {desc: 'Happiest', value: 'happiness'},
    {desc: 'Saddest', value: 'sadness'},
    {desc: 'Most Fearful', value: 'fear'},
    {desc: 'Most Disgusted', value: 'digust'},
    {desc: 'Most Pokerface', value: 'neutral'},
    {desc: 'Most Surprised', value: 'surprise'},
    {desc: 'Angry', value: 'anger'}
]

const App = {

    state: {
        gameInProgress: false,
        currentEmotion: Emotions[0]
    },

    init() {
        App.initCamera()
        App.bindEvents()
    },

    initCamera() {
        Webcam.attach('#camera')
        Webcam.set({
            flip_horiz: true
        })
    },

    bindEvents() {
        $('#startBtn').on('click', () => {
            if (!App.state.gameInProgress) {
                App.state.gameInProgress = true
                //change status of the start button
                $('#startBtn').text('Reset')
                App.startGameSequence()
            } else {
                App.state.gameInProgress = false
                //change status of the start button
                $('#startBtn').text('Start')
                App.resetGame()
            }

        })

    },

    startGameSequence() {

        //set the game emotion text        
        $('#emotionText').text(App.state.currentEmotion.desc)

        //first, show the magic enchantments
        $('#gameText').removeClass('blur')
            //crossfade with camera
        setTimeout(() => {
            $('#camera').removeClass('blur')
        }, 4000)
        setTimeout(() => {
            $('#gameText').addClass('blur')
                //start the countdown.. 
            $('#countdownBar .front').animate({ width: '0px' }, 2000, () => {
                App.takeSnapshot()
            })
        }, 5000)
    },

    resetGame() {
        $('#camera').addClass('blur')
        $('#countdownBar .front').animate({ width: '870px' }, 500)
        $('#photo').animate({ opacity: '0' }, 500)

        let emotion
        do {
            emotion = Emotions[Math.floor(Math.random() * Emotions.length)]
        }
        while (App.state.currentEmotion.desc == emotion.desc) 
        App.state.currentEmotion = emotion
        
        $('#faceFrames').html('')
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
            $('#photo').html(`<img src="${dataUri}"/>`).css('opacity', 1)
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

            App.processEmotionScores(data)
            console.log(data)

        })
    },

    processEmotionScores(data) {
        //first, parse the response data and calculate the highest score
        let highscore = 0
        for (let d of data) {
            d.computedScore = Math.round((d.scores[App.state.currentEmotion.value] * 10000))
            
            if (d.computedScore >= highscore) {
                highscore = d.computedScore
            }
        }

        //draw the face rectangles
        for (let d of data) {
            const $frame = $('<div class="frame"></div>')
            const $rect = $('<div class="rectangle"></div>')
            const $label = $('<div class="label"></div>')

            $rect.css({
                width: d.faceRectangle.width,
                height: d.faceRectangle.height,
                top: d.faceRectangle.top - 40,
                left: d.faceRectangle.left + 60,
            })

            $label.css({
                top: d.faceRectangle.top - 62,
                left: d.faceRectangle.left + 60,
            })

            if (d.computedScore === highscore) {
                $label.addClass('winner')
                $label.text(`WINNER: ${d.computedScore} PTS`)
            } else {
                $label.text(`${d.computedScore} PTS`)
            }

            $frame.append($label)
            $frame.append($rect)
            $('#faceFrames').append($frame)
        }
    }
}

$(document).ready(() => {
    App.init()
})
