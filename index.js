

// console.log(stocks);
const login = require('./rh-actions/login');
// const initCrons = require('./app-actions/init-crons');
const initModules = require('./app-actions/init-modules');

const getAllTickers = require('./rh-actions/get-all-tickers');
const cancelAllOrders = require('./rh-actions/cancel-all-orders');
const logPortfolioValue = require('./app-actions/log-portfolio-value');
// const getPennyStocks = require('./analysis/get-penny-stocks');
// const activeBuy = require('./app-actions/active-buy');


let Robinhood, allTickers;

const regCronIncAfterSixThirty = require('./utils/reg-cron-after-630');
// const rh = require('./shared-async/rh');
const sellAllIfWentUp = require('./app-actions/sell-all-if-went-up');
// const up10days = require('./strategies/up-10-days');
// const getUpStreak = require('./app-actions/get-up-streak');

(async () => {

    Robinhood = await login();
    // console.log(await getUpStreak(Robinhood, 'AAPL', 3));
    // await up10days.trendFilter(Robinhood, require('/Users/johnmurphy/Development/my-stuff/robinhood-playground/stock-data/2018-1-22 12:53:02 (+380*).json'));

    // console.log(await getPennyStocks(Robinhood, require('/Users/johnmurphy/Development/my-stuff/robinhood-playground/stock-data/2018-1-23 13:04:23 (+391).json')));
    // await logPortfolioValue(Robinhood);
    // does the list of stocks need updating?
    try {
        allTickers = require('./stock-data/allStocks');
    } catch (e) {
        allTickers = await getAllTickers(Robinhood);
    }
    allTickers = allTickers
        .filter(stock => stock.tradeable)
        .map(stock => stock.symbol);

    // await cancelAllOrders(Robinhood);

    await logPortfolioValue(Robinhood);

    await initModules(Robinhood);
    regCronIncAfterSixThirty.display();

    // startCrons();

})();
