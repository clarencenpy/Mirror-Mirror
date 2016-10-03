// A list of the support emotions that the game can detect
const Emotions = [
    {desc: 'Happiest', value: 'happiness'},
    {desc: 'Saddest', value: 'sadness'},
    {desc: 'Most Fearful', value: 'fear'},
    {desc: 'Most Disgusted', value: 'disgust'},
    {desc: 'Most Pokerface', value: 'neutral'},
    {desc: 'Most Surprised', value: 'surprise'},
    {desc: 'Angriest', value: 'anger'}
]

// module pattern, keeps all app related functions namespaced under App
const App = {

    //storing the current game state
    state: {
        gameInProgress: false,
        currentEmotion: Emotions[0]
    },

    //bootstraps the app
    init() {
        App.initCamera()
        App.bindEvents()
    },

    //using webcam.js to initialise the camera
    initCamera() {
        Webcam.attach('#camera')
        Webcam.set({
            flip_horiz: true
        })
    },

    //bind event handlers to buttons
    bindEvents() {
        $('#startBtn').on('click', () => {
            if (!App.state.gameInProgress) {
                App.state.gameInProgress = true
                //change status of the start button
                $('#startBtn').text('Start').css('color', 'lightgreen')
                App.restartGame()
            } 
        })

        $('#readmeBtn').on('click', () => {
            App.fetchReadme()
        })

    },

    fetchReadme() {
        $.get('readme.txt', data => {
            $('#readmeText').text(data).toggleClass('blur')
        })
    },

    //trigger game start
    startGameSequence() {

        $('#readmeText').addClass('blur')

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

    //reset the game to original state, and to start a new game
    restartGame() {
        $('#camera').addClass('blur')
        $('#countdownBar .front').animate({ width: '870px' }, 500)
        $('#photo').animate({ opacity: '0' }, 500)

        //choose a different emotion for the next game
        let emotion
        do {
            emotion = Emotions[Math.floor(Math.random() * Emotions.length)]
        }
        while (App.state.currentEmotion.desc == emotion.desc) 
        App.state.currentEmotion = emotion
        
        $('#faceFrames').html('')

        //restart the game
        App.startGameSequence()
    },

    // convert base64 to raw binary data held in a string
    // modified code from: http://stackoverflow.com/questions/12168909/blob-from-dataurl
    dataURItoBlob(dataURI) {
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

    //takes a photo and displays it in the same place
    takeSnapshot() {
        Webcam.snap(function(dataUri) {
            App.submitImage(dataUri)
            $('#photo').html(`<img src="${dataUri}"/>`).css('opacity', 1)
        })
    },

    // submit image to the API for analysis
    submitImage(dataUri) {
        //need to convert URI to binary as that is the format the api expects
        const rawBinary = App.dataURItoBlob(dataUri)
        $.ajax('https://api.projectoxford.ai/emotion/v1.0/recognize', {
            method: 'POST',
            headers: {
                // This is the API key that I obtained from Microsoft Cognitive Services 
                'Ocp-Apim-Subscription-Key': '85ed9c6a9b0f48f9839786c0e9ca6e26'
            },
            processData: false, //we dont want jquery to parse the raw binary
            contentType: 'application/octet-stream',
            data: rawBinary
        }).done((data) => {
            App.state.gameInProgress = false
            App.processEmotionScores(data)
            $('#startBtn').text('New Game').css('color', 'white')
        })
    },

    // takes the data returned from the API and render the results, and shows the winner of the match
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

            //draw the result label at the top 
            $label.css({
                top: d.faceRectangle.top - 62,
                left: d.faceRectangle.left + 60,
            })

            //add special styling if this is the winner
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

// when all resources are loaded, initialise the app
$(document).ready(() => {
    App.init()
})
