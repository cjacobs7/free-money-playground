const fs = require('mz/fs');
const path = require('path');

const modules = [];

module.exports = async (Robinhood) => {

    var normalizedPath = path.join(__dirname, '../modules');

    const files = (await fs.readdir(normalizedPath))
        .filter(fileName => !fileName.startsWith('.'))
        .map(fileName => `${normalizedPath}/${fileName}`);

    for (let file of files) {
        const isDir = (await fs.lstat(file)).isDirectory();
        // if (!isDir) {
            const moduleObj = require(file);
            moduleObj.init(Robinhood);
            modules.push(moduleObj);
        // }
    }

};
