const puppeteer = require('puppeteer');
const regCronIncAfterSixThirty = require('../../utils/reg-cron-after-630');
const registerPicks = require('../../app-actions/record-picks');

const FIZBIZ = require('./fizbiz');
const STOCKINVEST = require('./stockinvest');



// based on jump
const finbizScrapes = {
    init: (Robinhood) => {
        // runs at init
        regCronIncAfterSixThirty(Robinhood, {
            name: 'record fizbiz-scrapes',
            // run: [15], // 7:00am
            run: FIZBIZ.config.RUN,
            fn: async (Robinhood, min) => {

                console.log('running fizbiz');
                const browser = await puppeteer.launch({headless: true });
                const queries = Object.keys(FIZBIZ.config.QUERIES);
                for (let queryName of queries) {
                    console.log(queryName);
                    const queryPicks = await FIZBIZ.scrapeFizbiz(browser, FIZBIZ.config.QUERIES[queryName]);
                    console.log(queryName, queryPicks);
                    await registerPicks(Robinhood, `fizbiz-${queryName}`, min, queryPicks);
                }

            }
        });

        regCronIncAfterSixThirty(Robinhood, {
            name: 'record stockinvest-scrapes',
            // run: [15], // 7:00am
            run: STOCKINVEST.config.RUN,
            fn: async (Robinhood, min) => {

                console.log('running stockinvest-scrapes');
                const browser = await puppeteer.launch({headless: false });
                const queries = Object.keys(STOCKINVEST.config.QUERIES);
                for (let queryName of queries) {
                    console.log(queryName);
                    const queryPicks = await STOCKINVEST.scrapeStockInvest(browser, STOCKINVEST.config.QUERIES[queryName]);
                    console.log(queryName, queryPicks);
                    await registerPicks(Robinhood, `stockinvest-${queryName}`, min, queryPicks);
                }

            }
        });

    }
};

module.exports = finbizScrapes;
