var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var User = require('../models/models').User;

module.exports = ((passport) => {
  router.get('/signup', ((req, res, next) => {
    res.render('sign_up');
  }))

  router.post('/signup', ((req, res, next) => {
    req.checkBody('username', 'Error: Username is empty').notEmpty();
    req.checkBody('password', 'Error: Password is empty').notEmpty();
    req.checkBody('password_confirm', 'Error: Password confirmation is empty').notEmpty();

    if (req.validationErrors()) {
      res.render('/sign_up')
    } else if (req.body.password !== req.body.password_confirm) {
      res.render('/sign_up')
    } else {
      var newUser = new User({
        username: req.body.username,
        password: req.body.password
      })

      newUser.save()
        .then(() => (res.redirect('/login')))
        .catch((err) => (console.log(err)));
    }
  }))

  router.get('/login', ((req, res, next) => {
    res.render('sign_in');
  }))

  router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }))

  router.get('/logout', ((req, res, next) => {
    req.session.destroy(() => {
      res.redirect('/login')
    })
  }))

  return router;
});