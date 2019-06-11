var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session')
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
var usersCollection;
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
  if(!req.body.question || !req.body.question.questionText) {
    //Bad request
    res.status(400).send();
  } else {
    questionsCollection.insertOne(
      {
        author: usersCollection.find(
          {
            sessionID: req.sessionID
          }).username,
        questionText: req.body.question.questionText
      }
    )
    res.status(200).send();
  }
});

app.post(/PostComment/, (req, res) => {
  if(!req.body.question || !req.body.comment || !req.body.comment.text) {
    //Bad request
    res.status(400).send();
  } else {
    questionsCollection.updateOne(
      {_id: req.body.question._id},
      {
        $set: 
        { 
          comment: 
          {
            author: usersCollection.find(
              {
                sessionID: req.sessionID
              }).username,
            text: req.body.question.comment.text
          }
        }
      }
    )
    res.status(200).send();
  }
})

app.post("login", (req, res) => {
  if(!req.body.user || !req.body.user.username) {
    //Bad request
    res.status(400).send();
  } else {
    var sentUsername = req.params.userName;
    user = usersCollection.find(
      {
        username: sentUsername
      }
    ).username;
    if(!user) {
      usersCollection.insertOne(
          {
            username: sentUsername,
          }
        )
    }
    usersCollection.updateOne(
      //Store the session for the user.
      { username: sentUsername },
      { $push: { sessionID: req.sessionID }}
    );
    
    res.redirect("/dashboard");
  }
})

app.post(/logout/, (req, res) =>
{
  if(!req.body.user || !req.body.user.username) {
    //Bad request
    res.status(400).send();
  } else {
    //Clear user session and return to login page
    usersCollection.updateOne(
      { username: sentUsername },
      { $push: { sessionID: ""}}
    );
    
    res.redirect("/login");
  }
})


app.get("/", (req, res) => {
  if(!req.sessionID) {
    res.redirect('/login')
  } else {
    res.redirect('/dashboard')
  }
})

app.delete(/DeleteQuestion/, (req, res) => {
  req.params.questionNumber;
  return res.send('Received a DELETE HTTP method to delete a specific question num.');
});

app.get(/\/login/, function (req, res) {
  res.status(200).send("login page");
});

app.get("/dashboard", function (req, res, next) {
  console.log(req.sessionID);
  var user = usersCollection.find(
  {
    sessionID: req.sessionID
  }).username;
  if(!user) {
    //The user is not logged in with an active sessionID
    res.redirect("/login");
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
  usersCollection = db.collection('users');

  app.listen(port, function (err) {  
    console.log(`-- Server listening on port ${port}`);
  });

});