/// <reference path="../../typings/index.d.ts" />
import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import router from './routes/index';
//todo: need logging
//todo: coockie-parser?
//todo: body-parser?

var index = router;



var port: number = process.env.PORT || 4000;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//app.use(logger('dev'));
/*app.use(bodyParser.urlencoded({
    extended: false
}));*/
//app.use(coockieParser());

app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', index);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.message = '404 ' + req.url;
    next(err);
}); 
/*var renderIndex = (req: express.Request, res: express.Response) => {
    res.render('index', {title: 'meantype'});
}*/
 
// app.get('/', renderIndex);
 
var server = app.listen(port, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});