const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');
const token = 'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..QVyP-VeyK1osGRFx33o1Qg.sPk2wVd3daHalKNaZYrhG0PQHl1qubxRwWUMfutZsOmEFr5fD-PCVs_5lxR-zOn-Wt955hwvQxU9m1XWP6aeXF5PByypTjynFOL8oQjf50gGzkndrmb7_Mks3EtQ7DuvRXjh7N8EC-ae-Pr5HKX93kG8DX1IxZbn7zg98IUJL_Wt5Ita7soQUjq7gmJEhkoBPyPXKXpA8ysag_s20FuNJ8PsBQR_1RGQFtFIfrFLfcxN3pBljVIIlrRIAoljp5sgEWbBc60tFE5xvEP4uVs_i69nNAx6qn4k0hPKO26VZrgqcQA1mQMfcpDbTssZXKBa5gveybYqo1gQ_X0-UfE9OsyXq0OPbJWoakWzuGyRN5Ggru5m7phSQQyDMlFQ0pzI48IartoII20qEa4D3aw-lVLyPgc9ZulAAX5rsfBp8jokTMNAc_jv47F4q4_LpkZAnZsMOAraVhlEXN25Pfgh2y74Jg-8O4JFvRy8pm46G0Jz0rX11ARbuBx69QsLXjOynqBCBbGYLEv0wnAL-ngGXq_ps9i4mh6gfflZBTnQJ3RWpixUXOv9z3OQm_eSDzMD5eQyaJVeMEEsldpO8Usm9I1lwsm6TWY5xlqnuO1stHFws9Q81aWqc_rLkjhEpWoWjbMr2FPpE790XDHJ3h8y_gxdNUp1UH-IcOgSqI4dhLwm92Gg0cqKGjYck3JAxoK7ycLT8jqr9MDzLenDkL5DL0_e-XKKmDRwMFlt0eOU6rI.2hXBX3z-GmijXhe6Dwfb5g';

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
