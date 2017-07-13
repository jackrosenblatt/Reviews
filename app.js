// This is the top level Express server application file.
var express = require('express');
var path = require('path');
var validator = require('express-validator');
var exphbs = require('express-handlebars');
var session = require('express-session')
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var index = require('./routes/index');
var auth = require('./routes/auth');

var app = express();

mongoose.connect(process.env.MONGODB_URI);

app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'template',
  extname: '.hbs'
}))
app.set('view engine', '.hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SECRET,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));
app.use(validator());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id)
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({
      username: username
    })
    .then(((user) => {
      if (!user) {
        return done(null, false);
      }
      if (user.password !== password) {
        return done(null, false);
      }
      return done(null, user);
    }))
    .catch((err) => {
      console.log(err);
      return done(err);
    })
}));

app.use('/', auth(passport));
app.use('/', index);

// Start the express server
app.listen(process.env.PORT || 3000);