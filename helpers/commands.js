
require('dotenv').config({path: '../.env'});
const moment = require('moment');

const NOAA_DEFAULT_SAMPLERATE = 44100;
const NOAA_DEFAULT_WAVRATE = 11025;

const OTHER_DEFAULT_SAMPLERATE = 44100;
const OTHER_DEFAULT_WAVRATE = 11025;

const DEFAULT_RAW_FILENAME = "iqdata.raw";
const DEFAULT_WAV_FILENAME = "converted.wav";

module.exports.recordRAW = function(satelliteID, satelliteInfos, directory, predictsID){

    let command = 'timeout -s SIGTERM '+ satelliteInfos.predicts.duration[predictsID] +'m ';

    if(satelliteInfos.type == 'noaa'){

        command += 'rtl_fm -f '+ satelliteInfos.frequency +'M -s '+ NOAA_DEFAULT_SAMPLERATE +' -g 43 -F 9 -A fast -E dc -M raw - ';

        command += '| doppler track -s '+ NOAA_DEFAULT_SAMPLERATE;
        command += ' -i i16 ';
        command += ' --tlefile /opt/tle/'+ satelliteInfos.type +'.txt';
        command += ' --tlename "'+ satelliteInfos.tleName +'"';
        command += ' --location lat='+ process.env.GROUND_STATION_LATITUDE +',lon='+ process.env.GROUND_STATION_LONGITUDE +',alt='+ process.env.GROUND_STATION_ALTITUDE;
        command += ' --frequency '+ satelliteInfos.frequency * 1000000;
        command += ' > '+ directory +'/'+ DEFAULT_RAW_FILENAME;

    }else if(satelliteInfos.type == 'stations' || satelliteInfos.type == 'cubesat'){

        command += 'rtl_fm -f '+ satelliteInfos.frequency +'M -s '+ OTHER_DEFAULT_SAMPLERATE +' -g 43 -F 9 -A fast -E dc -M raw - ';

        command += '| doppler track -s '+ OTHER_DEFAULT_SAMPLERATE;
        command += ' -i i16 ';
        command += ' --tlefile /opt/tle/'+ satelliteInfos.type +'.txt';
        command += ' --tlename "'+ satelliteInfos.tleName +'"';
        command += ' --location lat='+ process.env.GROUND_STATION_LATITUDE +',lon='+ process.env.GROUND_STATION_LONGITUDE +',alt='+ process.env.GROUND_STATION_ALTITUDE;
        command += ' --frequency '+ satelliteInfos.frequency * 1000000;
        command += ' > '+ directory +'/'+ DEFAULT_RAW_FILENAME;

    }

    return command;

};

module.exports.transcoding = function(satelliteID, satelliteInfos, directory){

    let command = 'sox -t raw -r ';

    if(satelliteInfos.type == 'noaa'){

        command += NOAA_DEFAULT_SAMPLERATE;
        command += ' -es';
        command += ' -b 16';
        command += ' -c 1';
        command += ' -V1 ';
        command += directory + '/' + DEFAULT_RAW_FILENAME + ' ';
        command += directory + '/' + DEFAULT_WAV_FILENAME;
        command += ' rate ' + NOAA_DEFAULT_WAVRATE;

    }else if(satelliteInfos.type == 'stations' || satelliteInfos.type == 'cubesat'){

        command += OTHER_DEFAULT_SAMPLERATE;
        command += ' -es';
        command += ' -b 16';
        command += ' -c 1';
        command += ' -V1 ';
        command += directory + '/' + DEFAULT_RAW_FILENAME + ' ';
        command += directory + '/' + DEFAULT_WAV_FILENAME;
        command += ' rate ' + OTHER_DEFAULT_WAVRATE;

    }

    return command;

};

module.exports.decodeAPT = function(satelliteID, directory){

    return 'aptdec -d ' + directory + '/images -i rabct -s ' + satelliteID.replace('NOAA ', '');

};