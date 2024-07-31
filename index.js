const { Database } = require("./database.js");
const { spawn } = require('child_process');
const db = new Database();
const express = require("express");
const app = express()
app.listen(3000, () => {
    console.log("App ready!")
});
let bodyParser = require("body-parser");
let crypto = require("crypto");
let cookies = require("cookie-parser");
let tradetime = true;

app.use(express.static("images"))
app.use(cookies())
app.use(bodyParser.urlencoded({ extended: false }))



setInterval(() => {
    if (!tradetime) return;
    let sl = db.getstockList();
    for (let i = 0; i < sl.length; i++) {
        let prices = [sl[i].price];
        //console.log(prices)
        let change_vector = Array(prices.length).fill(0.0); // Nudges from people buying or selling
        //console.log(db.getstockList()) // not needed tysm
        for (let i = 0; i < prices.length; i++) {
            prices[i] *= 1 + (Math.random() * 2 - 1 + change_vector[i]) / 100; // Random()->(0,1], Random()*2->(0, 2], Random()*2-1->(-1, 1]
            change_vector[i] = 0.0; // Reset change vector
        }
        db.setStockValue(i, parseFloat(prices[prices.length - 1].toFixed(2)));

    }
}, 2000);

app.get("/sellStock", async (req, res) => {
    const stock = req.query.stock;
    const school = req.query.school.split("_")[0];
    const acc = require("./accounts.json");
    if (!tradetime) return res.json({ "error": "Trade Time is Disabled!" });
    console.log(stock)
    console.log(school)
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;

        if (un == school && ps == req.query.school.split("_")[1]) {
            db.sellStock(school, stock);
            return res.json({ "data": "Success" })
        }
    }
    return res.json({ "error": "Invalid Auth" })

})

app.get("/buyStock", async (req, res) => {
    const stock = req.query.stock;
    const school = req.query.school.split("_")[0];
    if (!tradetime) return res.json({ "error": "Trade Time is Disabled!" });
    const acc = require("./accounts.json");
    console.log(stock)
    console.log(school)
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;

        if (un == school && ps == req.query.school.split("_")[1]) {
            db.buyStock(school, stock);
            return res.json({ "data": "Success" })
        }
    }
    return res.json({ "error": "Invalid Auth" })

})

app.get("/index", (req, res) => {
    return res.sendFile(__dirname + "/html/index.html");
})

app.get("/api/stockPrices", (req, res) => {
    let sl = db.getstockList();
    res.json(sl);
})
app.get("/", (req, res) => {
    console.log("helo")
    return res.sendFile(__dirname + "/html/login.html");
})

app.post("/login", (req, res) => {
    let usr = req.body.username.toUpperCase()
    let pass = req.body.password;
    const acc = require("./accounts.json");
    if (!usr || !pass) {
        return res.redirect("/?error=Invalid%20username%20or%20password");
    }
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;
        if (un == usr && ps == pass) {
            return res.cookie("ssid", usr + "_" + pass).redirect("/index")
        }
    }
    return res.redirect("/?error=Invalid%20username%20or%20password");


})

app.get("/data", (req, res) => {
    let path = './database.json';
    delete require.cache[require.resolve(path)];
    let d = require(path);
    d.tradetime = tradetime;
    return res.json(d);
});

app.get("/tt", (req, res) => {
    res.json({ "tradetime": tradetime });
})

app.get("/portfolio", (req, res) => {
    res.sendFile(__dirname + "/html/portfolio.html");
})

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/html/admin.html");
})
const u = "admin"
const p = "youshallnotpass"

app.get("/adminauth", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        return res.json({ "data": "true" });
    }
    else {
        return res.json({ "data": "false" });
    }
})

app.get("/setTT", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        tradetime = (req.query.value === "true");
        console.log(tradetime);
        return res.json({ "data": "success" });
    }
    else {
        return res.json({ "data": "false" });
    }
})
app.get("/setSP", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        db.setPrice(req.query.n, req.query.value);
        return res.json({ "data": "success" });
    }
    else {
        return res.json({ "data": "false" });
    }
})

app.get("/resetDB", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        db.resetDatabase();
        return res.json({ "data": "success" });
    } else {
        return res.json({ "data": "false" });
    }
});