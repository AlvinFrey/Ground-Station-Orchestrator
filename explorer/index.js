
require('dotenv').config({path: '../.env'});
const serveIndex = require('serve-index');
const express = require('express');
const app = express();

const serveOptions = {
    'icons': true,
    'view': 'tiles',
    'stationID': process.env.GROUND_STATION_ID
};

app.use('/', serveIndex(process.env.STORAGE_FOLDER, serveOptions));
app.use('/', express.static(process.env.STORAGE_FOLDER));

app.listen(process.env.EXPLORER_PORT, function () {
    console.log('[EXPLORER] Explorer server running on port ' + process.env.EXPLORER_PORT);
});