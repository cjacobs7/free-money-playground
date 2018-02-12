const DISABLED = true; // records picks but does not purchase

// utils
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');

// app-actions
const executeStrategy = require('../app-actions/execute-strategy');

// npm
const mapLimit = require('promise-map-limit');

// rh-actions
const getRisk = require('../rh-actions/get-risk');
const trendingUp = require('../rh-actions/trending-up');
const addOvernightJump = require('../app-actions/add-overnight-jump');

const trendFilter = async (Robinhood, trend) => {
    // stocks that went down overnight
    // trending upward
    console.log('running based-on-jump strategy');

    const cheapBuys = trend.filter(stock => {
        return Number(stock.quote_data.last_trade_price) > 0.3 && Number(stock.quote_data.last_trade_price) < 5;
    });

    console.log('total cheapbuys', cheapBuys.length);

    let downOvernight = await addOvernightJump(Robinhood, cheapBuys);
    downOvernight = downOvernight.filter(stock => stock.overnightJump < -4);

    downOvernight = await mapLimit(cheapBuys, 20, async buy => ({
        ...buy,
        ...(await getRisk(Robinhood, buy.ticker)),
        trendingUp: await trendingUp(Robinhood, buy.ticker, [35, 25, 7])
    }));

    console.log(
        'num not trending',
        downOvernight.filter(buy => !buy.trendingUp).length
    );
    console.log(
        '> 8% below max of year',
        downOvernight.filter(buy => buy.percMax > -8).length
    );
    downOvernight = downOvernight.filter(buy => buy.trendingUp && buy.percMax < -8);

    console.log(cheapBuys, downOvernight.length);
    return downOvernight.map(stock => stock.ticker);
};

// based on jump
const basedOnJump = {
    trendFilter,

    init: (Robinhood) => {
        // runs at init
        regCronIncAfterSixThirty(Robinhood, {
            name: 'record based-on-jump strategy',
            run: [15], // 7:00am
            fn: async (Robinhood, min) => {
                setTimeout(async () => {
                    await executeStrategy(Robinhood, trendFilter, min, 0.2, 'based-on-jump', DISABLED);
                }, 5000);
            }
        });
    }
};

module.exports = basedOnJump;
