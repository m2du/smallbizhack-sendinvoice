const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');
const token = 'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..cbUZdKC4Sk21vhKITktEPA.q3RV3ZhJyuXhjXV6VuxI71cPU8PfcO1xIK8BEvtTZE_7UlXR2qb1jLbHOMwZHcu3mgYii6vWZXkbrfd7Wo-smTP-QV0vudG9HrDntoKQD_mtN5mXvQSXVdPVNloex35f9tPuzNvg64P-YnXBUfqZg3cSzTXNmE68EPt3VMQ663ZHNSqkcTPx42IacbGfQAl2l1Sy8TTvL1-GFbwe4hrTgD95XUl9LxVBBH5OXLCdSzICT-wKREJ7NamCx7qC0WnqTv7gp3GH7O7QReoxQhVTPLUKd6FdW5TJ8HhtRjK_yIY3UBniqPGKg5AoHU8uc67fXuag9xrrr2GjMEdifjUum7l4KIto5CpBNpdwVfeZrvH3iTQ2dWc58RYWrLyujXDqlAMEJYWw1E7rQ8mmYOZIt0dYBM-vMEN3nqUPvC4NESyWetjnZLO_K2_jXJ9W55VnFAYFvkTwbKTb3sjZsdsg_lVEw56gDoiFfLmiKS6L216pbSH_wgQhG5f_FCZcm6LRHP5Zd34fXz4ehwZMllctonA626H6ruaq_vhSG9E6RAafGXtRMWTBqeo0StBoMEgbp3iAVU-GL0fhquCscNkc2bVEOPj91mJLjxpUMc_J2FIEB9ZpXE-Z2Vzov_jAXAW0hMZ8ZjnSQU4BPTZot-PONTIy392mvHex9pa-gUxqhz6ZCniBy_EhL7Xswz92NwHvK-z_x1Yvb8U2XSXwp_gzuEo6evg6_-GLzWB7MWBrriI.ElSbUIWuzmZIbA7PFIkZ-g';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fetch = require('node-fetch');

let invoiceData = {};

function getCustomer(res, clientName) {
  fetch('https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/query?minorversion=30', {
          method: 'post',
          body:    `select * from Customer where CompanyName = '${clientName}'`,
          headers: { 'Content-Type': 'application/text',
                     "Accept": "application/json",
                     "Authorization": "bearer " + token }}).then(res => res.json())
      .then(function(json) {
        console.log(json.QueryResponse);
        const client = json.QueryResponse.Customer[0];
        invoiceData.clientId = client.Id;
        invoiceData.email = client.PrimaryEmailAddr.Address;
        console.log(`clientEmail: ${invoiceData.email}`);
        let reply = "Customer found! What is the payment amount?";
        res.send(JSON.stringify({fulfillmentText : reply}));
      });
}

function invoiceCreateAndSend(res) {
  createInvoice(res);
}

function createInvoice(res) {
  let body = {"Line": [
      {
        "Amount": invoiceData.amount,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "1",
            "name": "Services"
          }
        }
      }
    ],
    "CustomerRef": {
      "value": invoiceData.clientId
    }
  };

  if (invoiceData.description) {
    body.Line[0].Description = invoiceData.description;
  }

  fetch('https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/invoice?minorversion=30', {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', "Accept": "application/json", "Authorization": "bearer " + token }})
    .then(res => res.json())
    .then(function(json) {
      console.log('Invoice created');
      console.log(JSON.stringify(json));
      sendInvoice(res, json.Invoice.Id);
  });
}

function sendInvoice(res, invoiceId) {
  fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/invoice/${invoiceId}/send?sendTo=tedbrink29@gmail.com`, {
    method: 'post',
    headers: { 'Content-Type': 'application/octet-stream',
    "Accept": "application/json",
    "Authorization": "bearer " + token }}).then(res => res.json())
    .then(function(json) {
      console.log('Invoice sent');
      let reply = "Invoice sent.";
      res.send(JSON.stringify({fulfillmentText : reply}));
  });
}

app.post('/webhook', function(req, res) {
  const { body } = req;
  const action = body.queryResult.action;
  console.log(`Action: ${action}`);
  if (action === 'createinvoice.clientName') {
    const { clientName } = body.queryResult.parameters;
    console.log(`clientName: ${clientName}`);
    getCustomer(res, clientName);
  } else if (action === 'createinvoice.amount') {
    invoiceData.amount = body.queryResult.parameters.amount;
    console.log(`amount: ${invoiceData.amount}`);
    let reply = "Got it. Anything else?";
    res.send(JSON.stringify({fulfillmentText : reply}));
  } else if (action === 'createinvoice.description') {
    invoiceData.description = body.queryResult.parameters.description;
    let reply = "Description added. Anything else?";
    res.send(JSON.stringify({fulfillmentText : reply}));
  } else if (action === 'createinvoice.send') {
    invoiceCreateAndSend(res);
  }
});

app.post('/customer', function(req, res) {
  const { clientName } = 'cool cars'; //req.body;
  console.log(`Client name is ${clientName}.`);
  res.send(`Client name is ${clientName}.`);
});

// server config
app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
