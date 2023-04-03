
const { readdir } = require('fs/promises');
const express = require('express')
const fs = require('fs')
const path = require('path');
const glob = require("glob")

const port = 3005;
const app = express()

const videoFileMap={
    'cdn':'videos/cdn.mp4',
    'generate-pass':'videos/generate-pass.mp4',
    'get-post':'videos/get-post.mp4',
}

const findByName = async (dir, name) => {
    const matchedFiles = [];

    const files = await readdir(dir);

    for (const file of files) {
        // Method 1:
        const filename = path.parse(file).name;

        if (filename === name) {
            matchedFiles.push(file);
        }
    }

    return matchedFiles;
};


// all videos
app.get('/all_videos', (req, res)=>{

    const directoryPath = path.join(__dirname, 'videos');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            console.log(file); 
        });
    });
})

// search for specific video
app.get('/search/:video', (req, res)=>{
    const fileName = req.params.video;
    const directoryPath = path.join(__dirname, 'videos');

    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //console.log(fileName)
        findByName(directoryPath, fileName).then((files) => {
            console.log(files);
            res.status(200).json({ 'file' : files[0] })
        });
    });
})


app.get('/videos/:filename', (req, res)=>{
    const fileName = req.params.filename;
    const filePath = videoFileMap[fileName]
    if(!filePath){
        return res.status(404).send('File not found')
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if(range){
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        };
        res.writeHead(206, head);
        file.pipe(res);
    }
    else{
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res)
    }
})

app.listen(port, ()=>{
    console.log(`server is listening on post ${ port }`)
})