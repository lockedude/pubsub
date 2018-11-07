//app.js
//
const express = require('express')
const app = express()

app.get('/', (req, res) => {
    res.send('This is our pub sub server')
})

app.listen(8080, () => {
    console.log('Server is up on 8080')
})
