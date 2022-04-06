var snowflake = require('snowflake-sdk');
const arrmarket=require('../../data/marketlist.json');
var connection;
function initConection() {
    connection = null;
    connection = snowflake.createConnection({
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USER,
        password: process.env.SNOWFLAKE_PASSWORD,
        authenticator: 'SNOWFLAKE'
    }
    );
    // Try to connect to Snowflake, and check whether the connection was successful.
    connection.connect(
        function (err, conn) {
            if (err) {
                console.error('Unable to connect: ' + err.message);
            }
            else {
                console.log('Successfully connected to Snowflake.');
                // Optional: store the connection ID.
                connection_ID = conn.getId();
            }
        }
    );
    connection.execute({
        sqlText: 'use warehouse TRANSFORMING_WH;',
        complete: async function (err, stmt, rows) {
            if (err) {
                console.error('Failed to execute statement due to the following error: ' + err.message);
            } else {
                console.log('Use warehouse');
            }
        }
    });
}

async function getNFTs(){
    
}

exports.getNFTs=function(req,res){
    try {
        initConection();
        connection.execute({
            sqlText: `select distinct TOKEN_ADDRESS,NAME,SYMBOL from DWH_BLOCK.CHAIN.T_NFTS`,
            complete: function (err, stmt, rows) {
                if (err) {
                    console.error('Failed to execute statement due to the following error: ' + err.message);
                } else {
                    const r = arrmarket.filter(m => rows.find(n=>n.SYMBOL==m.symbol));
                    return res.status(200).json(helper.APIReturn(0,{"Result":r},"Success"));
                }
            }});
     
    } catch (error) {
      console.log(error);
      res.status(500).json(helper.APIReturn(101,"Something wrongs"));
    }
  }