var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/', (req, res) => (
  res.render('home')
))

module.exports = router;