const {Database} = require('./database.js');
require('dotenv').config();
const {spawn} = require('child_process');
const db = new Database();
const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  // Send initial data to new client
  const initialData = getCurrentData();
  ws.send(JSON.stringify({
    type: 'data',
    payload: initialData
  }));

  // Handle client disconnect
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to get current data
function getCurrentData() {
  let path = './database.json';
  delete require.cache[require.resolve(path)];
  let d = require(path);
  d.tradetime = tradetime;
  return d;
}

// Function to broadcast data to all connected clients
function broadcastData() {
  if (clients.size === 0) return;

  const data = getCurrentData();
  const message = JSON.stringify({
    type: 'data',
    payload: data
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      clients.delete(client);
    }
  });
}

// Broadcast data every second
setInterval(broadcastData, 1000);

server.listen(3000, () => {
  console.log('App ready!');
});

let bodyParser = require('body-parser');
let crypto = require('crypto');
let cookies = require('cookie-parser');
let tradetime = true;
const dotenv = require('dotenv');
dotenv.config();

app.use(express.static('images'));
app.use(cookies());
app.use(bodyParser.urlencoded({extended: false}));
app.get('/stockPrices',(req,res)=>{
  res.sendFile(__dirname + '/html/stockprices.html');
})
const path = require('path');
app.use(
"/static",
express.static(path.join(process.cwd(), "static"), {
maxAge: "1y", // cache for a year
immutable: true, // tells the browser it never changes
etag: true, // allow 304 revalidation if needed
lastModified: true, // (default) also fine
setHeaders(res, filePath) {
// Make it explicit and compatible with CDNs
res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
// Optional: precompressed files if you have them (see §4)
// res.setHeader("Vary", "Accept-Encoding");
},
})
);

app.get('/sellStock', async (req, res) => {
  const stock = req.query.stock;
  const school = req.query.school.split('_')[0];
  const n = parseInt(req.query.n) || 1;

  const acc = JSON.parse(process.env.accounts);
  if (!tradetime) return res.json({error: 'Trade Time is Disabled!'});
  console.log(stock);
  console.log(school);
  for (let i = 0; i < acc.length; i++) {
    let un = acc[i].username;
    let ps = acc[i].password;

    if (un == school && ps == req.query.school.split('_')[1]) {
      const result = db.sellStock(school, stock, n);
      // Handle new response format from database
      if (typeof result === 'object' && result.success !== undefined) {
        return res.json(result);
      } else {
        // Legacy response format (just a number)
        return res.json({newQuantity: result});
      }
    }
  }
  return res.json({error: 'Invalid Auth'});
});

app.get('/buyStock', async (req, res) => {
  const stock = req.query.stock;
  const school = req.query.school.split('_')[0];
  const n = parseInt(req.query.n) || 1;
  if (!tradetime) return res.json({error: 'Trade Time is Disabled!'});
  const acc = JSON.parse(process.env.accounts);
  console.log(stock);
  console.log(school);
  for (let i = 0; i < acc.length; i++) {
    let un = acc[i].username;
    let ps = acc[i].password;

    if (un == school && ps == req.query.school.split('_')[1]) {
      const result = db.buyStock(school, stock, n);
      // Handle new response format from database
      if (typeof result === 'object' && result.success !== undefined) {
        return res.json(result);
      } else {
        // Legacy response format (just a number)
        return res.json({newQuantity: result});
      }
    }
  }
  return res.json({error: 'Invalid Auth'});
});
/*
app.get('/index', (req, res) => {
  return res.sendFile(__dirname + '/html/index.html');
});
*/
app.get('/index', (req, res) => {
  return res.sendFile(__dirname + '/html/merged-portfolio.html');
});


app.get('/api/stockPrices', (req, res) => {
  let sl = db.getstockList();
  res.json(sl);
});
app.get('/', (req, res) => {
  console.log('helo');
  return res.sendFile(__dirname + '/html/login.html');
});

app.post('/login', (req, res) => {
  let usr = req.body.username.toUpperCase();
  let pass = req.body.password;
  console.log(process.env.accounts);
  const acc = JSON.parse(process.env.accounts);
  if (!usr || !pass) {
    return res.redirect('/?error=Invalid%20username%20or%20password');
  }
  for (let i = 0; i < acc.length; i++) {
    let un = acc[i].username;
    let ps = acc[i].password;
    if (un == usr && ps == pass) {
      return res.cookie('ssid', usr + '_' + pass).redirect('/index');
    }
  }
  return res.redirect('/?error=Invalid%20username%20or%20password');
});

app.get('/data', (req, res) => {
  const data = getCurrentData();
  return res.status(200).json(data);
});

app.get('/getAllPrices', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    let d = JSON.parse(process.env.all_prices);
    d.tradetime = tradetime;
    return res.json(d);
  } else {
    return res.json({data: 'false'});
  }
});

app.get('/setAllPrices', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    let arr = JSON.parse(req.query.arr);
    db.setAllPrices(req.query.which, arr);
    return res.json({data: 'success'});
  } else {
    return res.json({data: 'false'});
  }
});
app.get('/getAllAccounts', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    return res.sendFile(__dirname+"/accounts.json");
  } else {
    return res.status(500).json({data: 'false'});
  }
});

app.get('/whitePrices', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    db.whitePrices();
    return res.json({data: 'success'});
  } else {
    return res.json({data: 'false'});
  }
});

app.get('/tt', (req, res) => {
  res.json({tradetime: tradetime});
});

app.get('/portfolio', (req, res) => {
  res.sendFile(__dirname + '/html/portfolio.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/html/admin.html');
});
const u = process.env.un;
const p = process.env.pass;

app.get('/adminauth', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    return res.json({data: 'true'});
  } else {
    return res.json({data: 'false'});
  }
});

app.get('/setTT', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    tradetime = req.query.value === 'true';
    console.log(tradetime);
    return res.json({data: 'success'});
  } else {
    return res.json({data: 'false'});
  }
});
app.get('/setSP', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    db.setPrice(req.query.n, req.query.value);
    return res.json({data: 'success'});
  } else {
    return res.json({data: 'false'});
  }
});

app.get('/resetDB', (req, res) => {
  if (req.query.u == u && req.query.p == p) {
    db.resetDatabase();
    return res.json({data: 'success'});
  } else {
    return res.json({data: 'false'});
  }
});


