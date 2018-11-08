//app.js
//
const express = require('express')
const app = express()
const AWS = require('aws-sdk');

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
            ":s":req.body.subscriber
        },
        ReturnValues: "UPDATED_NEW"
    };
    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
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
    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            res.send(data); 
        }
    });
})


app.listen(8080, () => {
    console.log('Server is up on 8080')
})

