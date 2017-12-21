
require('dotenv').config({path: '../.env'});
const express = require('express');
const twig = require("twig");
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');

function hash(string) {
    string = string.toString();
    let a = 1, c = 0, h, o;
    if (string) {
        a = 0;
        for (h = string.length - 1; h >= 0; h--) {
            o = string.charCodeAt(h);
            a = (a<<6&268435455) + o + (o<<14);
            c = a & 266338304;
            a = c!==0?a^c>>21:a;
        }
    }
    return String(a);
}

app.set('views', __dirname + '/views');
app.set('view engine', 'twig');
app.set("twig options", {
    strict_variables: false
});

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));

console.log("Your password : " + hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY));

app.use((req, res, next) => {

    res.locals.logged = false;

   /* if(req.url === '/login' || req.url === '/api/login'){*/
        next();
    /*}else if(req.session && req.session.authKey === hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY)){
        res.locals.logged = true;
        next();
    }else if(!req.session.authKey || req.session.authKey!== hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY)){
        res.redirect('/login');
    }else{
        next();
    }*/

});

app.all('/', function(req, res){
    res.render('index',{
        groundStation: {
            name: process.env.GROUND_STATION_NAME,
            uid: process.env.GROUND_STATION_UID,
            position: {
                latitude: process.env.GROUND_STATION_LATITUDE,
                longitude: process.env.GROUND_STATION_LONGITUDE
            }
        },
        logged: res.locals.logged,
        url: req.url
    });
});

app.get('/login', function(req, res){
    res.render('login', {
        groundStation: {
            name: process.env.GROUND_STATION_NAME
        }
    });
});

app.post('/api/login', function(req, res){
    if(req.body.stationID && req.body.password && req.body.secret){
        if(req.body.stationID === process.env.GROUND_STATION_UID){
            if(req.body.secret === process.env.SECRET_KEY){
                if(req.body.password === hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY)){
                    req.session.authKey = hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY);
                    res.locals.logged = true;
                    res.json({
                        status: "success"
                    });
                }else{
                    res.json({
                        status: "error",
                        message: "Bad password"
                    });
                }
            }else{
                res.json({
                    status: "error",
                    message: "Bad secret key"
                });
            }
        }else{
            res.json({
                status: "error",
                message: "Bad station ID"
            });
        }
    }else{
        res.json({error: "Can't find correct parameters"})
    }
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.locals.logged = false;
    res.redirect('/login');
});


app.listen(3000, function () {
    console.log('[ADMIN PANEL] Admin panel server running on port 3000');
});