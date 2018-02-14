const cancelAllOrders = require('../rh-actions/cancel-all-orders');
const getTrendAndSave = require('./get-trend-and-save');
const purchaseStocks = require('./purchase-stocks');
const recordPicks = require('./record-picks');

const executeStrategy = async (Robinhood, strategyFn, min, ratioToSpend, strategy, skipPurchaseFlag) => {
    await cancelAllOrders(Robinhood);
    const trend = await getTrendAndSave(Robinhood, min + '*');
    const toPurchase = await strategyFn(Robinhood, trend);
    console.log(toPurchase, 'toPurchase');

    const purchaseStocks = async (stocks, strategyName) => {
        await recordPicks(Robinhood, strategyName, min, stocks);
        if (skipPurchaseFlag) return;
        await purchaseStocks(Robinhood, {
            stocksToBuy: stocks,
            ratioToSpend,
            strategy: strategyName
        });
    };

    // gives ability to return an object from a trendFilter with multiple "variations"
    if (!Array.isArray(toPurchase)) {
        // its an object
        Object.keys(toPurchase).forEach(async strategyName => {
            const subsetToPurchase = toPurchase[strategyName];
            await purchaseStocks(subsetToPurchase, `${strategy}-${strategyName}`);
        });
    } else {
        await purchaseStocks(toPurchase, strategy);
    }


};

module.exports = executeStrategy;
