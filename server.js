var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

/*
Setup:

export MONGO_HOST="classmongo.engr.oregonstate.edu"
export MONGO_USER='cs290_ONID'
export MONGO_PASSWORD='cs290_ONID'
export MONGO_DB_NAME='cs290_ONID'

Windows instructions:

$env:MONGO_HOST="classmongo.engr.oregonstate.edu"
$env:MONGO_USER='cs290_ONID'
$env:MONGO_PASSWORD='cs290_ONID'
$env:MONGO_DB_NAME='cs290_ONID'
where ONID is your lowercase user id

Run:
npm start
*/


/**************************** SETUP ****************************/
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

/**************************** Request Handlers ****************************/
app.post("/postQuestion", (req, res) => {
//Basic post outline
  if(!req.body.content) {
    //Bad request
    res.status(400).send();
  } else {
    var user = 'Unknown User';
    db.collection('users').findOne({sessionID: req.sessionID}, function (err, result) {
      if(!err) {
        user = result.username;
        db.collection('questions').insertOne(
          {
            author: user,
            content: req.body.content,
            title: req.body.title,
            date: Date(Date.now()).toString(),
            likes: 0,
            comments: []
          }, function (err, result) {
            if(!err) {
              res.redirect("/dashboard")
            }
          }
        );
      }
    })   
  }
});


app.post("/postComment", (req, res) => {
  if(!req.body._id || !req.body.content) {
    //Bad request
    res.status(400).send();
  } else {
    db.collection('users').findOne({sessionID: req.sessionID}, function (err, result) {
      if(!err) {
        user = result.username;
        var myquery = {"_id": ObjectId(req.body._id)};
        var newvalues = { $push: { comments: { author: user, content: req.body.content } } };
        db.collection('questions').updateOne(myquery, newvalues, function(err, result) {
          if (!err) {
            res.redirect("/dashboard");
          }
        });
      }
    });
  }
})


app.post("/login", (req, res) => {
  //TODO: Clean this up. I know it's ugly :/
  console.log(req.sessionID);
  const collection = db.collection('users');
  if(!req.body.username) {
    //Bad request
    res.status(400).send();
  } else {
    var sentUsername = req.body.username;
    user = collection.findOne(
      {
        username: sentUsername
      }, function (err, result) {
        if (!err) {
          user = result;
          console.log(user);
          if(!user) {
        
            collection.insertOne(
                {
                  username: sentUsername,
                  sessionID: req.sessionID
                }, function (err, result) {
                  if(err) {
                  } else {
                    res.redirect('/dashboard');
                  }
                }
              )
          } else {
            collection.updateOne(
              {username: sentUsername},
              {$set: {sessionID: req.sessionID}},
              function (err, result) {
                if(err) {
                } else {
                  res.redirect('/dashboard');
                }
              }
            )
          }
        }
      }
    );
  }
});


app.get("/logout", (req, res) =>
{
    db.collection('users').updateOne(
      { sessionID: req.sessionID },
      { $set: { sessionID: ""}},
      function(err, result) {
        if(!err) {
          res.redirect("/login");
        }
      }
    );
});


app.get("/", (req, res) => {
    res.redirect('/login')
});


app.get("/deleteQuestion/:id", (req, res) => {
  var question = {"_id": ObjectId(req.params.id)}
  questionsCollection.remove(question, function(err, result) {
    if(!err) {
   //   res.redirect('dash')
      res.redirect("/dashboard");
    }
  });
});


app.get("/login", function (req, res) {
  res.status(200).render('login', {
    loggedIn: false
  });
});


app.get("/dashboard", function (req, res, next) {
  const collection = db.collection('users');
  var user = collection.findOne({sessionID: req.sessionID}, function(err, result) {
    if (err || result == null || result.username == null) {
      res.redirect("/login");
    } else {
      var currentAuthor = result.username;
      var questions = db.collection('questions').find({}).toArray(function(err, result) {
        if (err) throw err;
        res.status(200).render('dashboard', {
          loggedIn: true,
          q: result.reverse(),
          currentAuthor
        });
      });
    }
  });
});


app.get('*', function (req, res, next) {
  console.log(`---- The requested url \"${req.url}\" was not found`);
  res.status(404).render('404');
});


/**************************** START ****************************/
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





/**************************** NOT IMPLEMENTED ****************************/
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

app.delete("deleteComment", (req, res) => {

  var comment = {'question.comments.commend_id': req.body._id}
  questionsCollection.remove(comment);
  return res.send('Deleted comment.');
});


app.post("searchText", (req, res) => {
  var questions = {$contains:{content: req.body.searchText}};
  var foundQuestions = questionsCollection.find(questions);
  //TODO: render w/ found questions
})