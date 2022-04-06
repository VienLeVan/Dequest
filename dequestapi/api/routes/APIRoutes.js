'use strict';
const {auth} = require('../controllers/helper');
module.exports = function(app) {
  var api = require('../controllers/APIController');
  var apisnowflake = require('../controllers/SnowflakeController');


  // api Route

  app.post('/checkEtherTransaction',api.checkEthTransaction);

  app.post('/sendIlluvium',api.sendIlluvium);

  app.get('/getAxies', api.getAxies);
  app.get('/getRoninBalance',api.getRoninBalance);
  app.get('/getNFTs',apisnowflake.getNFTs);
  app.get('/getAxiesDetail',api.getAxiesDetail);

  app.get('/check_win50_aqua',api.check_win50_double_aqua_teams);
  app.get('/check_win50_surrender',api.check_win50_games_surrender);
  app.get('/check_over_slp',api.check_over_9000_slp);
  app.get('/check_over_axies',api.check_over_20_axies);
  app.get('/check_top_10',api.check_in_top_10);
  app.get('/check_face_johoz',api.check_face_johoz);

  app.get('/stat_twitch/:raddress',  api.stat_twitch);


};
