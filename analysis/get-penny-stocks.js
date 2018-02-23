const login = require('../rh-actions/login');
const getTrendAndSave = require('../app-actions/get-trend-and-save');

let Robinhood;

(async () => {

    Robinhood = await login();
    let trend = await getTrendAndSave(Robinhood);
    const pennies = trend
        .filter(stock => {
            return Number(stock.last_trade_price) < 1.5 && Number(stock.last_trade_price) > 0.5;
        })
        // .map(stock => ({
        //     ticker: stock.ticker,
        //     last_trade_price: stock.last_trade_price
        // }))
        // .sort((a, b) => Number(b.fundamentals.pe_ratio) - Number(a.fundamentals.pe_ratio))
        // .slice(0, 100)
        .sort((a, b) => Number(a.last_trade_price) - Number(b.last_trade_price))
        .map(a => a.ticker);
    console.log(JSON.stringify(pennies, null, 2))


})();


module.exports = async (Robinhood, trend) => {

    return trend
        .filter(stock => {
            return Number(stock.last_trade_price) < 3// && stock.fundamentals.trend_since_open && stock.fundamentals.pe_ratio;
        })
        // .map(stock => ({
        //     ticker: stock.ticker,
        //     last_trade_price: stock.last_trade_price
        // }))
        // .sort((a, b) => Number(b.fundamentals.pe_ratio) - Number(a.fundamentals.pe_ratio))
        // .slice(0, 100)
        .sort((a, b) => Number(a.last_trade_price) - Number(b.last_trade_price))

};
