
const jspredict = require('jspredict');
const moment = require('moment');
const async = require('async');

const satelliteInfos = [{

    'NOAA 15': {
        'frequency': 137.5000,
        'type': 'noaa',
        'tleName': 'NOAA 15 [B]'
    },
    'NOAA 18': {
        'frequency': 137.9125,
        'type': 'noaa',
        'tleName': 'NOAA 18 [B]'
    },
    'NOAA 19': {
        'frequency': 137.1000,
        'type': 'noaa',
        'tleName': 'NOAA 19 [+]'
    },
    'ISS': {
        'frequency': 145.8000,
        'type': 'stations',
        'tleName': 'ISS (ZARYA)'
    },
    'FUNCUBE-1': {
        'frequency': 145.9350,
        'type': 'cubesat',
        'tleName': 'FUNCUBE-1 (AO-73)'
    }

}];

module.exports.formatSatelliteInfos = function(satellites){

    let satelliteData = {};

    async.forEachOf(satellites, function(err, satelliteID) {

        satelliteData[satelliteID] = {
            frequency: satelliteInfos[0][satelliteID].frequency,
            type: satelliteInfos[0][satelliteID].type,
            tleName: satelliteInfos[0][satelliteID].tleName,
            epoch: satellites[satelliteID].epoch,
            tle: satellites[satelliteID].tle,
            predicts: {
                startTime: {},
                endTime: {},
                duration: {}
            }
        };

        const predictions = jspredict.transits(
            satellites[satelliteID].tle,
            [process.env.GROUND_STATION_LATITUDE, process.env.GROUND_STATION_LONGITUDE, process.env.GROUND_STATION_ALTITUDE],
            moment(),
            moment().add(1, 'days'),
            5
        );

        async.forEachOf(predictions, function(err, predicts) {

            satelliteData[satelliteID].predicts.startTime[predicts] = new Date(predictions[predicts].start);
            satelliteData[satelliteID].predicts.endTime[predicts] = new Date(predictions[predicts].end);
            satelliteData[satelliteID].predicts.duration[predicts] = predictions[predicts].duration * 1.6666666666667E-5;

        });

    });

    return satelliteData;

};