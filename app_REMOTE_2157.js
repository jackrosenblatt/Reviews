// This is the top level Express server application file.
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var exphbs = require('express-handlebars');

var app = express();

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

app.engine('.hbs', exphbs({
  defaultLayout: 'template',
  extname: '.hbs'
}));
app.set('view engine', '.hbs');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(validator());

// Make files in the folder `public` accessible via Express
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes');
app.use('/', routes)

// Start the express server
app.listen(process.env.PORT || 3000);