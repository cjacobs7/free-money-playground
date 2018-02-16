const mapLimit = require('promise-map-limit');

const login = require('../rh-actions/login');


const jsonMgr = require('../utils/json-mgr');
const getTrend = require('../utils/get-trend');
// const lookup = require('../utils/lookup');
const avgArray = require('../utils/avg-array');
const chunkApi = require('../utils/chunk-api');

const sumArray = arr => arr.reduce((acc, val) => acc + val, 0);

(async () => {
    let Robinhood = await login();

    const date = new Date();
    // date.setDate(date.getDate() - 1);
    const curDate = (date).toLocaleDateString();
    const todayFile = `./daily-transactions/${curDate}.json`;
    const todayTransactions = await jsonMgr.get(todayFile) || [];

    const tickerLookups = {};
    const stratTrans = {};
    todayTransactions
        .filter(t => t.type === 'buy')
        .forEach(t => {
            stratTrans[t.strategy] = (stratTrans[t.strategy] || []).concat([t]);
            tickerLookups[t.ticker] = null;
        });

    // lookup prices of all tickers (chunked)
    const tickersToLookup = Object.keys(tickerLookups);
    let quotes = await chunkApi(
        tickersToLookup,
        async (tickerStr) => {
            // console.log('ti', tickerStr);
            const { results } = await Robinhood.url(`https://api.robinhood.com/quotes/?symbols=${tickerStr}`);
            return results;
        },
        1630
    );

    quotes.forEach(quote => {
        if (!quote) return;
        const {symbol, last_trade_price} = quote;
        tickerLookups[symbol] = Number(last_trade_price);
    });

    for (let strategyName of Object.keys(stratTrans)) {
        stratTrans[strategyName] = stratTrans[strategyName].map(t => {
            const nowPrice = tickerLookups[t.ticker];
            const trend = getTrend(tickerLookups[t.ticker], t.bid_price);
            return {
                ...t,
                nowPrice,
                trend,
                totalInvested: t.quantity * t.bid_price,
                dollarChange: t.quantity * (nowPrice - t.bid_price)
            };
        });
    }


    Object.keys(stratTrans).forEach(strategyName => {
        const avgTrend = avgArray(stratTrans[strategyName].map(t => t.trend));
        stratTrans[strategyName] = {
            avgTrend,
            totalInvested: sumArray(stratTrans[strategyName].map(t => t.totalInvested)),
            dollarChange: sumArray(stratTrans[strategyName].map(t => t.dollarChange)),
            transactions: stratTrans[strategyName]
        };
    });
    console.log(JSON.stringify(stratTrans, null, 2));

    console.log('\nCurrent report for ', curDate);
    console.log('Strategies')
    Object.keys(stratTrans).forEach(strategyName => {
        const { totalInvested, dollarChange, avgTrend } = stratTrans[strategyName];
        console.log('\n' + strategyName);
        console.log('total invested: ', totalInvested);
        console.log('dollarChange: ', dollarChange);
        console.log('avg trend: ', avgTrend);
        console.log('actual trend: ', getTrend(totalInvested + dollarChange, totalInvested));
    });

    const arrayFromProp = (prop) => Object.keys(stratTrans).map(strategyName => stratTrans[strategyName][prop]);
    const totalInvested = sumArray(arrayFromProp('totalInvested'));
    const dollarChange = sumArray(arrayFromProp('dollarChange'));
    const overallStats = {
        totalInvested,
        dollarChange,
        trend: getTrend(totalInvested + dollarChange, totalInvested)
    };
    console.log('\noverall')
    console.log(overallStats);

})();
