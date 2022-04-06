const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('API/../data/userdata.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the chinook database.');
  });

module.exports={
    DB:db
}