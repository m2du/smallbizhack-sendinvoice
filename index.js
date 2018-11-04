const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http');

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
                     "Authorization": "bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..94hQS6Rtl0CcbBgIikwwyQ.snFCOH_Opgidk8u_M9f1jlMOE3jHKpCp6v2HI_KmLteTda6DQNPEi4gJ0ApvxUpjrifpfrXpuaJTC_4WC6BWdZtxKICBS4I2BFImhsnsE8ZOi3iI-y8V-NcCLRd-ELLElYQi9n86Pu06xwl1TrkQv4esH5FBjqs5T9GaEB91NmzSmZqYjSEkwC79cBXdR-VWvJwbDJn3TRg8mqBSw3BFQIPkklBTGB5vHx1U-77vjEzNC2J1p_zwBZpfwjlgad5sdhRYFteA6Z8ZA6SxNtI6CjxAcHMMEOjzbqEyeJLFsMsX9gHtKZRJlchsD5M0dWqqBQ9M9h1HVKXGV127pcH-lzjFOJ9XRqOJwqsW8nwWg7RtCXMwVysBiKCTDT5BhhetCR6vg9CE8B-1Yh0EImhUTEllFoYx7RR4Xl1prdtjY4SVGdgEIOPo8AVv-2n5qjjb9R3YzcIIMypMUsCEHyxGAmep099HKv-pFa6L6qxUK5sEj1mm4GHDQUiRAOHSI3KoNgRh3-fhV7lSrpv1yjGBFXmy2dmEswfBliTdnBCoIstg47Wu-4J8LMi-A0E1K5USwR8FTkTeqz1F6g6jREYiyzFN2LBLwl_zfSbMp14WO-1MKnvuGbcVpsNf8tIlsbOvnBIoy7dJ475ChsJwwYX0ujahTHDUReluKMY3QYAoRdyYnNYxHO9O60yh_Dhi9IppX6__KFhHf-D5C6xb_lQPEpW1e4mdM3q-TAtt1xYDqlA.EG8WCF6kxtwoVdLP4tnZ2Q" }}).then(res => res.json())
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
    body: JSON.stringify({Line:[{Amount: invoiceData.amount, DetailType: 'SalesItemLineDetail', SalesItemLineDetail: {}}],
    CustomerRef: {value: invoiceData.clientId}}),
    headers: { 'Content-Type': 'application/json',
    "Accept": "application/json",
    "Authorization": "bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..94hQS6Rtl0CcbBgIikwwyQ.snFCOH_Opgidk8u_M9f1jlMOE3jHKpCp6v2HI_KmLteTda6DQNPEi4gJ0ApvxUpjrifpfrXpuaJTC_4WC6BWdZtxKICBS4I2BFImhsnsE8ZOi3iI-y8V-NcCLRd-ELLElYQi9n86Pu06xwl1TrkQv4esH5FBjqs5T9GaEB91NmzSmZqYjSEkwC79cBXdR-VWvJwbDJn3TRg8mqBSw3BFQIPkklBTGB5vHx1U-77vjEzNC2J1p_zwBZpfwjlgad5sdhRYFteA6Z8ZA6SxNtI6CjxAcHMMEOjzbqEyeJLFsMsX9gHtKZRJlchsD5M0dWqqBQ9M9h1HVKXGV127pcH-lzjFOJ9XRqOJwqsW8nwWg7RtCXMwVysBiKCTDT5BhhetCR6vg9CE8B-1Yh0EImhUTEllFoYx7RR4Xl1prdtjY4SVGdgEIOPo8AVv-2n5qjjb9R3YzcIIMypMUsCEHyxGAmep099HKv-pFa6L6qxUK5sEj1mm4GHDQUiRAOHSI3KoNgRh3-fhV7lSrpv1yjGBFXmy2dmEswfBliTdnBCoIstg47Wu-4J8LMi-A0E1K5USwR8FTkTeqz1F6g6jREYiyzFN2LBLwl_zfSbMp14WO-1MKnvuGbcVpsNf8tIlsbOvnBIoy7dJ475ChsJwwYX0ujahTHDUReluKMY3QYAoRdyYnNYxHO9O60yh_Dhi9IppX6__KFhHf-D5C6xb_lQPEpW1e4mdM3q-TAtt1xYDqlA.EG8WCF6kxtwoVdLP4tnZ2Q" }}).then(res => res.json())
    .then(function(json) {
      console.log('Invoice created');
      console.log(json);
      sendInvoice(res, json.Invoice.Id);
  });
}

function sendInvoice(res, invoiceId) {
  fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/123146162820179/invoice/${invoiceId}/send?sendTo=${invoiceData.email}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json',
    "Accept": "application/json",
    "Authorization": "bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..94hQS6Rtl0CcbBgIikwwyQ.snFCOH_Opgidk8u_M9f1jlMOE3jHKpCp6v2HI_KmLteTda6DQNPEi4gJ0ApvxUpjrifpfrXpuaJTC_4WC6BWdZtxKICBS4I2BFImhsnsE8ZOi3iI-y8V-NcCLRd-ELLElYQi9n86Pu06xwl1TrkQv4esH5FBjqs5T9GaEB91NmzSmZqYjSEkwC79cBXdR-VWvJwbDJn3TRg8mqBSw3BFQIPkklBTGB5vHx1U-77vjEzNC2J1p_zwBZpfwjlgad5sdhRYFteA6Z8ZA6SxNtI6CjxAcHMMEOjzbqEyeJLFsMsX9gHtKZRJlchsD5M0dWqqBQ9M9h1HVKXGV127pcH-lzjFOJ9XRqOJwqsW8nwWg7RtCXMwVysBiKCTDT5BhhetCR6vg9CE8B-1Yh0EImhUTEllFoYx7RR4Xl1prdtjY4SVGdgEIOPo8AVv-2n5qjjb9R3YzcIIMypMUsCEHyxGAmep099HKv-pFa6L6qxUK5sEj1mm4GHDQUiRAOHSI3KoNgRh3-fhV7lSrpv1yjGBFXmy2dmEswfBliTdnBCoIstg47Wu-4J8LMi-A0E1K5USwR8FTkTeqz1F6g6jREYiyzFN2LBLwl_zfSbMp14WO-1MKnvuGbcVpsNf8tIlsbOvnBIoy7dJ475ChsJwwYX0ujahTHDUReluKMY3QYAoRdyYnNYxHO9O60yh_Dhi9IppX6__KFhHf-D5C6xb_lQPEpW1e4mdM3q-TAtt1xYDqlA.EG8WCF6kxtwoVdLP4tnZ2Q" }}).then(res => res.json())
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
