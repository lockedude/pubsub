const express = require('express')
const app = express()
const AWS = require('aws-sdk')
const bodyParser = require('body-parser')
const querystring = require('querystring')
const https = require('https')
const http = require('http')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

AWS.config.update({
    region: "us-west-1",
});

https.globalAgent.options.secureProtocol = 'SSLv3_method';

function sendToSubscribers(req, res) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "centralpubsubA";
    var params = { 
        TableName: table,
        Key:{
            "subscription": req.body.subscription
        }
    };
    var getObjectPromise = docClient.get(params).promise();
    getObjectPromise.then(function (data) {
        var post_options = {
             hostname: data.Item.subscribers,
             port: '49160',
             path: '/notify',
             method: 'POST',
             headers: {
                 'Content-Type': 'application/x-www-form-urlencoded',
                 'Message': req.body.message
             }
        };
        var post_req = http.request(post_options, (response) => {
            console.log('statusCode:', response.statusCode);
            console.log('headers:', response.headers);
            response.on('dat', (d) => {
               process.stdout.write(d);
            });
        });
        post_req.on('error', (e) => {
            console.error(e);
        });
        post_req.end();
        res.send("Sent the message " + req.body.message + " to " + data.Item.subscribers);
    }).catch(function (err) {
        console.log(err);
    });
}


app.get('/', (req, res) => {
    res.send('This is our pub sub server')
})

app.post('/subscribe', (req,res) => {
    //DyanoDB variables
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "centralpubsubA";
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

app.post('/relay', (req, res) => {
    sendToSubscribers(req,res);
})   

app.post('/publish', (req, res) => {
    //Sending Relay request to other Relay hosts
    var relay_options = {
         hostname: 'ec2-54-215-216-181.us-west-1.compute.amazonaws.com',
         port: '49160',
         path: '/relay',
         method: 'POST',
         headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Subscription': req.body.subscription,
             'Message': req.body.message
         }
    };
    var relay_req = http.request(relay_options, (response) => {
         console.log('statusCode:', response.statusCode);
         console.log('headers:', response.headers);
         response.on('dat', (d) => {
             process.stdout.write(d);
         });
    });
    relay_req.on('error', (e) => {
        console.error(e);
    });
    relay_req.end();
    sendToSubscribers(req,res);
})

app.listen(8080, () => {
    console.log('Server is up on 8080')
})
