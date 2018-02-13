const config = {
    RUN: [7, 60, 123, 263],
    QUERIES: {
        top100: 'https://stockinvest.us/list/buy/top100',
        undervalued: 'https://stockinvest.us/list/undervalued'
    }
};
const scrapeStockInvest = async (browser, url) => {

    const pageNumsToScrape = [1, 2, 3, 4];

    let results = [];
    for (let pageNum of pageNumsToScrape) {
        console.log('scraping', `${url}?page=${pageNum}`);
        const page = await browser.newPage();
        try {
            await page.goto(`${url}?page=${pageNum}`);
            const pageResults = await page.evaluate(() => {
                const trs = Array.from(
                    document.querySelectorAll('.table-tickers tr')
                ).slice(12);
                const tickers = trs
                    .map(tr => {
                        const getTD = num => tr.querySelector(`td:nth-child(${num})`);
                        const secondTD = getTD(2);
                        return secondTD ? {
                            ticker: secondTD.textContent.trim(),
                            price: Number(getTD(4).querySelector('.font-size-20').textContent.trim().slice(1))
                        } : null
                    })
                    .filter(val => !!val);
                return tickers;
            });
            await page.close();
            results = results.concat(pageResults);
        } catch (e) {

        }

    }
    return results
        .filter(result => result.price < 6)
        .map(result => result.ticker);
};

module.exports = {
    config,
    scrapeStockInvest
};
