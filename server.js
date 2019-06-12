var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session')
var MongoClient = require('mongodb').MongoClient;

/*
Setup:

export MONGO_HOST="classmongo.engr.oregonstate.edu"
export MONGO_USER='cs290_ONID'
export MONGO_PASSWORD='cs290_ONID'
export MONGO_DB_NAME='cs290_ONID'

Run:
npm start
*/

//TODO: Question: How are we tracking the id's to view, like, update, etc. and also to delete?

const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDBName = process.env.MONGO_DB_NAME;

var app = express();
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {
  extended: true
}));
app.use(express.static('public'));
app.use(session( {
    'secret': 'YarHar314159265843'
}
));

var port = process.env.PORT || 3000;
var mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
var db = null;
var usersCollection;
var questionsCollection;

app.post("postQuestion", (req, res) => {
//Basic post outline
  if(!req.body.content) {
    //Bad request
    res.status(400).send();
  } else {
    questionsCollection.insertOne(
      {
        author: usersCollection.find(
          {
            sessionID: req.sessionID
          }).author,
        content: req.body.content,
        date: Date.now()
      }
    )
    res.status(200).send();
  }
});


app.post("postComment", (req, res) => {
  if(!req.body._id || !req.body.content) {
    //Bad request
    res.status(400).send();
  } else {
    questionsCollection.updateOne(
      {_id: req.body._id},
      {
        $push: 
        { 
          comments: {
            comment:
            {
              author: usersCollection.find(
                {
                  sessionID: req.sessionID
                }).username,
              text: req.body.content
            }
          }
          
        }
      }
    )
    res.status(200).send();
  }
})


app.get("viewQuestion", (req, res) => {
  var question = {_id: req.body._id};
  questionsCollection.updateOne(
    question,
    {
      $inc: {
        views: 1
      }
    }
  )
})


app.get("likeQuestion", (req, res) => {
  var question = {_id: req.body._id};
  questionsCollection.updateOne(
    question,
    {
      $inc: {
        likes: 1
      }
    }
  )
})


app.get("likeComment", (req, res) => {
  var comment = {'question.comments.comment._id': req.body._id};
  questionsCollection.updateOne(
    comment,
    {
      $inc: {
        likes: 1
      }
    }
  )
})


app.post("/login", (req, res) => {

  if(!req.body.username) {
    //Bad request
    res.status(400).send();
  } else {
    var sentUsername = req.body.username;
    user = usersCollection.find(
      {
        username: sentUsername
      }
    ).username;
    if(!user) {
      usersCollection.insertOne(
          {
            username: sentUsername,
            sessionID: req.sessionID
          }, function (err, result) {
            if(err) {
            } else {
              res.redirect('/dashboard');
              console.log('redirected');
            }
          }
        )
    }
  }
})


app.post("logout", (req, res) =>
{
  if(!req.body.username) {
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
  var user = usersCollection.find(
    {
      sessionID: req.sessionID
    }).username;
    if(!user) {
      //The user is not logged in with an active sessionID
      res.redirect("/login");
    }
  if(!user) {
    res.redirect('/login')
  } else {
    res.redirect('/dashboard')
  }
})


app.post("searchText", (req, res) => {
  //Will return the first 10 questions that have *question text content* matching the search string
  var questions = {$contains:{content: req.body.searchText}};
  var foundQuestions = questionsCollection.find(questions).limit(10);
  //TODO: render w/ found questions
})


app.delete("deleteQuestion", (req, res) => {

  var question = {_id: req.body._id}
  questionsCollection.remove(question);
  return res.send('Deleted question.');
});

app.delete("deleteComment", (req, res) => {

  var comment = {'question.comments.commend_id': req.body._id}
  questionsCollection.remove(comment);
  return res.send('Deleted comment.');
});


app.get("/login", function (req, res) {
  res.status(200).render('login', {
  });
});


app.get("/dashboard", function (req, res, next) {
  console.log(req.sessionID);
  var user = usersCollection.find(
  {
    sessionID: req.sessionID
  });
  if(!user) {
    //The user is not logged in with an active sessionID
    res.redirect("/login");
  } else {
    //Sort in decreasing order of date to begin with. You got 10 here.
      var questions = questionsCollection.find().sort({date: -1}).limit(10);
      //TODO: Render page with questions as data.
      res.status(200).render('dashboard', {
        q: questions
      });
  }
});


app.get('*', function (req, res, next) {
  console.log(`---- The requested url \"${req.url}\" was not found`);
  res.status(404).render('404');
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