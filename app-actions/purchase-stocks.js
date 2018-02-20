const limitBuyMultiple = require('./limit-buy-multiple');
const getMinutesFrom630 = require('../utils/get-minutes-from-630');

const purchaseStocks = async (Robinhood, { stocksToBuy, strategy }) => {
    const accounts = await Robinhood.accounts();
    // const ratioToSpend = Math.max(0.3, getMinutesFrom630() / 390);
    const cashAvailable = Number(accounts.results[0].sma);
    // const totalAmtToSpend = cashAvailable * ratioToSpend;

    const totalAmtToSpend = Math.min(80, cashAvailable);
    console.log('actually purchasing', strategy, 'count', stocksToBuy.length);
    // console.log('ratioToSpend', ratioToSpend);
    console.log('totalAmtToSpend', totalAmtToSpend);

    await limitBuyMultiple(Robinhood, {
        stocksToBuy,
        totalAmtToSpend,
        strategy
    });
};

module.exports = purchaseStocks;
