var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
const uuid = require('uuid/v4')
const session = require('express-session')
var assert = require('assert');

var app = express();

var port = process.env.PORT || 3000;

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());

app.use(express.static('public'));

app.use(session( {
    'secret': '343ji43j4n3jn4jk3n'
}
))

app.post(/PostQuestion/, (req, res) => {
//Basic post outline
  var text = req.body.text,
  return res.status(200);
});


app.get('/home', function (req, res, next) {
  
  res.status(200).send('LOGIN PAAAAGE');
});

app.delete(/\d+/, (req, res) => {
  return res.send('Received a DELETE HTTP method to delete a specific question num.');
});

app.get(/\/dashboard/, function (req, res, next) {
  console.log(req.sessionID);

  if(!req.sessionID) {

    res.redirect("/home");
  } else {
      res.status(200).send('DASHBOARD YEAH');
  }
});

app.get('*', function (req, res, next) {
  console.log(`---- The requested url \"${req.url}\" was not found`);
  res.status(404).send('404 Not Found');
});

app.listen(port, function (err) {
  if (err) {
    throw err;
  }
  console.log(`-- Server listening on port ${port}`);
});