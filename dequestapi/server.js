require('dotenv').config();
global.helper = require('./api/controllers/helper');
var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser');

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  var routes = require('./api/routes/APIRoutes'); //importing route
  routes(app); //register the route
app.listen(port);

console.log('Dequest api started on: ' + port);
