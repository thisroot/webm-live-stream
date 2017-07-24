import IO from 'koa-socket';
import uuid from 'uuid';
import fs from 'fs';
import mkdirp from 'mkdirp';
import m3u from 'm3u8-write';
import m3ureader from 'm3u8-reader';
var writer = require('m3u').writer();
import redis from "redis";

let cache  = redis.createClient();

module.exports = exports = function (app, socketCallback) {

    const io = new IO();

    io.attach(app);
    io.on('connection', onConnection);


    function onConnection(socket) {

        socket = socket.socket;

        socket.emit('message','OK!');


        socket.on('timesync', m => {
            socket.emit('timesync', {
                timestamp: Date.now()
            });
        });


        socket.on('start', m => {

        });

        socket.on('binarystream', m => {

                //console.log(m);

                writeToDiskInternal({
                    data: m.data,
                    name: m.chunk,
                    extension: '.webm',
                    //pathbase: './uploads/' + m.room + '/' + m.user + '/',
                    pathbase: '/var/streams/dash/' + m.room + '-' + m.user + '/',
                    raw: m
                }, function (file) {

                   console.log(file);
                });
        });

        socket.on('disconnect', () => {

        });

        socket.on('error',function(e){
            console.log('socket.io error:'+e);
        });
    }

    function writeToDiskInternal(file, callback) {

            var fileRootName = file.name,
                fileExtension = file.extension,
                filePathBase = file.pathbase,
                filePath = filePathBase + fileRootName + fileExtension,
                fileBuffer;

        if (!fs.existsSync(filePathBase)) {

            mkdirp(filePathBase, function(err) {
                if (err) {
                    console.log(err);
                    return setTimeout(writeToDiskInternal(file,callback), 300);
                }

                fs.open(filePathBase + '/index.m3u8', 'a+', function (err, fd ) {

                   var m3uobj =  [
                       {'EXT-X-VERSION':3},
                       {'EXT-X-MEDIA-SEQUENCE': 0},
                       {'EXT-X-TARGETDURATION':(file.raw.chunkmaxdur / 1000) + 1},
                   ];

                    cache.set(file.raw.room + '-' + file.raw.user, JSON.stringify(m3uobj));

                    fs.writeFile(
                        fd,
                        m3u(m3uobj)
                        , (err) => {
                        if (err) throw err;
                            fs.close(fd);
                            writeToDiskInternal(file, callback);
                    });
                });
            });
        } else {

            if (fs.existsSync(filePath)) {
                fs.unlink(filePath);
            }

            // write video chunk
            fileBuffer = new Buffer(file.data, "base64");
            fs.writeFile(filePath, fileBuffer, error => {
                if (error) throw error;

                cache.get(file.raw.room + '-' + file.raw.user, function (err,data) {

                    var m3uobj = JSON.parse(data);

                    m3uobj[m3uobj.length] = {'EXTINF': (file.raw.timechunk / 1000).toPrecision(3)};
                    m3uobj[m3uobj.length] = fileRootName + fileExtension;
                    m3uobj[1]['EXT-X-MEDIA-SEQUENCE']++;

                    cache.set(file.raw.room + '-' + file.raw.user,JSON.stringify(m3uobj));

                    fs.unlink(filePathBase + '/index.m3u8', function (err) {
                        // write m3u
                        fs.writeFile(filePathBase + '/index.m3u8', m3u(m3uobj), error => {
                            if (error) throw error;
                            callback(file);
                        });
                    });
                });
            });
        }
    }
};