var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
const uuid = require('uuid/v4')
const session = require('express-session')
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;

const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDBName = process.env.MONGO_DB_NAME;

var app = express();

var port = process.env.PORT || 3000;

var mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
var db = null;

var questionsCollection;

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());

app.use(express.static('public'));

app.use(session( {
    'secret': 'YarHar314159265843'
}
))

app.post(/PostQuestion/, (req, res) => {
//Basic post outline

  questionsCollection.insertOne(
    {
      user: req.body.question.user,
      questionText: req.body.question.questionText
    }
  )

  res.status(200).send();
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

MongoClient.connect(mongoUrl, function (err, client) {
  if (err) {
    console.log(`-- Error connecting to mongo client. Did you specify environment variables correctly?`);
    console.log(`---- Host: ` + mongoHost);
    console.log(`---- Port: ` + mongoPort);
    console.log(`---- User: ` + mongoUser);
    console.log(`---- Password: ` + mongoPassword);
    console.log(`---- DB: ` + mongoDBName);
    throw err;
  }
  
  db = client.db(mongoDBName);

  questionsCollection = db.collection('questions');

  app.listen(port, function (err) {  
    console.log(`-- Server listening on port ${port}`);
  });

});

