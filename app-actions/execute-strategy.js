const cancelAllOrders = require('../rh-actions/cancel-all-orders');
const getTrendAndSave = require('./get-trend-and-save');
// const purchaseStocks = require('./purchase-stocks');
const recordPicks = require('./record-picks');

const executeStrategy = async (Robinhood, strategyFn, min, ratioToSpend, strategy) => {

    const record = async (stocks, strategyName) => {
        await recordPicks(Robinhood, strategyName, min, stocks);
    };

    await cancelAllOrders(Robinhood);
    const trend = await getTrendAndSave(Robinhood, min + '*');

    const pricePerms = {
        under5: [0.3, 5],
        fiveTo10: [5, 10],
        tenTo15: [10, 15]
    };

    for (let priceKey of Object.keys(pricePerms)) {

        const trendFilteredByPricePerm = trend.filter(stock => {
            return Number(stock.quote_data.last_trade_price) > pricePerms[priceKey][0] && Number(stock.quote_data.last_trade_price) < pricePerms[priceKey][1];
        });
        const toPurchase = await strategyFn(Robinhood, trendFilteredByPricePerm);
        console.log(toPurchase, 'toPurchase');

        // gives ability to return an object from a trendFilter with multiple "variations"

        const priceFilterSuffix = (priceKey === 'under5') ? '' : `-${priceKey}`;

        if (!Array.isArray(toPurchase)) {
            // its an object
            Object.keys(toPurchase).forEach(async strategyName => {
                const subsetToPurchase = toPurchase[strategyName];
                await record(subsetToPurchase, `${strategy}-${strategyName}${priceFilterSuffix}`);
            });
        } else {
            await record(toPurchase, `${strategy}${priceFilterSuffix}`);
        }

    }


};

module.exports = executeStrategy;
