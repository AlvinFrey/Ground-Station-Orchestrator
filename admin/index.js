
require('dotenv').config({path: '../.env'});
const express = require('express');
const twig = require("twig");
const app = express();
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const scheduler = require('node-schedule');
const isOnline = require('is-online');
const usb = require('usb');
const getFolderSize = require('get-folder-size');
const spacetrack = require('../helpers/spacetrack');
const satellites = require('../helpers/satellites');

function editDotenv(key, value){
    return new Promise( function(resolve, reject){

        fs.readFile('.env', 'utf8', function(err, contents) {

            let line = new RegExp(key + '=(.*)', 'g').exec(contents);
            let replacedLine = line[0].replace(line[1], value);
            let replacedContents = contents.replace(line[0], replacedLine);
            fs.writeFile(".env", replacedContents, function(err) {
                if(err){
                    reject(err);
                }
                resolve();
            });

        });

    });
}

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

app.use((req, res, next) => {

    res.locals.logged = false;

   if(req.url === '/login' || req.url === '/api/login'){
        next();
    }else if(req.session && req.session.authKey === hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY)){
        res.locals.logged = true;
        next();
    }else if(!req.session.authKey || req.session.authKey!== hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY)){
        res.redirect('/login');
    }else{
        next();
    }

});

app.all('/', function(req, res){

    getFolderSize(process.env.STORAGE_FOLDER, function(err, size) {
        isOnline().then(online => {
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
                url: req.url,
                scheduledJobs: Object.keys(scheduler.scheduledJobs).length,
                online: online,
                usbConnection: usb.findByIds(process.env.SDR_VENDOR_ID, process.env.SDR_PRODUCT_ID),
                folderSize: (size / 1024 / 1024).toFixed(2) + ' Mb'
            });
        });
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
        res.json({
            status: "error",
            message: "Can't find correct parameters"
        });
    }
});

app.get('/settings', function(req, res){
    res.render('settings', {
        groundStation: {
            name: process.env.GROUND_STATION_NAME
        },
        env: process.env
    });
});

app.post('/api/settings', function(req, res){

    if(req.body.type){
        if(req.body.type === "groundstation" && req.body.uid && req.body.name && req.body.latitude && req.body.longitude){

            editDotenv("GROUND_STATION_UID", req.body.uid).then(function(){
                editDotenv("GROUND_STATION_NAME", req.body.name).then(function(){
                    editDotenv("GROUND_STATION_LATITUDE", req.body.latitude).then(function(){
                        editDotenv("GROUND_STATION_LONGITUDE", req.body.longitude).then(function(){
                            res.json({
                                status: "success"
                            });
                        });
                    });
                });
            });

        }else if(req.body.type === "system" && req.body.storageURL && req.body.explorerPort) {

            editDotenv("STORAGE_FOLDER", req.body.storageURL).then(function () {
                editDotenv("EXPLORER_PORT", req.body.explorerPort).then(function () {
                    res.json({
                        status: "success"
                    });
                });
            });

        }else if(req.body.type === "system" && req.body.storageURL && req.body.explorerPort && req.body.secretKey) {

            editDotenv("STORAGE_FOLDER", req.body.storageURL).then(function () {
                editDotenv("EXPLORER_PORT", req.body.explorerPort).then(function () {
                    editDotenv("SECRET_KEY", req.body.secretKey).then(function () {
                        res.json({
                            status: "success"
                        });
                    });
                });
            });

        }else if(req.body.type === "spacetrack" && req.body.username) {

            editDotenv("SPACETRACK_USERNAME", req.body.username).then(function () {
                res.json({
                    status: "success"
                });
            });

        }else if(req.body.type === "spacetrack" && req.body.username && req.body.password) {

            editDotenv("SPACETRACK_USERNAME", req.body.username).then(function () {
                editDotenv("SPACETRACK_PASSWORD", req.body.password).then(function () {
                    res.json({
                        status: "success"
                    });
                });
            });

        }else if(req.body.type === "usb" && req.body.vendorID && req.body.productID) {

            editDotenv("SDR_VENDOR_ID", req.body.vendorID).then(function () {
                editDotenv("SDR_PRODUCT_ID", req.body.productID).then(function () {
                    res.json({
                        status: "success"
                    });
                });
            });

        }else{
            res.json({
                status: "error",
                message: "Can't find correct parameters"
            });
        }

    }else{
        res.json({
            status: "error",
            message: "Can't find correct parameters"
        });
    }

});

app.get('/satellites', function(req, res){
    res.render('satellites', {
        groundStation: {
            name: process.env.GROUND_STATION_NAME
        },
        url: req.url,
        satellites: JSON.parse(fs.readFileSync('satellites.json', 'utf8'))
    });
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.locals.logged = false;
    res.redirect('/login');
});


app.listen(3000, function () {
    console.log('[ADMIN PANEL] Admin panel server running on port 3000');
    console.log("Your password is : " + hash(process.env.GROUND_STATION_UID + process.env.SECRET_KEY));
});