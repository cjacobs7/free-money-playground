const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');
const lookup = require('../utils/lookup');
const mapLimit = require('promise-map-limit');

module.exports = async (Robinhood, strategy, min, picks) => {

    const dateStr = (new Date()).toLocaleDateString();
    const fileLocation = `./picks-data/${dateStr}/${strategy}.json`;
    // create day directory if needed
    if (!(await fs.exists(`./picks-data/${dateStr}`))) {
        await fs.mkdir(`./picks-data/${dateStr}`);
    }

    console.log('getting prices', picks);
    const withPrices = await mapLimit(picks, 1, async ticker => ({
        ticker,
        price: (await lookup(Robinhood, ticker)).currentPrice
    }));
    console.log('saving', strategy, 'picks', withPrices);
    const curData = await jsonMgr.get(fileLocation);
    const savedData = {
        ...curData,
        [min]: withPrices
    };
    await jsonMgr.save(fileLocation, savedData);

};
