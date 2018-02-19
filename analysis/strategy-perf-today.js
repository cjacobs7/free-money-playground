// gets current strategy performance of picks TODAY

const fs = require('mz/fs');
const login = require('../rh-actions/login');
const { analyzeDay } = require('../app-actions/record-strat-perfs');

let Robinhood;

(async () => {

    Robinhood = await login();

    let folders = await fs.readdir('./picks-data');

    let sortedFolders = folders.sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    console.log(sortedFolders);

    console.log(JSON.stringify(await analyzeDay(Robinhood, sortedFolders[sortedFolders.length - 1]), null, 2));

    // calcStratPerf('2018-1-18');
    // sortedFiles.forEach(calcStratPerf);

})();
