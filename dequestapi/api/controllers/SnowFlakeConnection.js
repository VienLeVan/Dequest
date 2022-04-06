var snowflake = require('snowflake-sdk');

let connection;

initConnection = () => {
  connection = null;
  connection = snowflake.createConnection({
    account: 'kb33487.us-east-2.aws',
    username: 'Kelvin',
    password: 'VSHiFGPf3vSCu5',
    authenticator: 'SNOWFLAKE'
  }
  );
  connection.connect(
    function (err, conn) {
      if (err) {
        console.error('Unable to connect: ' + err.message);
      }
      else {
        console.log('Successfully connected to Snowflake.');
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

const executeSqlStatement = async (sqlText, binds) => {
  return new Promise((resolve, reject) => {
    try {
      if (!connection) {
        initConnection();
      }
      connection.execute({
        sqlText,
        binds,
        complete: async function (err, stmt, rows) {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      })
    } catch (er) {
      reject(er);
    }
  })
}

exports.getRoninBattleInfo = async (rAddress) => {
  const sqlText = `select * 
                    from  
                        staging.axie.t_battle_wallets 
                    where
                        roninaddress = '${rAddress}';`;
  return executeSqlStatement(sqlText);
}

exports.getRoninStats = async (rAddress, fromDate, toDate) => {
  const sqlText = `select 
                      roninaddress, 
                      count(wl) battles,
                      sum(iff(wl = 1, 1, 0)) wins,
                      sum(iff(wl = 0, 1, 0)) losses
                    from (
                    select roninaddress,  iff(roninaddress = winner , 1, 0) wl
                    from  
                        staging.axie.t_battle_infor 
                    where
                        roninaddress = '${rAddress}'
                        and game_started > '${fromDate}'
                        and game_started < '${toDate}'
                    )
                    group by roninaddress`;
  return executeSqlStatement(sqlText);
}

exports.getRoninStatAllTime = async (rAddress) => {
  const sqlText = `select 
                      roninaddress, 
                      count(wl) battles,
                      sum(iff(wl = 1, 1, 0)) wins,
                      sum(iff(wl = 0, 1, 0)) losses
                    from (
                            select roninaddress,  iff(roninaddress = winner , 1, 0) wl
                            from  
                                staging.axie.t_battle_infor 
                            where
                                roninaddress = '${rAddress}'
                          )
                    group by roninaddress`;
  return executeSqlStatement(sqlText);
}

exports.checkBattleExist = async (battle_uuids) => {
  const params = battle_uuids.map((b) => `'${b}'`);
  const sql = `select BATTLE_UUID from staging.axie.t_battle_infor where battle_uuid in (${params.join(',')});`;
  const rs = await executeSqlStatement(sql);
  const uuidResponse = rs.map((p) => p.BATTLE_UUID);
  const newSetUuid = new Set(uuidResponse);
  const diff = [...battle_uuids].filter(x => !newSetUuid.has(x));
  return diff;
}

exports.insertBattleInfo = async (address, item) => {
  const sql = `insert into staging.axie.t_battle_infor
      select column1,column2,column3,column4,column5,column6,
      column7,parse_json(column8),column9,column10,parse_json(column11),parse_json(column12),
      column13,column14
      from values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  const first_team = JSON.stringify(item.first_team_fighters);
  const second_team = JSON.stringify(item.second_team_fighters);
  const eloAndItem = JSON.stringify(item.eloAndItem);

  const binds = [
    `${address}`,
    item.battle_uuid,
    item.game_started,
    item.game_ended,
    item.winner,
    item.first_client_id,
    item.first_team_id,
    first_team,
    item.second_client_id,
    item.second_team_id,
    second_team,
    eloAndItem,
    (item.did_player_surrender == undefined ? false : item.did_player_surrender),
    item.pvp_type
  ];
  executeSqlStatement(sql, binds);
}

exports.checkBattleWalletExist = async (address) => {
  const sqlText = `select count(RONINADDRESS) total from staging.axie.t_battle_wallets where roninaddress='${address}';`
  const rs = await executeSqlStatement(sqlText);
  return rs[0].TOTAL > 0;
}

exports.insertBattleWallet = async (binds) => {
  const sqlText = `insert into staging.axie.t_battle_wallets(RoninAddress,Rank,MMR,Slp,Slp_rewards) values(?,?,?,?,?)`;
  return executeSqlStatement(sqlText, binds);
}

exports.updateBattleRoninWallet = async (binds) => {
  const sqlText = `update staging.axie.t_battle_wallets set Rank=column1,MMR=column2,Slp=column3,slp_rewards=column4
  from values(?,?,?,?,?)
  where roninaddress=column5`;

  return executeSqlStatement(sqlText, binds);
}