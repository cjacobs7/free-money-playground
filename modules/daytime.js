// utils
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');

// app-actions
const executeStrategy = require('../app-actions/execute-strategy');
const addTrendSinceOpen = require('../app-actions/add-trend-since-open');
// npm
const mapLimit = require('promise-map-limit');

// rh-actions
const getRisk = require('../rh-actions/get-risk');
const trendingUp = require('../rh-actions/trending-up');

const trendFilter = async (Robinhood, trend) => {
    // cheap stocks that are going up for the day
    // and up at many different intervals in the year, month ... etc

    console.log('running daytime strategy');

    console.log('total trend stocks', trend.length);

    const withTrendSinceOpen = await addTrendSinceOpen(Robinhood, trend);
    let allUp = withTrendSinceOpen.filter(
        stock => stock.trendSinceOpen && stock.trendSinceOpen > 3
    );
    console.log('trendingUp', allUp.length);


    let withTrendingUp = await mapLimit(allUp, 20, async buy => ({
        ...buy,
        ...(await getRisk(Robinhood, buy.ticker)),
        trendingUp: await trendingUp(Robinhood, buy.ticker, [
            // 50,
            30,
            10
        ])
    }));

    console.log(
        'num watcout',
        withTrendingUp.filter(buy => buy.shouldWatchout).length
    );
    console.log(
        'num not trending',
        withTrendingUp.filter(buy => !buy.trendingUp).length
    );

    withTrendingUp = withTrendingUp.filter(
        buy => !buy.shouldWatchout && buy.trendingUp
    );

    console.log(withTrendingUp, withTrendingUp.length);
    return withTrendingUp.map(stock => stock.ticker);
};

const daytime = {
    trendFilter,
    init: Robinhood => {
        // runs at init
        regCronIncAfterSixThirty(Robinhood, {
            name: 'execute daytime strategy',
            run: [200, 260], // 10:41am, 11:31am
            // run: [],
            fn: async (Robinhood, min) => {
                await executeStrategy(Robinhood, trendFilter, min, 0.3, 'daytime');
            }
        });
    }
};

module.exports = daytime;
