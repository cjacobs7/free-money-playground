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
    const olderThanADay = nonzero.filter(pos => {
        return pos && pos.created_at && daysBetween(new Date(), new Date(pos.created_at)) > 0;
    });
    console.log(nonzero.length, 'total', olderThanADay.length, 'olderThanADay');
    for (let pos of olderThanADay) {
        console.log('selling', pos);
        try {
            const response = await activeSell(
                Robinhood,
                {
                    ticker: pos.symbol,
                    quantity: pos.quantity
                }
            );
            console.log('sold because olderThanADay', response);
        } catch (e) {
            console.log('more err', e);
        }
    }

};
