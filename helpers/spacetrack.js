const spacetrack = require('spacetrack');
const async = require('async');
const fs = require('fs');

spacetrack.login({
    username: process.env.SPACETRACK_USERNAME,
    password: process.env.SPACETRACK_PASSWORD
}).catch(function(error){
    console.log(error);
});

module.exports.getTLE = function () {

    return new Promise((resolve, reject) => {

        let outputArray = [];

        fs.readFile('satellites.json', 'utf8', function (error, data) {

            const satellites = JSON.parse(data);

            let satelliteCondition = "";

            async.forEachOf(satellites, function (err, elementID, callback) {

                if (satellites[Object.keys(satellites)[Object.keys(satellites).length - 1]] !== satellites[elementID]) {
                    satelliteCondition += satellites[elementID].id + ",";
                    callback();
                } else {
                    satelliteCondition += satellites[elementID].id;
                    callback();
                }

            }, function(){

                spacetrack.get({

                    type: 'tle_latest',
                    formats: '3le',
                    query: [
                        {field: 'NORAD_CAT_ID', condition: satelliteCondition},
                        {field: 'ORDINAL', condition: '1'}
                    ]

                }).then(function (catalogResult) {

                    async.forEachOf(catalogResult, function (err, catalogElementID, callback) {

                        function filterID(element) {
                            return element.id === parseInt(catalogResult[catalogElementID].catalogNumber);
                        }

                        let selectedSat = satellites.find(filterID);

                        outputArray.push(selectedSat);

                        outputArray[(outputArray.length-1)]['catalogData'] = {
                            tle: catalogResult[catalogElementID].tle[0] + '\n' + catalogResult[catalogElementID].tle[1] + '\n' +catalogResult[catalogElementID].tle[2],
                            epoch: new Date(catalogResult[catalogElementID].epoch),
                            internationalDesignator: catalogResult[catalogElementID].intlDesignator,
                            orbitalPeriod: parseInt(catalogResult[catalogElementID].orbitalPeriod)
                        };

                        callback();

                    }, function(){

                        resolve(outputArray);

                    });

                }, function (err) {

                    reject(err.message);

                });

            });

        });

    });

};

module.exports.getSpecificTLE = function (satelliteID) {

    return new Promise((resolve, reject) => {

        spacetrack.get({

            type: 'tle_latest',
            formats: '3le',
            query: [
                {field: 'NORAD_CAT_ID', condition: satelliteID},
                {field: 'ORDINAL', condition: '1'}
                ]

        }).then(function (result) {

            resolve(result);

        });

    });

};