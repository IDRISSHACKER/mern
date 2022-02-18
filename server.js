const express = require("express")
const bodyParser = require("body-parser")
var ffmpeg = require('ffmpeg');
const expressFileUpload = require("express-fileupload")
const lodash = require("lodash");
const path = require("path");


const app = express()
const APP_PORT = 4000
const TMP_DIR = `${__dirname}\\tmp\\`

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/index.html`, (err) => console.log("erreur"))
})

app.use(
    expressFileUpload({
        useTempFiles: true,
        tempFileDir: TMP_DIR
    })
)


app.post("/convert", (req, res) => {
    const to = req.body.to
    const file = req.files.file
    const videoExt = path.extname(file.name)
    const audioExt = ".mp3"
    const FILE_PATH = TMP_DIR + lodash.random(456, 456654)
    const FILE_PATH_VIDEO = FILE_PATH + videoExt
    const FILE_PATH_AUDIO = FILE_PATH + audioExt
    res.status = 200
    res.send(`${file}==>${to}`)
    console.log(file)

    file.mv(FILE_PATH_VIDEO, (err) => {
        if (err) return res.sendStatus(500).send(err);
        try {
            var process = new ffmpeg(FILE_PATH_VIDEO);
            process.then(function (video) {
                // Callback mode
                video.fnExtractSoundToMP3(FILE_PATH_AUDIO, function (error, file) {
                    if (!error)
                        console.log('Audio file: ' + FILE_PATH_AUDIO);
                    if (error)
                        console.log(error.message)
                });
            }, function (err) {
                console.log('Error: ' + err);
            });
        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
        }
        console.log("File uploaded successfully to " + FILE_PATH_VIDEO)
    })


})

app.listen(APP_PORT, () => console.log(`App Started on port ${APP_PORT} `))