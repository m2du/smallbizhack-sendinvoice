const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');
const token = 'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..Ux3i2W706oUp_wXQFqqR9Q.nXRhNIATEGUI96G4o03axfLXK_EYRxtzKNLsRkzt9yUfPFHYdx1XBVDf0CiGUMPwrn0k02Q5sC-qu-tHN7JuoQ5JMmABNlfB6nTjedvslVGXm2QXCyY4uWGEwltqaBB1Jqc6RfxXxDmbMwPR8Y11L7hXoWZG-SzYGtQQyI2ZPehS05picLfz1004sm48MFH2mNutDQqgnwBss6tJ3FOziqiqkyUVSCXG58emsOSawg6L8xsDFB-Z_iss1E81VVm1k-3Yi7NWwn9iTqaZ3T82vib7duxvtW-37-qy8IlnszNi13c4Bw7NwLz0CGZR_1Sh7VHQInZW4x_lPITS68StIDodG1ZRQYMsRljV38xfonzf1FTuqJZx6BAdSgHTnM5BvL91j4RGLGoitY9bqsXiRNV05ol26O4AhL1kxpI0OxOsul0I1WZbwPuppHaZMGn-4KT_H2Ca8gCo7maIm_-Lux5PCDKb9WFm2tpn7Yts7vmKujJQRC4SDly3sdSllNrs0zHwLhiscODC9ydwN8R17Ch_5F9q3U30KYaZ4n4xryG0d0zrd76-qNuzM4FmbutZ3NrpxjnJK8stMcZinv29kWI6KBV7YOpD7_EetLfjGHPXCHCKQAqc-9DAWV0eHoXTWpnni7OKkxQpEPiA7lO10WLAaqz-QSAtHhhZPtS4uhOV-MGmG6G0X5hVbwHxrgrbaj9P8Yvi33XSkHnADnHMxZks2MFxNgmHSPHL4K1Bsi0.IgQiOrZboeVmDh1-0gb9oQ';

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
        "SalesItemLineDetail": {}
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
