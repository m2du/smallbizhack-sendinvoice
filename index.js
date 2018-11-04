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
                     "Authorization": "bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..rD-cVAeIWkCz-FO-8eG1sQ.2Sea-3L4q0BKM2qakaXWOU_Qc4dUxY1yCY5rG3B9ldQgE6hu5ItBQHEFG5znNB5u02IoEUZwGxF78OcLvQR8Z-TWuNExtlU8z6VCB-e5uygXCAG7KGwOz3xweJtpUOhysOGIIdCE6WRQyDSBpNIvER-ZqUDjJiB3-Wb-CDkEd2hWknSiUJHx4dWxnNbTPIsTHRRSI164SXizDTfF786Vo7pBJTCNJZX3RHoHE4-DwxLizVKKA-ivMiLkhBaw2ktyqM62w-YBuBD-YEXz-4n5SFQbYoas83OyDvKvqds6E6I0eQ9c_iPUkBaNifRnQQGV18uqvqOPeWV2KgY1HQpk6GYlsnhkzK29rzzhD1PhHfcvJBEgGLG3JPsOzhWNNbc-SIn5dmqQSh6d8sXvz6Kewk3IV9JqJRhq-BaMrGNZLMNh7suH2-2L6bKoTVxiW9N3FKL6_x5-qPFkj30aM5WWPWmAi8dPC5XcMXW3PHD4gOEJvmwfvOQ32Hb7A1xlYbKIoQxDXPb_NngwDzJ2tjY-kw3VOzo4n4rKr797-kmcdWoVlHSmY3fEUWJantNlRgnlKt1TTPNSCvL5AydCDYE1hzY0DTH6UX2RKvn7coXWhGd6P4Zfxx21Tymk2M69RUR3vI_EBILsbcUzmKVtsMiqukgj0aEACzF6vOF1yiGhPPAKcQCm3-N-HlVJbGrlrNhUFpwbBYlxcydq3U9ofbtIym_MCZA98guZ_SfgaZGQqSU.qjdenx4h26DEhSfd43Kueg" }}).then(res => res.json())
      .then(json => console.log(JSON.stringify(json)));
}

app.post('/webhook', function(req, res) {
  const { body } = req;
  const { clientName } = body.parameters;
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
