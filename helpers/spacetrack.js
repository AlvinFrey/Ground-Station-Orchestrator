
const spacetrack = require('spacetrack');

spacetrack.login({
    username: process.env.SPACETRACK_USERNAME,
    password: process.env.SPACETRACK_PASSWORD
});

module.exports.getTLE = function(){

    return new Promise((resolve, reject) => {

        spacetrack.get({

            type: 'tle_latest',
            formats: '3le',
            query: [
                {field: 'NORAD_CAT_ID', condition: '25338,28654,33591,25544,39444'},
                {field: 'ORDINAL', condition: '1'}
            ],
            orderby: [
                '+TLE_LINE1'
            ]

        }).then(function (result) {

            resolve({
                'NOAA 15': {
                    epoch: result[0].epoch,
                    tle: result[0].tle[0] + '\n' + result[0].tle[1] + '\n' + result[0].tle[2]
                },
                'NOAA 18': {
                    epoch: result[2].epoch,
                    tle: result[2].tle[0] + '\n' + result[2].tle[1] + '\n' + result[2].tle[2]
                },
                'NOAA 19': {
                    epoch: result[3].epoch,
                    tle: result[3].tle[0] + '\n' + result[3].tle[1] + '\n' + result[3].tle[2]
                },
                'ISS': {
                    epoch: result[1].epoch,
                    tle: result[1].tle[0] + '\n' + result[1].tle[1] + '\n' + result[1].tle[2]
                },
                'FUNCUBE-1': {
                    epoch: result[4].epoch,
                    tle: result[4].tle[0] + '\n' + result[4].tle[1] + '\n' + result[4].tle[2]
                }
            });

        }, function (err) {

            reject(err.message);

        });

    });

};