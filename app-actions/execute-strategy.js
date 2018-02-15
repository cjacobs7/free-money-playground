const cancelAllOrders = require('../rh-actions/cancel-all-orders');
const getTrendAndSave = require('./get-trend-and-save');
// const purchaseStocks = require('./purchase-stocks');
const recordPicks = require('./record-picks');

const executeStrategy = async (Robinhood, strategyFn, min, ratioToSpend, strategy) => {
    await cancelAllOrders(Robinhood);
    const trend = await getTrendAndSave(Robinhood, min + '*');
    const toPurchase = await strategyFn(Robinhood, trend);
    console.log(toPurchase, 'toPurchase');

    const record = async (stocks, strategyName) => {
        await recordPicks(Robinhood, strategyName, min, stocks);
    };

    // gives ability to return an object from a trendFilter with multiple "variations"
    if (!Array.isArray(toPurchase)) {
        // its an object
        Object.keys(toPurchase).forEach(async strategyName => {
            const subsetToPurchase = toPurchase[strategyName];
            await record(subsetToPurchase, `${strategy}-${strategyName}`);
        });
    } else {
        await record(toPurchase, strategy);
    }


};

module.exports = executeStrategy;
