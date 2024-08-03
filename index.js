const { Database } = require("./database.js");
const { spawn } = require("child_process");
const db = new Database();
const express = require("express");
const app = express();
app.listen(3000, () => {
    console.log("App ready!");
});
let bodyParser = require("body-parser");
let crypto = require("crypto");
let cookies = require("cookie-parser");
let tradetime = true;
const dotenv = require("dotenv");
dotenv.config();

app.use(express.static("images"));
app.use(cookies());
app.use(bodyParser.urlencoded({ extended: false }));

setInterval(() => {
    if (!tradetime) {
        return;
    }
    let sl = db.getstockList();
    let p = 1;
    for (let i = 0; i < sl.length; i++) {
        db.setStockValue(
            i,
            parseFloat(
                (
                    +sl[i].price *
                    (1 + ((Math.random() * 2 - 1) * p) / 100)
                ).toFixed(2),
            ),
        );
    }
}, 2000);

app.get("/sellStock", async (req, res) => {
    const stock = req.query.stock;
    const school = req.query.school.split("_")[0];
    const acc = JSON.parse(process.env.accounts);
    if (!tradetime) return res.json({ error: "Trade Time is Disabled!" });
    console.log(stock);
    console.log(school);
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;

        if (un == school && ps == req.query.school.split("_")[1]) {
            return res.json({ newQuantity: db.sellStock(school, stock) });
        }
    }
    return res.json({ error: "Invalid Auth" });
});

app.get("/buyStock", async (req, res) => {
    const stock = req.query.stock;
    const 
    const school = req.query.school.split("_")[0];
    if (!tradetime) return res.json({ error: "Trade Time is Disabled!" });
    const acc = JSON.parse(process.env.accounts);
    console.log(stock);
    console.log(school);
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;

        if (un == school && ps == req.query.school.split("_")[1]) {
            return res.json({ newQuantity: db.buyStock(school, stock) });
        }
    }
    return res.json({ error: "Invalid Auth" });
});

app.get("/index", (req, res) => {
    return res.sendFile(__dirname + "/html/index.html");
});

app.get("/api/stockPrices", (req, res) => {
    let sl = db.getstockList();
    res.json(sl);
});
app.get("/", (req, res) => {
    console.log("helo");
    return res.sendFile(__dirname + "/html/login.html");
});

app.post("/login", (req, res) => {
    let usr = req.body.username.toUpperCase();
    let pass = req.body.password;
    const acc = JSON.parse(process.env.accounts);
    if (!usr || !pass) {
        return res.redirect("/?error=Invalid%20username%20or%20password");
    }
    for (let i = 0; i < acc.length; i++) {
        let un = acc[i].username;
        let ps = acc[i].password;
        if (un == usr && ps == pass) {
            return res.cookie("ssid", usr + "_" + pass).redirect("/index");
        }
    }
    return res.redirect("/?error=Invalid%20username%20or%20password");
});

app.get("/data", (req, res) => {
    let path = "./database.json";
    delete require.cache[require.resolve(path)];
    let d = require(path);
    d.tradetime = tradetime;
    return res.json(d);
});

app.get("/getAllPrices", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        let d = JSON.parse(process.env.all_prices);
        d.tradetime = tradetime;
        return res.json(d);
    } else {
        return res.json({ data: "false" });
    }
});

app.get("/setAllPrices", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        let arr = JSON.parse(req.query.arr);
        db.setAllPrices(req.query.which, arr);
        return res.json({ data: "success" });
    } else {
        return res.json({ data: "false" });
    }
});

app.get("/whitePrices", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        db.whitePrices();
        return res.json({ data: "success" });
    } else {
        return res.json({ data: "false" });
    }
});

app.get("/tt", (req, res) => {
    res.json({ tradetime: tradetime });
});

app.get("/portfolio", (req, res) => {
    res.sendFile(__dirname + "/html/portfolio.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/html/admin.html");
});
const u = process.env.un;
const p = process.env.pass;

app.get("/adminauth", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        return res.json({ data: "true" });
    } else {
        return res.json({ data: "false" });
    }
});

app.get("/setTT", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        tradetime = req.query.value === "true";
        console.log(tradetime);
        return res.json({ data: "success" });
    } else {
        return res.json({ data: "false" });
    }
});
app.get("/setSP", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        db.setPrice(req.query.n, req.query.value);
        return res.json({ data: "success" });
    } else {
        return res.json({ data: "false" });
    }
});

app.get("/resetDB", (req, res) => {
    if (req.query.u == u && req.query.p == p) {
        db.resetDatabase();
        return res.json({ data: "success" });
    } else {
        return res.json({ data: "false" });
    }
});
