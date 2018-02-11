// lookup ticker last trade price
// ticker -> {
//     last_trade_price,
//     previous_close,
//     yahooPrice,
//     instrument
// }
const { lookup } = require('yahoo-stocks');

module.exports = async (ticker, Robinhood) => {
    const quoteData = await Robinhood.quote_data(ticker);
    const { last_trade_price, previous_close, instrument } = quoteData.results[0];
    let data = {
        lastTrade: Number(last_trade_price),
        prevClose: Number(previous_close),
        instrument
    };
    try {
        let yahooPrice = (await lookup(ticker)).currentPrice;
        data = {
            ...data,
            yahooPrice,
            currentPrice: yahooPrice || data.lastTrade
        };
    } catch (e) {}
    return data;
};
