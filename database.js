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
    for(let i=0;i<acc.length;i++){
      schools.push(acc[i].username);
    }
    var database = {
      schooldata: [],
      stockprices: [],
    };
    database.stockprices = config.stockprices;
    const sp = JSON.parse(process.env.all_prices);

    database.allPrices = [sp[0]];
    for(let i=0;i<sp.length;i++){
      database.allPrices.push([]);
    }
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
    console.log(database);
    
    this.ogdb = database;
    console.log(database==this.ogdb);
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
    
    // Check if sufficient cash is available
    if (db.schooldata[schoolIndex].cash < (db.stockprices[stockIndex].price) * n) {
      return { success: false, message: "Insufficient funds", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
    }
    
    // Check if sufficient volume is available
    const availableVolume = db.stockprices[stockIndex].totalStock - (db.stockprices[stockIndex].stocksbought || 0);
    if (availableVolume < n) {
      return { success: false, message: "Insufficient volume available", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
    }
    
    // Execute the transaction
    db.schooldata[schoolIndex].stocks[stockIndex] += n;
    db.stockprices[stockIndex].lastBoughtBy = school;
    db.stockprices[stockIndex].lastBoughtPrice = db.stockprices[stockIndex].price;
    db.stockprices[stockIndex].lastBoughtQty = n;
    db.schooldata[schoolIndex].cash -= (db.stockprices[stockIndex].price) * n;
    
    // Update stocks bought counter
    if (!db.stockprices[stockIndex].stocksbought) {
      db.stockprices[stockIndex].stocksbought = 0;
    }
    db.stockprices[stockIndex].stocksbought += n;
    
    // Price goes UP when bought
    let p = Number(db.stockprices[stockIndex].price);
    p = parseFloat((p + 0.01 * p * (n/10)).toFixed(2));
    db.stockprices[stockIndex].price = p.toFixed(2);
    fs.writeFileSync('./database.json', JSON.stringify(db));
    
    return { success: true, message: "Transaction successful", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
  }

  sellStock(school, stockname, n) {
    const db = require('./database.json');
    const schoolIndex = db.schooldata.findIndex(
        (schoolData) => schoolData.schoolcode === school,
    );
    const stockIndex = db.schooldata[schoolIndex].stocks.findIndex(
        (stock, index) => stockname === db.stockprices[index].name,
    );
    
    // Check if sufficient stocks are owned
    if (db.schooldata[schoolIndex].stocks[stockIndex] < n) {
      return { success: false, message: "Insufficient stocks owned", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
    }
    
    // Execute the transaction
    if(db.stockprices[stockIndex].lastBoughtBy===school){
      db.schooldata[schoolIndex].stocks[stockIndex] -= n;
      db.schooldata[schoolIndex].cash += (db.stockprices[stockIndex].lastBoughtPrice) * n;
    } else {
      db.schooldata[schoolIndex].stocks[stockIndex] -= n;
      db.schooldata[schoolIndex].cash += (db.stockprices[stockIndex].price) * n;
      // Price goes DOWN when sold
      db.stockprices[stockIndex].price = parseFloat(
        (db.stockprices[stockIndex].price - 0.01 * db.stockprices[stockIndex].price * (n/10)).toFixed(2)
      );
    }
    
    // Update stocks bought counter (decrease when sold, making volume available again)
    if (!db.stockprices[stockIndex].stocksbought) {
      db.stockprices[stockIndex].stocksbought = 0;
    }
    db.stockprices[stockIndex].stocksbought -= n;
    
    // Ensure stocksbought doesn't go below 0
    if (db.stockprices[stockIndex].stocksbought < 0) {
      db.stockprices[stockIndex].stocksbought = 0;
    }
    
    fs.writeFileSync('./database.json', JSON.stringify(db));
    
    return { success: true, message: "Transaction successful", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
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
    data.stockprices.find((i) => i.name === stock).lastBoughtPrice =price;
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