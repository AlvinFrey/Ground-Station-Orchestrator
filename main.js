
require('dotenv').config();

//require('./processing/automatic');
//require('./explorer/index');

/*const scheduler = require('node-schedule');
CronDate = require('cron-parser/lib/date');

scheduler.scheduleJob("test",new Date(2018, 1, 1), function(){

    console.log("Bonne année !!!!")

});

console.log(scheduler.scheduledJobs.test);
console.log(scheduler.scheduledJobs.test.nextInvocation());
*/

require('./admin/index');