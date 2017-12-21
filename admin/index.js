
require('dotenv').config({path: '../.env'});
const express = require('express');
const twig = require("twig");
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

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

console.log("Your password : " + (process.env.GROUND_STATION_UID + process.env.SECRET_KEY).hashCode());

app.use((req, res, next) => {

    res.locals.logged = false;

    if(req.url === '/login' || req.url === '/api/login'){
        next();
    }else if(req.session && req.session.authKey === (process.env.GROUND_STATION_UID + process.env.SECRET_KEY).hashCode().toString()){
        res.locals.logged = true;
        next();
    }else if(!req.session.authKey || req.session.authKey!== (process.env.GROUND_STATION_UID + process.env.SECRET_KEY).hashCode().toString()){
        res.redirect('/login');
    }else{
        next();
    }

});

app.all('/', function(req, res){
    res.render('index',{
        groundStation: {
            name: process.env.GROUND_STATION_NAME
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
                if(req.body.password === (process.env.GROUND_STATION_UID + process.env.SECRET_KEY).hashCode().toString()){
                    req.session.authKey = (process.env.GROUND_STATION_UID + process.env.SECRET_KEY).hashCode().toString();
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