
require('dotenv').config({path: '../.env'});
const spacetrack = require('../helpers/spacetrack');
const satellites = require('../helpers/satellites');
const exec = require('child-process-promise').exec;
const commands = require('../helpers/commands');
const scheduler = require('node-schedule');
const moment = require('moment');
const shell = require('shelljs');
const async = require('async');

console.log("[AUTOMATIC PROCESSING] Downloading latest TLE files from Spacetrack and Celestrak");

exec('tle_dl').then(function () {

    spacetrack.getTLE().then(function(satList){

        const satellitesInfos = satellites.formatSatelliteInfos(satList);

        async.forEachOf(satellitesInfos, function(err, satelliteID) {

            async.forEachOf(satellitesInfos[satelliteID].predicts.startTime, function(err, predictsID) {

                const directory = process.env.STORAGE_FOLDER + satelliteID.replace(' ', '') + "_" + moment(new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID])).format("YYYY-MM-DD_HH:mm:ss");

                if(satellitesInfos[satelliteID].type == 'noaa'){

                    console.log(scheduler.scheduledJobs);

                    const schedule = scheduler.scheduleJob(new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]), function(){

                        console.log('[AUTOMATIC PROCESSING] ' + satelliteID + ' pass ('+ new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]) +') has started and the system begin to listen to listen the data of the sat');

                        shell.mkdir('-p', directory);

                        exec(commands.recordRAW(satelliteID, satellitesInfos[satelliteID], directory, predictsID), {maxBuffer: 1024 * 1000}).then(function () {

                            exec(commands.transcoding(satelliteID, satellitesInfos[satelliteID], directory), {maxBuffer: 1024 * 1000}).then(function () {

                                shell.mkdir('-p', directory + '/images/');

                                exec(commands.decodeAPT(satelliteID, directory), {maxBuffer: 1024 * 1000}).then(function () {

                                    console.log('[AUTOMATIC PROCESSING] ' + satelliteID + ' pass ('+ new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]) +') has been successfully recorded and saved on our system');

                                }).catch(function(error){

                                    console.log('[APT DECODING] ' + error);

                                });

                            }).catch(function(error){

                                console.log('[TRANSCODING] ' + error);

                            });

                         }).catch(function(error){

                            console.log('[RAW RECORDING] ' + error);

                         });

                    });

                }else if(satellitesInfos[satelliteID].type == 'stations' || satellitesInfos[satelliteID].type == 'cubesat'){

                    console.log(scheduler.scheduledJobs);

                    const schedule = scheduler.scheduleJob(new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]), function(){

                        console.log('[AUTOMATIC PROCESSING] ' + satelliteID + ' pass ('+ new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]) +') has started and the system begin to listen to listen the data of the sat');

                        shell.mkdir('-p', directory);

                        exec(commands.recordRAW(satelliteID, satellitesInfos[satelliteID], directory, predictsID), {maxBuffer: 1024 * 1000}).then(function () {

                            exec(commands.transcoding(satelliteID, satellitesInfos[satelliteID], directory), {maxBuffer: 1024 * 1000}).then(function () {

                                console.log('[AUTOMATIC PROCESSING] ' + satelliteID + ' pass ('+ new Date(satellitesInfos[satelliteID].predicts.startTime[predictsID]) +') has been successfully recorded and saved on our system');

                            }).catch(function(error){

                                console.log('[TRANSCODING] ' + error);

                            });

                        }).catch(function(error){

                            console.log('[RAW RECORDING] ' + error);

                        });

                    });

                }

            });

        });

        console.log("[AUTOMATIC PROCESSING] Daily satellites passes are scheduled");

    }).catch(function(error){

        console.log('[TLE SPACETRACK] ' + error);

    });

}).catch(function (error) {

    console.error('[TLE DOWNLOAD] ' + error);

});
