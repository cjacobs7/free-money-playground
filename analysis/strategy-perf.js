const fs = require('mz/fs');
const mapLimit = require('promise-map-limit');

const login = require('../rh-actions/login');
const getTrend = require('../utils/get-trend');
const avgArray = require('../utils/avg-array');
const jsonMgr = require('../utils/json-mgr');
// const lookup = require('../utils/lookup');
const chunkApi = require('../utils/chunk-api');
const filterByTradeable = require('../utils/filter-by-tradeable');

let Robinhood;

const analyzeDay = async (day) => {
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

    quotes.forEach(({symbol, last_trade_price}) => {
        tickerLookups[symbol] = Number(last_trade_price);
    });

    // calc trend and avg for each strategy-min
    const withTrend = [];
    Object.keys(strategyPicks).forEach(stratMin => {
        const picks = strategyPicks[stratMin];
        const picksWithTrend = filterByTradeable(picks.map(({ticker}) => ticker))
            .map(ticker => picks.find(pick => pick.ticker === ticker))
            .map(({ticker, price}) => ({
                ticker,
                thenPrice: price,
                nowPrice: tickerLookups[ticker],
                trend: getTrend(tickerLookups[ticker], price)
            }))
            .filter(({nowPrice}) => nowPrice > 0.01);
        withTrend.push({
            strategyName: stratMin,
            avgTrend: avgArray(picksWithTrend.map(pick => pick.trend)),
            picks: picksWithTrend
        });
    });


    const sortedByAvgTrend = withTrend
        .filter(trend => trend.avgTrend)
        .sort((a, b) => b.avgTrend - a.avgTrend);

    console.log(JSON.stringify(sortedByAvgTrend, null, 2));


};

(async () => {

    Robinhood = await login();

    let folders = await fs.readdir('./picks-data');

    let sortedFolders = folders.sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    console.log(sortedFolders);

    await analyzeDay(sortedFolders[sortedFolders.length - 1]);

    // calcStratPerf('2018-1-18');
    // sortedFiles.forEach(calcStratPerf);

})();
