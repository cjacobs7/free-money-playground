const allStocks = require('../stock-data/allStocks');
const filterByTradeable = stocks => {
    const areTradeable = [];
    for (let ticker of stocks) {
        const foundObj = allStocks.find(obj => obj.symbol === ticker);
        if (foundObj && foundObj.tradeable && foundObj.tradability === 'tradable') {
            areTradeable.push(ticker);
        }
    }
    console.log('not tradeable', stocks.filter(ticker => !areTradeable.includes(ticker)));
    return areTradeable;
};

module.exports = filterByTradeable;
