const fs = require("fs");
const filepath = "./database.json";
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}


class Database {
    constructor() {
        let schools = [
            "P3",
            "P4",
            "P9",
            "P8",
            "P10",
            "P12",
            "P14",
            "P16",
            "P18",
            "P17",
            "P22",
            "P23",
            "P25",
            "P26",
            "P15",
            "P13",
            "P20",
            "P24",
            "P19",
            "P27",
            "P29",
            "P31"
        ].sort()
        var database = {
            "schooldata": [],
            "stockprices": []
        };
        database.stockprices = [
            { "name": "Giovanni Motors", "price": 2048, "sector": "Automobiles" },
            { "name": "Bunsel Steel", "price": 890, "sector": "Steel" },
            { "name": "AP Cement", "price": 970, "sector": "Cement" },
            { "name": "Costaviya", "price": 1243, "sector": "Banking" },
            { "name": "Insula Paints", "price": 2933, "sector": "Paints" },
            { "name": "Gajanan Housing and Construction", "price": 1430, "sector": "Real Estate (Housing)" },
            { "name": "Musafir Travels", "price": 7200, "sector": "Tourism" },
            { "name": "Indigo Entertainment", "price": 252, "sector": "Entertainment" },
            { "name": "Paramol Insurance", "price": 1500, "sector": "Insurance" },
            { "name": "Hilfi Oils", "price": 347, "sector": "Oils" },
            { "name": "Forge X", "price": 3644, "sector": "Logistics" },
            { "name": "Sunset Grove Resort and Hotels", "price": 421, "sector": "Hospitality" },
            { "name": "Vibgyor Aviation", "price": 4321, "sector": "Aviation" },
            { "name": "BuzzWave", "price": 1673, "sector": "Social Networking" },
            { "name": "Codezen", "price": 1370, "sector": "I.T." },
            { "name": "Fostech Communication", "price": 1000, "sector": "Telecom" },
            { "name": "Farm 2 Table", "price": 2198, "sector": "Consumer Food" },
            { "name": "Athlife", "price": 300, "sector": "Athleisure" },
            { "name": "Medicare", "price": 1114, "sector": "Pharma" },
            { "name": "Imperial Silk", "price": 750, "sector": "Textiles" }
        ];
        //        var accounts = [];
        for (let i = 0; i < schools.length; i++) {
            database.schooldata.push({
                "schoolcode": schools[i],
                "stocks": Array(database.stockprices.length).fill(0),
                "cash": 1000000
            })
            //accounts[i] = {"username":schools[i],"password":makeid(6)};
        }
        const fs = require("fs")
        this.ogdb = database;
        //fs.writeFileSync("./database.json", JSON.stringify(database));
        //fs.writeFileSync("./accounts.json", JSON.stringify(accounts));


    }
    buyStock(school, stockname) {
        const db = require('./database.json');
        const schoolIndex = db.schooldata.findIndex(schoolData => schoolData.schoolcode === school);
        const stockIndex = db.schooldata[schoolIndex].stocks.findIndex((stock, index) => stockname === db.stockprices[index].name);
        if (db.schooldata[schoolIndex].cash > db.stockprices[stockIndex].price) {
            db.schooldata[schoolIndex].stocks[stockIndex]++;
            db.schooldata[schoolIndex].cash -= db.stockprices[stockIndex].price;
            fs.writeFileSync("./database.json", JSON.stringify(db));
        }

    }

    sellStock(school, stockname) {
        const db = require('./database.json');
        const schoolIndex = db.schooldata.findIndex(schoolData => schoolData.schoolcode === school);
        const stockIndex = db.schooldata[schoolIndex].stocks.findIndex((stock, index) => stockname === db.stockprices[index].name);
        if (db.schooldata[schoolIndex].stocks[stockIndex] > 0) {
            db.schooldata[schoolIndex].stocks[stockIndex]--;
            db.schooldata[schoolIndex].cash += db.stockprices[stockIndex].price;
            fs.writeFileSync("./database.json", JSON.stringify(db));
        }
    }
    getstockList() {
        const data = require("./database.json");
        return data.stockprices;
    }
    setStockValue(i, prices) {
        const data = require("./database.json");
        data.stockprices[i].price = prices;
        fs.writeFileSync("./database.json", JSON.stringify(data));
    }
    setPrice(stock, price) {
        var data = require("./database.json");
        data.stockprices.find(i => i.name === stock).price = price;
        fs.writeFileSync("./database.json", JSON.stringify(data));
    }
    resetDatabase() {
        fs.writeFileSync("./database.json", JSON.stringify(this.ogdb));
    }
}
module.exports = {
    Database
}