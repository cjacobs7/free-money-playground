// utils
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');

// app-actions
const executeStrategy = require('../app-actions/execute-strategy');
const addTrendSinceOpen = require('../app-actions/add-trend-since-open');

const mapLimit = require('promise-map-limit');

const getRisk = require('../rh-actions/get-risk');
const trendingUp = require('../rh-actions/trending-up');

const trendFilter = async (Robinhood, trend) => {

    // cheap stocks that have gone down the most since open
    // but still going up recently 30 & 7 day trending
    // dont buy stocks that have fluctuated a lot before today

    console.log('running beforeClose strategy');
    const withTrendSinceOpen = await addTrendSinceOpen(Robinhood, trend);

    let trendingBelow5 = withTrendSinceOpen.filter(stock => stock.trendSinceOpen < -5);
    console.log('trending below 10', trendingBelow5.length);

    trendingBelow5 = await mapLimit(trendingBelow5, 20, async buy => ({
        ...buy,
        ...await getRisk(Robinhood, buy.ticker),
        trendingUp: await trendingUp(Robinhood, buy.ticker, [30, 7])
    }));
    console.log('num watcout', trendingBelow5.filter(buy => buy.shouldWatchout).length);
    console.log('num not trending', trendingBelow5.filter(buy => !buy.trendingUp).length);
    console.log('> 5% below max of year', trendingBelow5.filter(buy => buy.percMax < -5).length);
    trendingBelow5 = trendingBelow5.filter(buy => !buy.shouldWatchout && buy.trendingUp && buy.percMax < -5);

    console.log(trendingBelow5, trendingBelow5.length);

    return trendingBelow5.map(stock => stock.ticker);

};

const beforeClose = {
    trendFilter,
    init: (Robinhood) => {
        // runs at init
        regCronIncAfterSixThirty(
            Robinhood,
            {
                name: 'execute before-close strategy',
                run: [351, 381],  // 12:31, 12:50pm
                // run: [],
                fn: async (Robinhood, min) => {
                    await executeStrategy(Robinhood, trendFilter, min, 0.55, 'before-close');
                }
            },
        );
    }
};


module.exports = beforeClose;
