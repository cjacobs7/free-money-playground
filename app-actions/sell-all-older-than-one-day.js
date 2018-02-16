const detailedNonZero = require('./detailed-non-zero');
const activeSell = require('./active-sell');

const MIN_PERC_UP = 6.5; // sell if stock rose 18% since yesterdays close

const daysBetween = (firstDate, secondDate) => {
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
    return diffDays;
};

module.exports = async Robinhood => {
    const nonzero = await detailedNonZero(Robinhood);
    const withAge = nonzero.map(pos => ({
        ...pos,
        dayAge: daysBetween(new Date(), new Date(pos.created_at))
    }));

    const olderThanADay = withAge.filter(pos => pos.dayAge > 0);

    console.log(nonzero.length, 'total', olderThanADay.length, 'olderThanADay');
    for (let pos of olderThanADay) {
        const sellRatio = (pos.dayAge === 1) ? 0.5 : 1;
        console.log('selling', sellRatio * 100, '% of', pos.symbol, 'age=', pos.dayAge);
        const numSharesToSell = pos.quantity * sellRatio;
        try {
            const response = await activeSell(
                Robinhood,
                {
                    ticker: pos.symbol,
                    quantity: numSharesToSell
                }
            );
            console.log('sold because olderThanADay', pos.symbol);
        } catch (e) {
            console.log('more err', e);
        }
    }

};
