var express = require('express')
var router = express.Router();
var bodyParser = require('body-parser');
var validator = require('express-validator');
var eValidator = require('email-existence');
var bcrypt = require('bcrypt');
var localStorage = require('store');

var Token = require('./models').Token;
var User = require('./models').User;

// Renders the home page
router.get('/', function(req, res) {
  Token.find({
    tokenString: localStorage.get('token')
  }, function(err, arr) {
    if (err) {
      res.status(500);
      console.log('Internal Database Error');
    } else if (arr.length === 0) {
      res.render('home', {
        name: 'Guest'
      });
    } else {
      User.find({
        _id: arr[0].userId
      }, function(err2, arr2) {
        if (err2) {
          res.status(500);
          console.log('Internal Database Error')
        } else {
          if (arr2.length === 1) {
            res.render('home', {
              name: arr2[0].fname
            });
          }
        }
      })
    }
  })
});

// Renders the FAQ page
router.get('/faq', function(req, res) {
  res.render('faq');
});

// Renders the sign up page
router.get('/sign_up', function(req, res) {
  res.render('sign_up');
});

// Receives the form info from the sign up page
router.post('/sign_up', function(req, res) {

  eValidator.check(req.body.email, function(err, response) {
    if (err) {
      res.status(500);
      console.log('Internal Database Error')
    } else {
      if (response === true) {
        User.find({
          email: req.body.email
        }, function(err2, arr) {
          if (err2)
            console.log('Internal Database Error')
          else {
            if (arr.length === 0) {
              bcrypt.hash(req.body.password, 10, function(err3, hash) {
                if (err3) {
                  res.status(500);
                  console.log('Internal Database Error');
                } else {
                  var tempUser = new User({
                    fname: req.body.firstName,
                    lname: req.body.lastName,
                    email: req.body.email,
                    password: hash
                  })

                  tempUser.save(function(err4) {
                    if (err4) {
                      res.status(500);
                      console.log('Internal Database Error');
                    } else {
                      res.status(200);
                      res.redirect('sign_in');
                    }
                  })
                }
              })

            } else {
              res.render('sign_up', {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                error: 'Email is already in use'
              });
            }
          }
        })
      } else {
        res.render('sign_up', {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          error: 'Must use a real email'
        });
      }
    }
  })
});

// Renders the sign in page
router.get('/sign_in', function(req, res) {
  res.render('sign_in')
});

// Receives the form info from the sign in page
router.post('/sign_in', function(req, res) {
  User.find({
    email: req.body.email
  }, function(err, arr) {
    if (err) {
      res.status(500);
      console.log('Internal Database Error');
    } else {
      if (arr.length === 1) {
        var password = arr[0].password;
        bcrypt.compare(req.body.password, password, function(err2, response) {
          if (err2) {
            res.status(500);
            console.log('Internal Database Error');
          } else {
            if (response === true) {
              var date = new Date()
              var tokenString = (req.body.email + date);

              var token = new Token({
                userId: arr[0]._id,
                token: tokenString,
                createdAt: date
              })
              token.save(function(err) {
                if (err) {
                  res.status(500);
                  res.send('Failed to save data')
                } else {
                  localStorage.token = tokenString;
                  res.redirect('/')
                }
              })
            } else {
              res.render('sign_in', {
                email: req.body.email,
                error: 'Email and/or password are incorrect'
              });
            }
          }
        })
      } else {
        res.render('sign_in', {
          email: req.body.email,
          error: 'Email and/or password are incorrect'
        });
      }
    }
  })
});

router.get('/sign_out', function(req, res) {
  Token.find({
    token: localStorage.token
  }, function(err, arr) {
    if (err) {
      res.status(500);
      console.log(err);
    } else {
      if (arr.length === 0) {
        console.log('Error: No token found')
        res.redirect('/');
      } else {
        localStorage.remove('token');
        arr[0].remove();
        res.redirect('/');
      }
    }
  })

  // if (answer === true) {
  //   store.remove('token');
  // } else {
  //   res.redirect('home')
  // }
})

// Renders the about page
router.get('/categories/:category', function(req, res) {
  res.render(req.params.category);
});

// Renders the about page
router.get('/about', function(req, res) {
  res.render('about');
});

// Renders the contact page
router.get('/contact', function(req, res) {
  var loggedIn = true;
  if (localStorage.token === undefined)
    loggedIn = false;

  res.render('contact', {
    loggedIn: loggedIn
  });
});

// Receives the form info from the sign in page
router.post('/contact', function(req, res) {

})

//
// API for the website
//

// The register API
router.post('/api/users/register', function(req, res) {
  req.checkBody('fname', 'Incomplete register definition').notEmpty();
  req.checkBody('lname', 'Incomplete register definition').notEmpty();
  req.checkBody('email', 'Incomplete register definition').notEmpty();
  req.checkBody('password', 'Incomplete register definition').notEmpty();

  if (req.validationErrors()) {
    res.status(400);
    res.send(req.validationErrors());
  } else {
    req.checkBody('email', 'Invalid Email').isEmail();
    if (req.validationErrors()) {
      res.status(400);
      res.send(req.validationErrors());
    } else {
      User.find({
        email: req.body.email
      }, function(err, arr) {
        if (err)
          res.send(err)
        else {
          if (arr.length === 0) {
            var user = new User({
              fname: req.body.fname,
              lname: req.body.lname,
              email: req.body.email,
              password: req.body.password
            })

            user.save(function(err) {
              if (err) {
                res.status(500);
                res.send('Failed to save data')
              } else {
                res.status(200);
                res.send({
                  success: true
                });
              }
            })
          } else {
            res.status(400);
            res.send('Email is already in use')
          }
        }
      })
    }
  }
})

// The login API
router.post('/api/users/login', function(req, res) {
  req.checkBody('email', 'Login failed').notEmpty();
  req.checkBody('password', 'Login failed').notEmpty();

  if (req.validationErrors()) {
    res.status(301);
    res.send(req.validationErrors());
  } else {
    User.find({
      email: req.body.email,
      password: req.body.password
    }, function(err, arr) {
      if (err) {
        res.status(500);
        res.send('Internal database error');
      } else if (arr.length === 0) {
        res.status(301);
        res.send('Login Failed')
      } else {
        res.status(200);
        var date = new Date()
        var tokenString = (req.body.email + date);

        var token = new Token({
          userId: arr[0]._id,
          token: tokenString,
          createdAt: date
        })
        token.save(function(err) {
          if (err) {
            res.status(500);
            res.send('Failed to save data')
          }
        })

        res.send({
          success: true,
          response: {
            id: arr[0]._id,
            token: tokenString
          }
        });
      }
    })
  }
})

// The logout API
router.get('/api/users/logout', function(req, res) {
  req.checkQuery('token', 'Failed to supply token').notEmpty();

  if (req.validationErrors()) {
    res.status(400);
    res.send(req.validationErrors());
  } else {
    Token.find({
      token: req.query.token,
    }, function(err, arr) {
      if (err) {
        res.status(500);
        res.send('Token cannot be verified');
      } else {
        if (arr.length === 0) {
          res.status(400);
          res.send('Token is Invalid')
        } else {
          arr[0].remove();
          res.status(200);
          res.send({
            success: true
          })
        }
      }
    })
  }
})

module.exports = router;