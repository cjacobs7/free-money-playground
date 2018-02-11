const cancelAllOrders = require('../rh-actions/cancel-all-orders');
const getTrendAndSave = require('./get-trend-and-save');
const purchaseStocks = require('./purchase-stocks');
const recordPicks = require('./record-picks');

const executeStrategy = async (Robinhood, strategyFn, min, ratioToSpend, strategy, skipPurchaseFlag) => {
    await cancelAllOrders(Robinhood);
    const trend = await getTrendAndSave(Robinhood, min + '*');
    const toPurchase = await strategyFn(Robinhood, trend);
    await recordPicks(strategy, min, toPurchase);
    if (skipPurchaseFlag) return;
    await purchaseStocks(Robinhood, {
        stocksToBuy: toPurchase,
        ratioToSpend,
        strategy
    });
};

module.exports = executeStrategy;
