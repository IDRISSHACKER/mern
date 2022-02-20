const express = require("express")
const bodyParser = require("body-parser")
const ffmpeg = require('ffmpeg')
const fluent = require("fluent-ffmpeg")
const expressFileUpload = require("express-fileupload")
const lodash = require("lodash")
const path = require("path")
const hbjd = require("handbrake-js")
const fs = require("fs")


const app = express()
const APP_PORT = 4000
const TMP_DIR = `${__dirname}\\tmp\\`

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/index.html`, (err) => console.log("htmlPB"))
})

app.use(
    expressFileUpload({
        useTempFiles: true,
        tempFileDir: TMP_DIR
    })
)


const fpegConvert = (input, output, res) => {
    try {
        var process = new ffmpeg(input);
        process.then(function (video) {
            // Callback mode
            video.fnExtractSoundToMP3(output, function (error, file) {
                if (!error)
                    console.log('Audio file: ' + output);
                res.download(output, (err) => {
                    if (err)
                        console.log(err)

                    fs.unlink(input, (err) => {
                        if (err)
                            console.log(err)
                        console.log("file deleted")
                    })
                })
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
}

const hbConvert = (input, output) => {
    hbjd.spawn({ input, output })
        .on("error", (err) => console.log(err))
        .on("progress", progress => {
            console.log(
                progress.percentComplete,
                progress.eta
            )
        })
}


const convert = (input, output, format, end = () => { }) => {
    console.log(
        `
        ===>${input} [${format}]  ====> ${output}
    `
    )
    fluent(input)
        .withOutputFormat(format)
        .on("end", () => {
            console.log("Fin de la convertion du fichier")
            end()
        })
        .on("error", (err) => {
            console.log("error to convert file " + err)
        }).saveToFile(output)
}

app.post("/convert", (req, res) => {
    const to = req.body.to
    const file = req.files.file
    const videoExt = path.extname(file.name)
    const audioExt = ".mp3"
    const FILE_PATH = TMP_DIR + lodash.random(456, 456654)
    const FILE_PATH_VIDEO = FILE_PATH + videoExt
    const FILE_PATH_AUDIO = FILE_PATH + audioExt
    const OUTPUT_CONVERT = FILE_PATH + "." + to

    file.mv(FILE_PATH_VIDEO, (err) => {
        if (err) return res.sendStatus(500).send(err);
        //fpegConvert(FILE_PATH_VIDEO, FILE_PATH_AUDIO, res)
        convert(FILE_PATH_VIDEO, OUTPUT_CONVERT, to, () => {
            res.download(OUTPUT_CONVERT, (err) => {
                if (err)
                    console.log(err)

                fs.unlink(FILE_PATH_VIDEO, (err) => {
                    if (err)
                        console.log(err)
                    console.log("file deleted")
                })
            })
        })
    })


})

app.listen(APP_PORT, () => console.log(`App Started on port ${APP_PORT} `))