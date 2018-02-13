const DISABLED = true; // records picks but does not purchase

// utils
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');

// app-actions
const executeStrategy = require('../app-actions/execute-strategy');
const addTrendSinceOpen = require('../app-actions/add-trend-since-open');
// npm
const mapLimit = require('promise-map-limit');

// rh-actions
const getRisk = require('../rh-actions/get-risk');
// const trendingUp = require('../rh-actions/trending-up');

const trendFilter = async (Robinhood, trend) => {
    // cheap stocks that are going up the most for the day

    console.log('running big-day-trend-up strategy');

    console.log('total trend stocks', trend.length);

    let cheapBuys = trend.filter(stock => {
        return Number(stock.quote_data.last_trade_price) < 6;
    });

    console.log('trading below $6', cheapBuys.length);
    const withTrendSinceOpen = await addTrendSinceOpen(Robinhood, cheapBuys);
    const allUp = withTrendSinceOpen.filter(
        stock => stock.trendSinceOpen && stock.trendSinceOpen > 3
    );
    console.log('trendingUp', allUp.length);


    cheapBuys = await mapLimit(cheapBuys, 20, async buy => ({
        ...buy,
        ...(await getRisk(Robinhood, buy.ticker)),
    }));

    console.log(
        'num watcout',
        cheapBuys.filter(buy => buy.shouldWatchout).length
    );
    console.log(
        '> 8% below max of year',
        cheapBuys.filter(buy => buy.percMax > -8).length
    );
    cheapBuys = cheapBuys.filter(
        buy => !buy.shouldWatchout && buy.percMax < -8
    );

    console.log(cheapBuys, cheapBuys.length);
    return cheapBuys
        .sort((a, b) => b.trendSinceOpen - a.trendSinceOpen)
        .slice(0, 5)    // top five trending up
        .map(stock => stock.ticker);
};

const bigDayTrendUp = {
    trendFilter,
    init: Robinhood => {
        // runs at init
        regCronIncAfterSixThirty(Robinhood, {
            name: 'execute big-day-trend-up strategy',
            run: [10, 30, 90, 223], // 10:41am, 11:31am
            // run: [],
            fn: async (Robinhood, min) => {
                await executeStrategy(Robinhood, trendFilter, min, 0.3, 'big-day-trend-up', DISABLED);
            }
        });
    }
};

module.exports = bigDayTrendUp;
