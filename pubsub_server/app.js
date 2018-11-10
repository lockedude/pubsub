//app.js
//

const express = require('express')
const app = express()
const AWS = require('aws-sdk')
const bodyParser = require('body-parser')
const querystring = require('querystring')
const https = require('https')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

AWS.config.update({
    region: "us-west-1",
});



app.get('/', (req, res) => {
    res.send('This is our pub sub server')
})

app.post('/subscribe', (req,res) => {
    //DynamoDB variables
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "centralpubsub";
    var params = {
        TableName: table,
        Key:{
            "subscription": req.body.subscription
        },
        UpdateExpression: "set subscribers = :s",
        ExpressionAttributeValues:{
            ":s": req.body.subscriber
        },
        ReturnValues: "UPDATED_NEW"
    };
    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        }
    });
    res.send("Successfully subscribed " + req.body.subscriber + " to " + req.body.subscription);
})

app.post('/publish', (req,res) => {
    //DynamoDB variables
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "centralpubsub";
    var params = {
        TableName: table,
        Key:{
            "subscription": req.body.subscription
        }
    };
    var getObjectPromise = docClient.get(params).promise();
    getObjectPromise.then(function (data) {
        var post_data = querystring.stringify({
            'body' : req.body.message
        });
        var post_options = {
             host: data.Item.subscribers,
             port: '49160',
             path: '/notify',
             method: 'POST',
             headers: {
                 'Content-Type': 'application/x-www-form-urlencoded',
                 'Content-Length': post_data.length
             }
        };
        var post_req = https.request(post_options, (response) => {
            console.log('statusCode:', response.statusCode);
            console.log('headers:', response.headers);
            response.on('stuff', (d) => {
                process.stdout.write(d);
            });
        });
        post_req.write(post_data);
        post_req.end();
        res.send("Sent the message to " + data.Item.subscribers);
    });
})


app.listen(8080, () => {
    console.log('Server is up on 8080')
})
