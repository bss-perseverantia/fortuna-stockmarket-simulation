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
      stockPriceHistory: [],
    };
    database.stockprices = config.stockprices;
    const sp = JSON.parse(process.env.all_prices);

    database.allPrices = [sp[0]];
    for(let i=0;i<sp.length;i++){
      database.allPrices.push([]);
    }
    database.whitePrices = false;
    
    // Initialize stock price history with current prices and timestamps
    database.stockPriceHistory = [];
    for(let i = 0; i < database.stockprices.length; i++) {
      database.stockPriceHistory.push([{
        price: database.stockprices[i].price,
        timestamp: new Date().toISOString(),
        change: 0
      }]);
    }
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
    //console.log(database);
    
    this.ogdb = database;
    //console.log(database==this.ogdb);
    // fs.writeFileSync('./database.json', JSON.stringify(database));
    //  fs.writeFileSync("./accounts.json", JSON.stringify(accounts));
  }
  
  // Helper method to update stock price history
  updateStockPriceHistory(stockIndex, oldPrice, newPrice) {
    const db = require('./database.json');
    
    // Initialize stockPriceHistory if it doesn't exist
    if (!db.stockPriceHistory) {
      db.stockPriceHistory = [];
      for(let i = 0; i < db.stockprices.length; i++) {
        db.stockPriceHistory.push([{
          price: db.stockprices[i].price,
          timestamp: new Date().toISOString(),
          change: 0
        }]);
      }
    }
    
    // Ensure the stock index has a history array
    if (!db.stockPriceHistory[stockIndex]) {
      db.stockPriceHistory[stockIndex] = [{
        price: oldPrice,
        timestamp: new Date().toISOString(),
        change: 0
      }];
    }
    
    // Add new price point if the price actually changed
    if (oldPrice !== newPrice) {
      const change = ((newPrice - oldPrice) / oldPrice) * 100;
      
      db.stockPriceHistory[stockIndex].push({
        price: parseFloat(newPrice),
        timestamp: new Date().toISOString(),
        change: parseFloat(change.toFixed(2))
      });
      
      // Keep only last 100 price points to prevent database from growing too large
      if (db.stockPriceHistory[stockIndex].length > 100) {
        db.stockPriceHistory[stockIndex] = db.stockPriceHistory[stockIndex].slice(-100);
      }
    }
    
    return db;
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
    
    // Calculate price impact based on market dynamics (reduced impact)
    let p = Number(db.stockprices[stockIndex].price);
    const oldPrice = p;
    
    // Market demand ratio (how much of total stock is already bought)
    const demandRatio = db.stockprices[stockIndex].stocksbought / db.stockprices[stockIndex].totalStock;
    
    // Volume impact (larger purchases have more impact)
    const volumeImpact = n / db.stockprices[stockIndex].totalStock;
    
    // Reduced base impact rate (starts at 0.2% for low demand, scales up to 0.8% for high demand)
    const baseImpactRate = 0.002 + (demandRatio * 0.006);
    
    // Reduced volume multiplier (much smaller exponential impact)
    const volumeMultiplier = 1 + Math.pow(volumeImpact * 50, 0.5);
    
    // Reduced scarcity multiplier (gentler price increases)
    const scarcityMultiplier = 1 + (demandRatio * 0.8);
    
    // Final impact calculation with overall dampener
    const priceImpact = baseImpactRate * volumeMultiplier * scarcityMultiplier * 0.6;
    
    // Apply the price increase
    p = parseFloat((p * (1 + priceImpact)).toFixed(2));
    
    db.stockprices[stockIndex].price = p.toFixed(2);
    
    // Update price history
    const updatedDb = this.updateStockPriceHistory(stockIndex, oldPrice, p);
    fs.writeFileSync('./database.json', JSON.stringify(updatedDb));
    
    return { success: true, message: "Transaction successful", stocks: db.schooldata[schoolIndex].stocks[stockIndex] };
  }

  /*
    New Buying Formula:
Components:

Demand Ratio: stocksbought / totalStock - measures market saturation
Volume Impact: n / totalStock - measures trade size relative to company
Base Impact Rate: 0.5% to 2% based on demand
Volume Multiplier: Exponential impact for larger trades
Scarcity Multiplier: Higher prices when more stock is owned
Formula:

priceImpact = baseImpactRate × volumeMultiplier × scarcityMultiplier
newPrice = currentPrice × (1 + priceImpact)
    

New Selling Formula:
Components:

Supply Ratio: Remaining demand after sale
Volume Impact: Sale size relative to total stock
Base Decline Rate: 0.3% to 1.5% based on remaining demand
Volume Multiplier: Larger sales have more impact
Supply Multiplier: Prices drop faster with less demand
Selling Dampener: 0.7 multiplier (selling has less impact than buying)

    */

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
      db.stockprices[stockIndex].price = db.stockprices[stockIndex].lastBoughtPrice;

      } else {
        db.schooldata[schoolIndex].stocks[stockIndex] -= n;
        db.schooldata[schoolIndex].cash += (db.stockprices[stockIndex].price) * n;
        
        // Calculate price decrease based on selling pressure
        let p = Number(db.stockprices[stockIndex].price);
        const oldPrice = p;
        
        // Market supply increase (selling increases available supply)
        const supplyRatio = (db.stockprices[stockIndex].stocksbought - n) / db.stockprices[stockIndex].totalStock;
        
        // Volume impact (larger sales have more impact)
        const volumeImpact = n / db.stockprices[stockIndex].totalStock;
        
        // Base decline rate (starts at 0.3% for high demand stocks, up to 1.5% for low demand)
        const baseDeclineRate = 0.003 + ((1 - supplyRatio) * 0.012);
        
        // Volume multiplier (larger sales have more impact)
        const volumeMultiplier = 1 + Math.pow(volumeImpact * 100, 0.6);
        
        // Supply multiplier (prices drop faster when there's less demand)
        const supplyMultiplier = 1 + ((1 - supplyRatio) * 1.5);
        
        // Final impact calculation (selling has less impact than buying)
        const priceDecline = baseDeclineRate * volumeMultiplier * supplyMultiplier * 0.7;
        
        // Apply the price decrease
        p = parseFloat((p * (1 - priceDecline)).toFixed(2));
        
        // Ensure price doesn't go below a minimum threshold (10% of original value)
        const minPrice = 0.1 * Number(db.stockprices[stockIndex].price);
        if (p < minPrice) p = minPrice;
        
        db.stockprices[stockIndex].price = p.toFixed(2);
        
        // Update price history
        const updatedDb = this.updateStockPriceHistory(stockIndex, oldPrice, p);
        // Update the db reference to the updated database
        Object.assign(db, updatedDb);
      }    // Update stocks bought counter (decrease when sold, making volume available again)
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
  
  getStockPriceHistory(stockIndex = null) {
    const data = require('./database.json');
    
    // Initialize stockPriceHistory if it doesn't exist
    if (!data.stockPriceHistory) {
      data.stockPriceHistory = [];
      for(let i = 0; i < data.stockprices.length; i++) {
        data.stockPriceHistory.push([{
          price: data.stockprices[i].price,
          timestamp: new Date().toISOString(),
          change: 0
        }]);
      }
      fs.writeFileSync('./database.json', JSON.stringify(data));
    }
    
    if (stockIndex !== null) {
      return data.stockPriceHistory[stockIndex] || [];
    }
    
    return data.stockPriceHistory;
  }
  
  getAllStockData() {
    const data = require('./database.json');
    return {
      stockprices: data.stockprices,
      stockPriceHistory: this.getStockPriceHistory(),
      schooldata: data.schooldata
    };
  }
  setStockValue(i, prices) {
    const data = require('./database.json');
    data.stockprices[i].price = prices;
    fs.writeFileSync('./database.json', JSON.stringify(data));
  }
  setPrice(stock, price) {
    var data = require('./database.json');
    const stockObj = data.stockprices.find((i) => i.name === stock);
    const stockIndex = data.stockprices.findIndex((i) => i.name === stock);
    
    if (stockObj && stockIndex !== -1) {
      const oldPrice = parseFloat(stockObj.price);
      const newPrice = parseFloat(price);
      
      stockObj.price = price;
      stockObj.lastBoughtPrice = price;
      
      // Update price history
      const updatedDb = this.updateStockPriceHistory(stockIndex, oldPrice, newPrice);
      fs.writeFileSync('./database.json', JSON.stringify(updatedDb));
    } else {
      fs.writeFileSync('./database.json', JSON.stringify(data));
    }
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