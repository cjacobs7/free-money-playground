const config = {
    RUN: [2, 12, 75, 120, 180, 380],
    QUERIES: {
        under5Target10Change2Vol200Within10of52Low: 'https://finviz.com/screener.ashx?v=111&f=cap_smallover,sh_curvol_o200,sh_price_u5,ta_change_u2,ta_changeopen_u,ta_highlow50d_a0to10h,targetprice_a10&ft=4&o=-change',
        under5Target10Change2Vol200: 'https://finviz.com/screener.ashx?v=111&f=cap_smallover,sh_curvol_o200,sh_price_u5,ta_change_u2,ta_changeopen_u,targetprice_a10&ft=4&o=-change',
        under5TopLosers: 'https://finviz.com/screener.ashx?v=111&s=ta_toplosers&f=sh_price_u5'
    },
};

const scrapeFizbiz = async (browser, url) => {

    const page = await browser.newPage();
    await page.goto(url);
    const results = await page.evaluate(() => {
        const trs = Array.from(
            document.querySelectorAll('#screener-content tr:nth-child(4) table tr')
        ).slice(1);
        const tickers = trs.map(tr => {
            const getTD = num => tr.querySelector(`td:nth-child(${num})`).textContent;
            return getTD(2);  // ticker
            // return {
            //     ticker: getTD(2),
            //     price: Number(getTD(9)),
            //     trend: getTD(10)
            // };
        });
        return tickers;
    });
    console.log('got em ')
    await page.close();
    console.log('returning')
    return results;
};

module.exports = {
    config,
    scrapeFn: scrapeFizbiz
};
