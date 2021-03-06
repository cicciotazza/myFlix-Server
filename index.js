/** 
 * @file The index file creates the Express application, sets up the server and implements routes to Api
 * endpoints used to access myFlix data. Requests made to these endpoints use mongoose models created in the 
 * models file and are authenticated using strategies implemented in the passport file. The connect method 
 * establishes a connection between mongoose and the database, which is hosted on MongoDB Atlas. The 
 * server and endpoints are hosted on Heroku.
 * @requires mongoose Connects the app to the database and implements data schemas using models.
 * @requires './models.js' The file where data schemas and models are defined.
 * @requires express Used to create an express application.
 * @requires morgan Used to log requests made to the database.
 * @requires passport Used to create strategies for authenticating and authorising requests to the Api endpoints.
 * @requires './auth.js' The file that implements the user login route.
 * @requires cors Used to control origins from which requests to the server can be made.
 * @requires express-validator Used to perform validation on data provided when creating or updating a user.
 */

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require("bcrypt");
const { check, validationResult } = require('express-validator');
//integration with a REST API, requiring Mongoose/Models and access to movies/users/genres/directos
const Models = require("./models.js");
const mongoose = require("mongoose");
//const myFlixDB = Models.Movie;
const Movies = Models.Movie;
const Users = Models.User;

// Use the first line to test the application locally, otherwise use the second one with Heroku
//mongoose.connect("mongodb://127.0.0.1:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Implement morgan to log requests
app.use(morgan("common"));

// added localhost, Heroku, Netifly
let allowedOrigins = ['http://localhost:8081', 'http://localhost:1234', 'https://herokumyflixdb.herokuapp.com/', 'https://cicciotazza-myflix.netlify.app/',
  'http://localhost:4200/', 'https://cicciotazza.github.io/myFlix-Angular-client/', 'https://cicciotazza.github.io/myFlix-Angular-app/', '*'];

//import cors
const cors = require('cors');

// Implement cors to allow requests from all origins, cut off this line or the next code /* app.use...}))); */
app.use(cors());

//Import "Auth.js" file and Passport module
let auth = require('./auth')(app);
const passport = require("passport");
// Run passport file where strategies are implemented
require("./passport.js");

/**
 * All http requests in express take a callback function as a parameter. The function takes as parameters
 * the request and response objects, which can then be used to access the data associated with the request.
 * This callback type will be named: 'requestCallback'.
 * @callback requestCallback
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */

/**
 * Some endpoints are protected. The second parameter of requests made to these endpoints invokes a named 
 * authentication strategy. If authentication succeeds, the authenticated user is attached to the request 
 * object and the request callback is fired. This callback type will be named: 'authenticationCallback'.
 * @callback authenticationCallback
 * @param {string} strategy - the name of the passport strategy used.
 * @param {Object} config - configuration object. Used here to specify that sessions are not used.  
 */

/**
 * GET request to the home page ('/') endpoint.
 * @method GET
 * @param {string} URL 
 * @param {requestCallback}
 * @returns {string} The welcome message.
 */
app.get("/",
  (req, res) => {
    res.send("Hello, welcome to myFlix App.");
  });

//Documentation
app.get("/documentation", (req, res) => {
  res.sendfile("/public/documentation.html", { root: __dirname })
}),

  /**
 * GET request to the /movies endpoint.
 * @method GET
 * @param {string} URL
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An array of all the movie records in the database.
 */
  app.get("/movies",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      Movies.find()
        .then((movies) => {
          res.status(200).json(movies);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error: " + err);
        });
    });

/**
 * GET request to the /users endpoint.
 * @method GET 
 * @param {string} URL
 * @example /users
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An array containing the record of all the users included in the datavase. The mongoose
 * populate method is used to modify the favourite movies array on the response object, to return the
 * documents for the favourite movies, instead of their IDs.
 */
app.get("/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(200).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + error);
      });
  });

/**
 * GET request to the /movies/[Title] endpoint.
 * @method GET
 * @param {string} URL
 * @example /movies/Lost
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An object containing the movie record for the movie whose title is included in the URL. 
 */
app.get("/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err)
      });
  });

/**
 * GET request to the /users/[Username] endpoint.
 * @method GET 
 * @param {string} URL
 * @example /users/UserNr4
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An object containing the record for the user included in the URL. 
 */
app.get("/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ userName: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + error);
      });
  });

/**
 * GET request to the /movies/genre/[Name] endpoint.
 * @method GET 
 * @param {string} URL
 * @example /genres/Drama
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {string} A text description for the movie genre included in the URL. 
 */
app.get("/genres/:genreName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
      .then((movie) => {
        res.json(movie.Genre)
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err);
      });
  });

/**
 * GET request to the /movies/director/[Name] endpoint.
 * @method GET 
 * @param {string} URL
 * @example /movies/directors/Alan%20Ball
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An object containing the data for the movie director included in the URL.
 */
app.get("/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name })
      .then((movie) => {
        res.json(movie.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err);
      });
  });

/**
 * POST request to the /users endpoint to create a new user record. This request requires a request 
 * body containing the fields: Username, Password, Email, Birthday. The fields are first validated 
 * against specified validators before the new user record is created.
 * @method POST 
 * @param {string} URL
 * @param {object} validationChain Series of checks that validate specified fields in the request body.
 * @param {requestCallback}
 * @returns {Object} An object containing the new user record.
 */app.post("/users", [
    // Validation logic here for request
    //you can either use a chain of methods like .not().isEmpty()
    //which means "opposite of isEmpty" in plain english "is not empty"
    //or use .isLength({min: 5}) which means
    //minimum value of 5 characters are only allowed
    check('userName', 'Username is required').isLength({ min: 5 }),
    check('userName', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.password);
    Users.findOne({ userName: req.body.userName })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.userName + "already exists");
        } else {
          Users.create({
            userName: req.body.userName,
            password: hashedPassword,
            email: req.body.email,
            Birthday: req.body.Birthday
          })
            .then((user) => { res.status(201).json(user); })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  });

/**
 * PUT request to the /users/[Username] endpoint to update the user's details. This request requires 
 * a request body containing the fields: Username, Password, Email, Birthday. The fields are first 
 * validated against specified validators before the user record is updated.
 * @method PUT
 * @param {string} URL
 * @example /users/UserNr3
 * @param {object} validationChain Series of checks that validate specified fields in the request body.
 * @param {authenticationCallback}
 * @param {requestCallback}
 * @returns {Object} An object containing the updated user record.
 */
app.put("/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { userName: req.params.Username },
      {
        $set: {
          userName: req.body.userName,
          //password: hashedPassword,
          password: req.body.password,
          email: req.body.email,
          Birthday: req.body.birthday
        }
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      });
  });

/**
 * PUT request to the /users/[Username]/[MovieID] endpoint.
 * @method PUT 
 * @param {string} URL
 * @example /users/UserNr7/60a110a28e923350a5340b06
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An array with the user's updated favourite movies. The mongoose populate method 
 * is used to replace the ID of each movie with the document from the movies collection.
 */app.post("/users/:userName/favoriteMovies/:MovieID",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      Users.findOneAndUpdate(
        { userName: req.params.userName }, {
        $push: { FavoriteMovies: req.params.MovieID }
      },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
          } else {
            res.json(updatedUser);
          }
        });
    });

/**
 * DELETE request to the /users/[Username] endpoint.
 * @method DELETE
 * @param {string} URL
 * @example /users/UserNr1
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {string} A text message: '[Username] has been deregistered'.
 */
app.delete("/users/:userName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ userName: req.params.userName })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.userName + " was not found");
        } else {
          res.status(200).send(req.params.userName + " was deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error" + err);
      });
  });

/**
 * DELETE request to the /users/[Username]/[MovieID] endpoint.
 * @method DELETE 
 * @param {string} URL
 * @example /users/UserNr0/60a110a28e923350a5340b06
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An array with the user's updated favourite movies. The mongoose populate method 
 * is used to replace the ID of each movie with the document from the movies collection.
 */
app.delete("/users/:userName/movies/:title",
  (req, res) => {
    Users.findOneAndUpdate({ userName: req.params.userName }, {
      $pull: { FavoriteMovies: req.params.title }
    },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error" + err);
        } else {
          res.json(updatedUser);
        }
      });
  });

/**
* GET request to the /users/favourites/[Username] endpoint.
* @method GET 
* @param {string} URL
* @example /users/favourites/UserNr11
* @param {authenticationCallback} 
* @param {requestCallback}
* @returns {Object} An array of the IDs of the user's favourite movies.
*/
app.get('/users/favorites/:userName',
  passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ userName: req.params.userName })
      .then((user) => {
        res.status(200).json(user.FavoriteMovies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
  });

/**
* Alternative GET REQUEST TO FAVORITE as /users/favoriteMovies/:userName endpoint.
* @method GET 
* @param {string} URL
* @example /users/favoriteMovies/UserNr12
* @param {authenticationCallback} 
* @param {requestCallback}
* @returns {Object} An array of the IDs of the user's favourite movies.
*/
app.get('/users/favoriteMovies/:userName',
  passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ userName: req.params.userName })
      .then((user) => {
        res.status(200).json(user.FavoriteMovies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
  });

// Testind endpoint
app.get("/secreturl", (req, res) => {
  res.send("This content is top SECRET")
});

// Error handler with log all function
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error founded, fix it!");
  next();
});

/**
 * PUT request to the /users/[Username]/[MovieID] endpoint.
 * @method PUT 
 * @param {string} URL
 * @example /users/UserNr7/60a110a28e923350a5340b06
 * @param {authenticationCallback} 
 * @param {requestCallback}
 * @returns {Object} An array with the user's updated favourite movies. The mongoose populate method 
 * is used to replace the ID of each movie with the document from the movies collection.
 */
app.put('/users/:userName/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.userName },
    { $push: { FavouriteMovies: req.params.MovieID } },
    { new: true }
  ).populate('FavouriteMovies')
    .then((user) => {
      res.status(200).json(user.FavouriteMovies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    })
});


// Listens for requests, port 8080
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("This app is listening on port 8080.");
});