// utils
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');

// app-actions
const recordPicks = require('../app-actions/record-picks');

const getTrendAndSave = require('../app-actions/get-trend-and-save');
const getUpStreak = require('../app-actions/get-up-streak');
const limitBuyMultiple = require('../app-actions/limit-buy-multiple');
const addOvernightJump = require('../app-actions/add-overnight-jump');

const cancelAllOrders = require('../rh-actions/cancel-all-orders');


const mapLimit = require('promise-map-limit');

const perms = [
    {
        name: '<$3-upstreak-3',
        priceFilter: price => price < 3,
        upstreak: 3
    },
    {
        name: '<$3-upstreak-4',
        priceFilter: price => price < 3,
        upstreak: 4
    },
    {
        name: '$3-$5-upstreak-5',
        priceFilter: price => price > 3 && price < 5,
        upstreak: 5
    }
];

const upstreakStrategy = async (Robinhood, min) => {


    await cancelAllOrders(Robinhood);

    // get trend, filter < $15, add upstreak
    const trend = await getTrendAndSave(Robinhood, min + '*');

    const under5 = trend.filter(stock => {
        return Number(stock.quote_data.last_trade_price) < 5;
    });
    console.log('uner 5', under5.length);
    const withUpstreak = await mapLimit(under5, 20, async buy => ({
        ...buy,
        upstreak: await getUpStreak(Robinhood, buy.ticker)
    }));

    console.log('with upstreak')
    console.log(withUpstreak);


    for (let perm of perms) {


        const inPriceFilter = withUpstreak.filter(t => {
            return perm.priceFilter(Number(t.quote_data.last_trade_price));
        });
        const meetsUpstreak = inPriceFilter.filter(t => {
            return t.upstreak === perm.upstreak;
        });

        // await limitBuyMultiple(Robinhood, {
        //     stocksToBuy: meetsUpstreak.map(t => t.ticker),
        //     totalAmtToSpend: 100,
        //     strategy: perm.name
        // });
        await recordPicks(Robinhood, perm.name, min, meetsUpstreak.map(t => t.ticker));

        let withOvernightJump = await addOvernightJump(Robinhood, meetsUpstreak);
        const upOneOvernight = withOvernightJump.filter(t => {
            return t.overnightJump > 1;
        });

        // await limitBuyMultiple(Robinhood, {
        //     stocksToBuy: upOneOvernight.map(t => t.ticker),
        //     totalAmtToSpend: 50,
        //     strategy: perm.name + '-up1overnight'
        // });

        await recordPicks(Robinhood, perm.name + '-up1overnight', min, upOneOvernight.map(t => t.ticker));

    }


};

const up10days = {
    init: (Robinhood) => {

        // runs at init
        regCronIncAfterSixThirty(
            Robinhood,
            {
                name: 'execute up-streak strategy',
                run: [45, 189],  // 12:31, 12:50pm
                // run: [],
                fn: (Robinhood, min) => setTimeout(() => {
                    upstreakStrategy(Robinhood, min);
                }, 5000)
            },
        );

    }
};


module.exports = up10days;
