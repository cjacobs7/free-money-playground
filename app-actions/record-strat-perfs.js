const fs = require('mz/fs');

const getTrend = require('../utils/get-trend');
const avgArray = require('../utils/avg-array');
const jsonMgr = require('../utils/json-mgr');
// const lookup = require('../utils/lookup');
const chunkApi = require('../utils/chunk-api');

const analyzeDay = async (Robinhood, day) => {

    let files = await fs.readdir(`./picks-data/${day}`);
    console.log(files);

    const tickerLookups = {};
    const strategyPicks = {};

    // load data from picks-data and keep track of tickers to lookup
    for (let file of files) {
        const strategyName = file.split('.')[0];
        const obj = await jsonMgr.get(`./picks-data/${day}/${file}`);
        // console.log(strategyName);
        // console.log(obj);

        for (let min of Object.keys(obj)) {
            // for each strategy run
            strategyPicks[`${strategyName}-${min}`] = obj[min];
            obj[min].forEach(({ticker}) => {
                tickerLookups[ticker] = null;
            });
        }
    }

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

    // calc trend and avg for each strategy-min
    const withTrend = [];
    Object.keys(strategyPicks).forEach(stratMin => {
        const picks = strategyPicks[stratMin];
        const picksWithTrend = picks.map(({ticker, price}) => ({
            ticker,
            thenPrice: price,
            nowPrice: tickerLookups[ticker],
            trend: getTrend(tickerLookups[ticker], price)
        }));
        withTrend.push({
            strategyName: stratMin,
            avgTrend: avgArray(picksWithTrend.map(pick => pick.trend))
            // picks: picksWithTrend
        });
    });


    const sortedByAvgTrend = withTrend
        .filter(trend => trend.avgTrend)
        .sort((a, b) => b.avgTrend - a.avgTrend);

    // console.log(JSON.stringify(sortedByAvgTrend, null, 2));

    return sortedByAvgTrend;

};

module.exports = async (Robinhood, min) => {

    // console.log('running record')
    // console.log(Robinhood, min);
    let folders = await fs.readdir('./picks-data');
    // console.log(folders);

    let sortedFolders = folders.sort((a, b) => {
        return new Date(a) - new Date(b);
    });


    console.log(sortedFolders);

    const prevDayDate = sortedFolders[sortedFolders.length - 2];
    const analyzed = await analyzeDay(Robinhood, prevDayDate);

    const curStratPerfs = await jsonMgr.get(`./strat-perfs/${prevDayDate}.json`) || {};
    curStratPerfs[`next-day-${min}`] = analyzed;
    await jsonMgr.save(`./strat-perfs/${prevDayDate}.json`, curStratPerfs);
    console.log('saved strat-perfs!')
};
