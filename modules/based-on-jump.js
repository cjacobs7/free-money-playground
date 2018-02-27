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
    // stocks that went up overnight and
    // trending upward
    console.log('running based-on-jump strategy');

    let upOvernight = await addOvernightJump(Robinhood, trend);
    upOvernight = upOvernight.filter(stock => stock.overnightJump > 3);

    upOvernight = await mapLimit(upOvernight, 20, async buy => ({
        ...buy,
        ...(await getRisk(Robinhood, buy.ticker)),
        trendingUp: await trendingUp(Robinhood, buy.ticker, [35, 25, 7])
    }));

    console.log(
        'num not trending',
        upOvernight.filter(buy => !buy.trendingUp).length
    );
    console.log(
        '> 8% below max of year',
        upOvernight.filter(buy => buy.percMax > -8).length
    );
    upOvernight = upOvernight.filter(buy => buy.trendingUp && buy.percMax < -8);

    console.log(upOvernight, upOvernight.length);
    return upOvernight
        .sort((a, b) => a.percMax - b.percMax)
        .slice(0, 15)
        .map(stock => stock.ticker);
};

// based on jump
const basedOnJump = {
    trendFilter,

    init: (Robinhood) => {
        // runs at init
        regCronIncAfterSixThirty(Robinhood, {
            name: 'record based-on-jump strategy',
            run: [5, 16, 30], // 7:00am
            fn: async (Robinhood, min) => {
                setTimeout(async () => {
                    await executeStrategy(Robinhood, trendFilter, min, 0.2, 'based-on-jump');
                }, 5000);
            }
        });
    }
};

module.exports = basedOnJump;
