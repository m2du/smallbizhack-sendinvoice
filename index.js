const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');
const token = 'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..AAiEJ8cyfagrHf4BtFek5Q.OnFqMiZQ3LJiGPCjLNEh6lpxSdPnUnOLPTbVXJZL4TRe7SKqCxFT2sZkSbs--8BUsZ2IrjoFnQO7ryMr2vJLqydtMXJSvwjt7Ad3-Itc45aeYlnXqQXjp_99DBrUu7GiVVB1OspIhdwd3uYm0bsqAm9c_aLOnngdkwnsq-Jdd9RepOiAhD1EhVFCiwL1u4gYQ1HJKZ8kjE1cdPe6vRgsyCM6KcfFkyS6gINTE7u6NTLbqP4wn7XxoDwH3yDqeQ1c6SBYUmMiLOdRjR68OYQu9pAkYFjhW9mIukfydmFi3IKXcQNdqk90ENVDk9OyGHVapWGypTD5-5VIGS2eA5IrOOftNiLzk_4iVSp_a83srb24jd-70xWSoJAUNwLAAYLUROuiTQ-L1UL4MD8gFbmKq3fRayVp-MNiWk6lEWKsAiH4pnZL9IEOeOMbX1UoVBsCkCqRN9EKAMosFBXYUCYTTbr7OINKtPwUUKzwBOcyt2TnP7bQ2Q7F6X85TN58jVgi6aM_UdB0fqIKNjVwQ-B0F4_RkvXCVCmTImPkWcEaq0VFHBrZE7AuL_GtrpSAqvmhzPbtAD-8h20j1Ap-kxy7cWK27s3ZnJPuTxAdFc6W-Nqwgf60Rjt-_flhiA7ia98f4qNs6_OJFR853Y3IEC3WlHGfD7x0hXMOUjSfHHRkpkweIHelMji8PR-k8-4AReEQdoBI_Ks3xFvHOCkLft3steSeVkZuq1d58uJ8i8Ob6Ps.J_JQv5Ao7OwJWxoCJEcvZA';

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
        let reply = "Customer found! What is the payment amount?";
        res.send(JSON.stringify({fulfillmentText : reply}));
      });
}

function invoiceCreateAndSend(res) {
  createInvoice(res);
}

function createInvoice(res) {
  fetch('https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/invoice?minorversion=30', {
    method: 'post',
    body: JSON.stringify({Line:[{Amount: invoiceData.amount, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: {}}], CustomerRef: {value: invoiceData.clientId}}),
    headers: { 'Content-Type': 'application/json', "Accept": "application/json", "Authorization": "bearer " + token }})
    .then(res => res.json())
    .then(function(json) {
      console.log('Invoice created');
      console.log(JSON.stringify(json));
      sendInvoice(res, json.Invoice.Id);
  });
}

function sendInvoice(res, invoiceId) {
  fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/invoice/${invoiceId}/send?sendTo=${invoiceData.email}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json',
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
    invoiceData.amount = body.queryResult.parameters;
    let reply = "Got it. Anything else?";
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
