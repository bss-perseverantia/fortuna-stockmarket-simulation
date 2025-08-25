const fs = require('fs');
const filepath = './database.json';

class Database {
  constructor() {
    const config = require("./config.js");
    const acc = JSON.parse(process.env.accounts);
    
    let schools = [];
    for (let i = 0; i < acc.length; i++) {
      schools.push(acc[i].username);
    }
    var database = {
      schooldata: [],
      stockprices: [],
    };
    database.stockprices = config.stockprices;
    const sp = JSON.parse(process.env.all_prices);

    database.allPrices = [sp[0]];
    for (let i = 0; i < sp.length; i++) {
      database.allPrices.push([]);
    }
    database.whitePrices = false;
    const fs = require('fs');
    for (let i = 0; i < schools.length; i++) {
      database.schooldata.push({
        schoolcode: schools[i],
        stocks: Array(database.stockprices.length).fill(0),
        cash: config.cash,
      });
    }
    console.log(database);
    
    this.ogdb = database;
    console.log(database == this.ogdb);
    // fs.writeFileSync('./database.json', JSON.stringify(database));
    // fs.writeFileSync("./accounts.json", JSON.stringify(accounts));
  }

  // Helper function to adjust price after buying
  adjustPriceOnBuy(stockIndex, n) {
    let p = Number(this.ogdb.stockprices[stockIndex].price);
    let totalStock = this.ogdb.stockprices[stockIndex].totalStock;
    
    // Calculate the price impact factor based on the number of shares being bought
    let impactFactor = Math.min(n / totalStock, 0.1); // Cap the impact at 10% of total stock

    // Increase the price gradually
    let newPrice = parseFloat((p + p * 0.01 * impactFactor).toFixed(2));
    this.ogdb.stockprices[stockIndex].price = newPrice;
  }

  // Helper function to adjust price after selling
  adjustPriceOnSell(stockIndex, n) {
    let p = Number(this.ogdb.stockprices[stockIndex].price);
    let totalStock = this.ogdb.stockprices[stockIndex].totalStock;
    
    // Calculate the price impact factor based on the number of shares being sold
    let impactFactor = Math.min(n / totalStock, 0.1); // Cap the impact at 10% of total stock

    // Decrease the price gradually (less than the increase factor)
    let newPrice = parseFloat((p - p * 0.005 * impactFactor).toFixed(2));  // More gradual decrease on sell
    this.ogdb.stockprices[stockIndex].price = newPrice;
  }

  buyStock(school, stockname, n) {
    const db = require('./database.json');
    const schoolIndex = db.schooldata.findIndex(
        (schoolData) => schoolData.schoolcode === school,
    );
    const stockIndex = db.schooldata[schoolIndex].stocks.findIndex(
        (stock, index) => stockname === db.stockprices[index].name,
    );
    if (db.schooldata[schoolIndex].cash >
        (db.stockprices[stockIndex].price) * n) {
      db.schooldata[schoolIndex].stocks[stockIndex] += n;
      db.schooldata[schoolIndex].cash -= (db.stockprices[stockIndex].price) * n;
      
      // Adjust the price realistically when buying
      this.adjustPriceOnBuy(stockIndex, n);
      
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
      
      // Adjust the price realistically when selling
      this.adjustPriceOnSell(stockIndex, n);
      
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
