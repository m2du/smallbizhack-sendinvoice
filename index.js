const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fetch = require('node-fetch');

function getCustomer(clientName) {
  fetch('https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/query?minorversion=30', {
          method: 'post',
          body:    `select * from Customer where CompanyName = '${clientName}'`,
          headers: { 'Content-Type': 'application/text',
                     "Accept": "application/json",
                     "Authorization": "bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..i2s3YTaQ3EIEhQR5Q2fpHw.0vdQ0xqVSYWQaGG7p3sPfNTGGAa6sMzw3UnkhwqYCBolP4FfTvOESJ15RESZiRIBNMajI6fFucnpIbWcJqyHmz9JmvSJdBxi2Sc9daJZ5ozBSMNUFyM6WrGfS2a-7IOj51Fclwfshp7lrk-wWCgcLpFV6qpLPkcteUhtmb7UDIUedcZUpn9jK5Rd82WBNx6DulBNthwCx7ZKwAD1yRAAn5XhLhz1aGR4x2SUTqWuERY6FRvHFMSjbKza6AF8G6MjobjmPx4LbFoi7NvdquWSvaMnR4pxldF-95HMLeP9tjK8ROd2DxB7DIgWzB7r9LINvLO2dCPDUhalP6T7A7tlTqNmjiPpBTloLsygajxbkp1--XeyF5x8dL6GxEVF94JwKnBj1rtZAqAULKjaPOBB-QJb1X7l1mAe5MuxinWWE-Nm2LH6fNCzEFVjZnUSTyIY2xf8bMWqrn-0TSsggN50wnzUcyKehADvToYUeOd4UGXWvbXxYtPBaeeuXLtMkB1_byo_BOUpwK5YtFhH4X8r6etMdlJHK72L6kgfF83rGL3xnXX6S8oehDBvZ-imoM5kOy7r2Z81MVwBssXPN5viOZWoOOIzW1iJvZxcSoqYk1pwICumjtgM-mKiVRCEgTxnQxGrfvm1Xb2Jy4PSRqBcDYZ7vD_NsKx-C_DU-2wkqnoahDazkUzCLgKDEjrN74TewxGRjeZhqYyGyzZjaLlR0hj-8OmZFraAvrfDMS1gTPw.7qDPknkV9iC4yYWw1JXuIw" }}).then(res => res.json())
      .then(json => console.log(JSON.stringify(json)));
}

app.post('/webhook', function(req, res) {
  const { body } = req;
  const { clientName } = body.queryResult.parameters;
  getCustomer(clientName);
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
