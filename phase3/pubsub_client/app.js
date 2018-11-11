//app.js
//
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('This is our pub sub client')
})

app.post('/notify', (req, res) => {
    console.log(req.headers.message);
})

app.listen(8080, () => {
    console.log('Server is up on 8080')
})

