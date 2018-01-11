const { CronJob } = require('cron');

const regCronIncAfterSixThirty = (Robinhood, { name, run, fn }) => {
    const d = new Date();
    d.setHours(6, 30);
    run.forEach((min, index) => {
        const newDateObj = new Date(d.getTime() + min * 60000);
        newDateObj.setSeconds(0);
        const cronStr = `${newDateObj.getMinutes()} ${newDateObj.getHours()} * * 1-5`;
        console.log(cronStr + ' - ' + name, newDateObj.toLocaleTimeString());
        new CronJob(cronStr, () => {
            console.log('starting cron: ', name);
            fn(Robinhood, min, index);
        }, null, true);
    });
};

module.exports = regCronIncAfterSixThirty;