import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import views from 'koa-views'
import serve from 'koa-static'
import range from 'koa-range';

const app = new Koa();

const router = new Router();

//require('./utils/signaling-server.js')(app);

require('./utils/recordwebm/signaling-server.js')(app);

app
    .use(serve('./public'))
    .use(range)
    .use(logger())
    .use(views(__dirname + '/views', {
        map: {
            html: 'handlebars'
        }
    }));

router.get('/', (ctx) => {
    return ctx.render('recwebm.html', {title: "record webm with m3u8"});
});


router.get('/streamrec', (ctx) => {
    return ctx.render('streamrec.html', {title: "Streamrec"});
});

router.get('/broadcast', (ctx) => {
    return ctx.render('broadcast.html', {title: "Broadcasting"});
});


router.get('/record', (ctx) => {
    return ctx.render('index.html', {title: "Recorder"});
});


router.post('/publish', (ctx, next) => {

    console.log(ctx.request.query, ctx.request.body);

    let body = ctx.request.body;
    if (!body.name) {
        ctx.status = 401
    }

    //ctx.status = 201
    ctx.redirect("rtmp://127.0.0.1/publish/" + body.name,302)

});

router.post('/publish_done', (ctx, next) => {
    console.log(ctx.request.query, ctx.request.body);
    ctx.status = 200
});

app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods("GET, POST, PUT, DELETE"));


app.listen(8986, function () {
    console.log("server started")
});


