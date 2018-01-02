
const jspredict = require('jspredict');
const moment = require('moment');
const async = require('async');

module.exports.formatSatelliteInfos = function(satellites){

    async.forEachOf(satellites, function (err, satelliteID, callback) {

        satellites[satelliteID]['predicts'] = {
            startTime: {},
            endTime: {},
            duration: {}
        };

        const predictions = jspredict.transits(
            satellites[satelliteID].catalogData.tle,
            [process.env.GROUND_STATION_LATITUDE, process.env.GROUND_STATION_LONGITUDE, process.env.GROUND_STATION_ALTITUDE],
            moment(),
            moment().add(1, 'days'),
            5
        );

        async.forEachOf(predictions, function(err, predicts) {

            satellites[satelliteID].predicts.startTime[predicts] = new Date(predictions[predicts].start);
            satellites[satelliteID].predicts.endTime[predicts] = new Date(predictions[predicts].end);
            satellites[satelliteID].predicts.duration[predicts] = predictions[predicts].duration * 1.6666666666667E-5;

        });

    });

    return satellites;

};