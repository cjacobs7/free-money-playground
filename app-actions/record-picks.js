const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');
const lookup = require('../utils/lookup');
const mapLimit = require('promise-map-limit');
const strategiesEnabled = require('../strategies-enabled');
const purchaseStocks = require('./purchase-stocks');
console.log(strategiesEnabled, 'strategies enabled ')
module.exports = async (Robinhood, strategy, min, picks) => {

    picks = picks.slice(0, 5);  // take only 5 picks

    console.log('recording', strategy, 'strategy');
    const dateStr = (new Date()).toLocaleDateString();
    const fileLocation = `./picks-data/${dateStr}/${strategy}.json`;
    // create day directory if needed
    if (!(await fs.exists(`./picks-data/${dateStr}`))) {
        await fs.mkdir(`./picks-data/${dateStr}`);
    }

    console.log('getting prices', picks);
    let withPrices = await mapLimit(picks, 1, async ticker => {
        try {
            return {
                ticker,
                price: (await lookup(Robinhood, ticker)).currentPrice
            };
        } catch (e) {
            return null;
        }
    });
    withPrices = withPrices.filter(tickerPrice => !!tickerPrice);

    console.log('saving', strategy, 'picks', withPrices);
    const curData = await jsonMgr.get(fileLocation);
    const savedData = {
        ...curData,
        [min]: withPrices
    };
    await jsonMgr.save(fileLocation, savedData);

    if (strategiesEnabled.includes(`${strategy}-${min}`)) {
        await purchaseStocks(Robinhood, {
            stocksToBuy: picks,
            ratioToSpend: 0.37,
            strategy
        });
    }


};
