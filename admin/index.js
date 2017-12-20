
require('dotenv').config({path: '../.env'});
const express = require('express');
const twig = require("twig");
const app = express();
const session = require('express-session');

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

app.use((req, res, next) => {

    res.locals.logged = false;

    if(req.url === '/login'){
        next();
    }else if(req.session && req.session.authKey === "lol"){
        res.locals.logged = true;
        next();
    }else{
        next();
    }

});

app.all('/', function(req, res){
    res.render('index',{
        logged: res.locals.logged
    });
});

app.get('/login', function(req, res){
    req.session.authKey = "lol";
    res.locals.logged = true;
    res.render('login');
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.locals.logged = false;
    res.redirect('/');
});


app.listen(3000, function () {
    console.log('[ADMIN PANEL] Admin panel server running on port 3000');
});