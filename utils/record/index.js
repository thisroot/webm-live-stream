/**
 * Created by User on 11.07.2017.
 */
import path from 'path'
import FFmpeg from 'fluent-ffmpeg';
import fs from 'fs'

export function writeToDisk(dataURL, fileName) {
    let fileExtension = fileName.split('.').pop(),
        fileRootNameWithBase = './uploads/' + fileName,
        filePath = fileRootNameWithBase,
        fileID = 2,
        fileBuffer;

    // @todo return the new filename to client
    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    dataURL = dataURL.split(',').pop();
    fileBuffer = new Buffer(dataURL, 'base64');
    fs.writeFileSync(filePath, fileBuffer);

    console.log('filePath', filePath);
}

export function merge(socket, fileName) {

    var audioFile = path.join('./uploads', fileName + '.wav'),
        videoFile = path.join('./uploads', fileName + '.webm'),
        mergedFile = path.join('./uploads', fileName + '-merged.webm');

    new FFmpeg({
        source: videoFile
    })
        .addInput(audioFile)
        .on('error', function (err) {
            socket.emit('ffmpeg-error', 'ffmpeg : An error occurred: ' + err.message);
        })
        .on('progress', function (progress) {
            socket.emit('ffmpeg-output', Math.round(progress.percent));
        })
        .on('end', function () {
            socket.emit('merged', fileName + '-merged.webm');
            console.log('Merging finished !');

            // removing audio/video files
            fs.unlink(audioFile);
            fs.unlink(videoFile);
        })
        .saveToFile(mergedFile);
}