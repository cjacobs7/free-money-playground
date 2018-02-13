const puppeteer = require('puppeteer');
const regCronIncAfterSixThirty = require('../../utils/reg-cron-after-630');
const registerPicks = require('../../app-actions/record-picks');

const FIZBIZ = require('./fizbiz');
const STOCKINVEST = require('./stockinvest');

const scrapesToRun = {
    fizbiz: FIZBIZ,
    stockinvest: STOCKINVEST
};

const allStocks = require('../../stock-data/allStocks');
const filterByTradeable = stocks => {
    const areTradeable = [];
    for (let ticker of stocks) {
        const foundObj = allStocks.find(obj => obj.symbol === ticker);
        if (foundObj && foundObj.tradeable) {
            areTradeable.push(ticker);
        }
    }
    console.log('not tradeable', stocks.filter(ticker => !areTradeable.includes(ticker)));
    return areTradeable;
};

// based on jump
const finbizScrapes = {
    init: (Robinhood) => {
        // runs at init
        Object.keys(scrapesToRun).forEach(scrapeName => {
            const { config, scrapeFn } = scrapesToRun[scrapeName];
            regCronIncAfterSixThirty(Robinhood, {
                name: `record ${scrapeName}-scrapes`,
                // run: [15], // 7:00am
                run: config.RUN,
                fn: async (Robinhood, min) => {

                    console.log(`running ${scrapeName}-scrapes`);
                    const browser = await puppeteer.launch({headless: true });
                    const queries = Object.keys(config.QUERIES);
                    for (let queryName of queries) {
                        console.log(queryName);
                        const queryPicks = await scrapeFn(browser, config.QUERIES[queryName]);
                        const tradeablePicks = filterByTradeable(queryPicks);
                        // console.log(queryName, queryPicks);
                        await registerPicks(Robinhood, `${scrapeName}-${queryName}`, min, tradeablePicks);
                    }
                    await browser.close();
                }
            });

        });


    }
};

module.exports = finbizScrapes;
