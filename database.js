const fs = require('fs');
const filepath = './database.json';

function makeid(length) {
  let result = '';
  const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(
        Math.floor(Math.random() * charactersLength),
    );
    counter += 1;
  }
  return result;
}

class Database {
  constructor() {
    const config = require("./config.js");
    const acc = JSON.parse(process.env.accounts);
    
    let schools = []
    for(let i=0;I<acc.length;i++){
      schools.push(acc[i].username);
    }
    var database = {
      schooldata: [],
      stockprices: [],
    };
    database.stockprices = config.stockprices;
    const sp = JSON.parse(process.env.all_prices);

    database.allPrices = [
      sp[0],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    ];
    database.whitePrices = false;
    const fs = require('fs');

    //        var accounts = [];
    for (let i = 0; i < schools.length; i++) {
      database.schooldata.push({
        schoolcode: schools[i],
        stocks: Array(database.stockprices.length).fill(0),
        cash: config.cash,
      });
      // accounts[i] = {"username":schools[i],"password":makeid(6)};
    }
    this.ogdb = database;
    // fs.writeFileSync('./database.json', JSON.stringify(database));
    //  fs.writeFileSync("./accounts.json", JSON.stringify(accounts));
  }
  buyStock(school, stockname, n) {
    const db = require('./database.json');
    const schoolIndex = db.schooldata.findIndex(
        (schoolData) => schoolData.schoolcode === school,
    );
    const stockIndex = db.schooldata[schoolIndex].stocks.findIndex(
        (stock, index) => stockname === db.stockprices[index].name,
    );
    console.log(db.stockprices[stockIndex]);
    if (db.schooldata[schoolIndex].cash >
        (db.stockprices[stockIndex].price) * n) {
      db.schooldata[schoolIndex].stocks[stockIndex] += n;
      db.schooldata[schoolIndex].cash -= (db.stockprices[stockIndex].price) * n;
      fs.writeFileSync('./database.json', JSON.stringify(db));
    }
    return db.schooldata[schoolIndex].stocks[stockIndex];
  }

  sellStock(school, stockname, n) {
    const db = require('./database.json');
    const schoolIndex = db.schooldata.findIndex(
        (schoolData) => schoolData.schoolcode === school,
    );
    const stockIndex = db.schooldata[schoolIndex].stocks.findIndex(
        (stock, index) => stockname === db.stockprices[index].name,
    );
    if (db.schooldata[schoolIndex].stocks[stockIndex] >= n) {
      db.schooldata[schoolIndex].stocks[stockIndex] -= n;
      db.schooldata[schoolIndex].cash += (db.stockprices[stockIndex].price) * n;
      fs.writeFileSync('./database.json', JSON.stringify(db));
    }
    return db.schooldata[schoolIndex].stocks[stockIndex];
  }
  getstockList() {
    const data = require('./database.json');
    return data.stockprices;
  }
  setStockValue(i, prices) {
    const data = require('./database.json');
    data.stockprices[i].price = prices;
    fs.writeFileSync('./database.json', JSON.stringify(data));
  }
  setPrice(stock, price) {
    var data = require('./database.json');
    data.stockprices.find((i) => i.name === stock).price = price;
    fs.writeFileSync('./database.json', JSON.stringify(data));
  }
  resetDatabase() {
    fs.writeFileSync('./database.json', JSON.stringify(this.ogdb));
  }
  setAllPrices(which, arr) {
    var data = require('./database.json');
    data.allPrices[which] = arr;
    fs.writeFileSync('./database.json', JSON.stringify(data));
  }
  whitePrices() {
    var data = require('./database.json');
    data.whitePrices = !data.whitePrices;
    fs.writeFileSync('./database.json', JSON.stringify(data));
  }
}
module.exports = {
  Database,
};
