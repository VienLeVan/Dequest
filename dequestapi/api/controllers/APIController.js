'use strict';
const Web3 = require('web3');

const {
  getRoninBattleInfo,
  getRoninStats,
  getRoninStatAllTime,
  checkBattleExist,
  insertBattleInfo,
  checkBattleWalletExist,
  insertBattleWallet,
  updateBattleRoninWallet,
} = require('./SnowFlakeConnection');

const contractabi = require('../contracts/axies.json');
const InputDataDecoder = require('ethereum-input-data-decoder');
const roninbrigabi = require('../contracts/roninBridge.json');
const roninBrigedecoder = new InputDataDecoder(roninbrigabi);
const contracts = require("../../data/contracts.json");
const illuviumabi = require("../contracts/Illuvium.json");

//const Web3 = new Web3 ('https://api.etherscan.io');
var basePostURL = 'https://axieinfinity.com/graphql-server-v2/graphql';
const axios = require('axios');
const { getDateToString } = require('./helper');
const etherscanurl = 'https://api.etherscan.io/api?';


var token = null;
const APIKey = process.env.APIKey;
//var Eth = require('web3-eth');
// or using the web3 umbrella package
var web3 = new Web3('https://api.roninchain.com/rpc');

async function getBalance(balance) {
  const contract = await new web3.eth.Contract(contractabi, '0x32950db2a7164aE833121501C797D79E7B79d74C');

  try {
    var balance = await contract.methods.balanceOf(balance)
      .call()
      ;
    console.log(balance);
    return balance;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

async function getProfile(roninaddress) {
  try {
    var body = {
      "operationName": "GetProfileByRoninAddress",
      "variables": {
        "roninAddress": roninaddress
      },
      "query": "query GetProfileByRoninAddress($roninAddress: String!) {\n  publicProfileWithRoninAddress(roninAddress: $roninAddress) {\n    ...Profile\n    __typename\n  }\n}\n\nfragment Profile on PublicProfile {\n  accountId\n  name\n  addresses {\n    ...Addresses\n    __typename\n  }\n  __typename\n}\n\nfragment Addresses on NetAddresses {\n  ethereum\n  tomo\n  loom\n  ronin\n  __typename\n}\n"
    }
    var r = await axios.post(basePostURL, body);
    var jsondata = null;
    if (r != null) {
      jsondata = r.data.data.publicProfileWithRoninAddress.addresses.ethereum;
      console.log(jsondata);
    }
    return jsondata;
  } catch (error) {
    console.log(error);
  }
}

async function getTokenIdByAddress(raddress, index) {
  try {
    const contract = await new web3.eth.Contract(contractabi, '0x32950db2a7164aE833121501C797D79E7B79d74C');
    var balance = await contract.methods.tokenOfOwnerByIndex(raddress, index)
      .call()
      ;
    return balance;
  } catch (error) {
    console.log(error);
  }
}

async function getAxieDetail(Aid) {
  try {
    let body = {
      "operationName": "GetAxieDetail",
      "variables": {
        "axieId": Aid
      },
      "query": "query GetAxieDetail($axieId: ID!) {\n  axie(axieId: $axieId) {\n    ...AxieDetail\n    __typename\n  }\n}\n\nfragment AxieDetail on Axie {\n  id\n  image\n  class\n  chain\n  name\n  genes\n  owner\n  birthDate\n  bodyShape\n  class\n  sireId\n  sireClass\n  matronId\n  matronClass\n  stage\n  title\n  breedCount\n  level\n  figure {\n    atlas\n    model\n    image\n    __typename\n  }\n  parts {\n    ...AxiePart\n    __typename\n  }\n  stats {\n    ...AxieStats\n    __typename\n  }\n  auction {\n    ...AxieAuction\n    __typename\n  }\n  ownerProfile {\n    name\n    __typename\n  }\n  battleInfo {\n    ...AxieBattleInfo\n    __typename\n  }\n  children {\n    id\n    name\n    class\n    image\n    title\n    stage\n    __typename\n  }\n  __typename\n}\n\nfragment AxieBattleInfo on AxieBattleInfo {\n  banned\n  banUntil\n  level\n  __typename\n}\n\nfragment AxiePart on AxiePart {\n  id\n  name\n  class\n  type\n  specialGenes\n  stage\n  abilities {\n    ...AxieCardAbility\n    __typename\n  }\n  __typename\n}\n\nfragment AxieCardAbility on AxieCardAbility {\n  id\n  name\n  attack\n  defense\n  energy\n  description\n  backgroundUrl\n  effectIconUrl\n  __typename\n}\n\nfragment AxieStats on AxieStats {\n  hp\n  speed\n  skill\n  morale\n  __typename\n}\n\nfragment AxieAuction on Auction {\n  startingPrice\n  endingPrice\n  startingTimestamp\n  endingTimestamp\n  duration\n  timeLeft\n  currentPrice\n  currentPriceUSD\n  suggestedPrice\n  seller\n  listingIndex\n  state\n  __typename\n}\n"
    }
    var r = await axios.post(basePostURL, body);
    return r;
  } catch (error) {
    console.log(error);
  }
}

async function getAxieClass(Aid) {
  try {
    let body = {
      "operationName": "GetAxieClass",
      "variables": {
        "axieId": Aid
      },
      "query": "query GetAxieClass($axieId: ID!) {\n  axie(axieId: $axieId) {\n    ...Class\n    __typename\n  }\n}\n\nfragment Class on Axie {\n  class\n  __typename\n}\n"
    }

    var r = await axios.post(basePostURL, body);
    return r;
  } catch (error) {
    console.log(error);
  }
}

async function getEtherTransaction(ethaddress) {
  try {
    var latestblock = await axios.get('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=' + APIKey);
    var endblock = parseInt(latestblock.data.result, 16);
    var para = 'module=account&action=txlist&address=' + ethaddress + '&startblock=0&endblock=' + endblock + '&sort=asc&apikey=' + APIKey;
    var transactions = await axios.get(etherscanurl + para);

    for (var i = 0; i < transactions.data.result.length; i++) {
      var tran = transactions.data.result[i];

      // if(tran.hash=='0x7847558d0c32482495cc7e675764e7003483ecf96e69206fdc95b0c7dd089ff3')
      //   console.log(tran);
      if (tran.to == '0x1a2a1c938ce3ec39b6d47113c7955baa9dd454f2') {
        var status = await axios.get(etherscanurl + 'module=transaction&action=getstatus&txhash=' + tran.hash + '&apikey=' + APIKey);
        if (status.data.result.isError == 1)

          continue;
        var i = roninBrigedecoder.decodeData(tran.input);

        console.log(i);
        console.log(tran);
        if (i != null && i.method != null && i.method == 'depositEthFor')
          return tran;
        else return 'No transaction';
      }
    }
    console.log(transactions.data.result);

  } catch (error) {
    console.log(error);
  }
}

async function getRoninBalance(roninAddress) {
  let balances = [];
  try {
    let abi;
    let contract;
    for await (let con of contracts) {
      try {
        abi = require(con.abi);
        contract = await new web3.eth.Contract(abi, con.address);
        var bl = await contract.methods.balanceOf(roninAddress).call();

        var value = bl / 10 ** con.tokendecimal;
        balances.push({ "name": con.name, "Value": value });
      } catch (error) {
        balances.push({ "name": con.name, "Value": "not found" });
      }
    }
    return balances;
  } catch (error) {
    return null;
  }
}

async function sendIlluvium(to_address, amount) {
  try {
    var web3eth = new Web3('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    web3eth.eth.accounts.wallet.add(process.env.PAY_PRIVATEKEY);
    var contract = await new web3eth.eth.Contract(illuviumabi, process.env.ILLUVIUM_ADDRESS);
    var bl = await contract.methods.transfer(to_address, amount).send({ "from": process.env.PAY_ADDRESS, "gas": "100000" });
    return bl.transactionHash;
  } catch (error) {
    return "Something wrongs";
  }
}

async function check_win50_double_aqua_teams(raddress) {
  try {
    let url = `https://game-api.axie.technology/logs/pvp/${raddress}`;
    var battles = await axios.get(url);
    let win_count = 0;
    if (battles != null) {
      for await (const bat of battles.data.battles) {
        let winner = bat.winner;
        if (winner != raddress)
          continue;
        let aqua_count = 0;
        let [axie1, axie2, axie3] = bat.second_team_fighters;
        var axieinfor1 = await getAxieClass(axie1);
        if (axieinfor1.data.data.axie.class == 'Aquatic')
          aqua_count += 1;
        //urlaxie_infor = await getAxieDetail(axie2);
        var axieinfor2 = await getAxieClass(axie2)
        if (axieinfor2.data.data.axie.class == 'Aquatic')
          aqua_count += 1;
        //urlaxie_infor = await getAxieDetail(axie3);
        var axieinfor3 = await getAxieClass(axie3);
        if (axieinfor3.data.data.axie.class == 'Aquatic')
          aqua_count += 1;
        if (aqua_count >= 2)
          win_count += 1;
      }
      return win_count >= 50;
    }
    else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

async function check_win_surrender50_games(raddress) {
  try {
    let url = `https://game-api.axie.technology/logs/pvp/${raddress}`;
    var battles = await axios.get(url);
    let win_count = 0;
    if (battles != null) {
      for await (const bat of battles.data.battles) {
        let winner = bat.winner;
        if (winner != raddress)
          continue;
        let surrender = bat.did_player_surrender;
        if (surrender != undefined && surrender == true)
          win_count += 1;
      }
      return win_count >= 50;
    }
    else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

async function check_face_jihoz(raddress) {
  try {
    let url = `https://game-api.axie.technology/logs/pvp/${raddress}`;
    var battles = await axios.get(url);
    let has_jihoz = false;
    if (battles != null) {
      for await (const bat of battles.data.battles) {
        if (bat.second_client_id == '0xa09a9b6f90ab23fcdcd6c3d087c1dfb65dddfb05');
        {
          has_jihoz = true;
          break;
        }
      }
      return has_jihoz;
    }
    else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

async function check_rank_top_10(raddress) {
  try {
    let url = `https://game-api.axie.technology/toprank?limit=10`;
    var top10 = await axios.get(url);
    let is_in_top10 = false;
    for await (const top of top10.data.items) {
      if (top.client_id == raddress) {
        is_in_top10 = true;
      }
    }

    return is_in_top10;
  } catch (error) {
    console.log(error);
  }
}

async function get_slp_balance(raddress) {
  //const abi=require('../contracts/slp.json');
  //const contract = await new web3.eth.Contract(abi, '0xa8754b9Fa15fc18BB59458815510E40a12cD2014');

  try {
    let url = `https://game-api.axie.technology/slp/v2/${raddress}`;
    let balance = await axios.get(url);
    for await (const tt of balance.data) {
      if (tt.name == 'Breeding Potion') {
        let bl = tt.raw_total;
        let chaintotal = tt.blockchain_related.balance;
        console.log(bl + chaintotal);
        return bl + chaintotal;
      }

    }
    return 0;

  } catch (error) {
    console.log(error);
    return 0
  }
}


/** insert battle ronin */
async function get_battle_store_db(rAddress) {
  try {
    const url = `https://game-api.axie.technology/logs/pvp/${rAddress}`;
    const battlesResponse = await axios.get(url);
    const { battles } = battlesResponse.data;
    const uuids = battles.map((p) => p.battle_uuid);
    const result_uuids = await checkBattleExist(uuids);
    const insertBattle = battles.filter((p) => result_uuids.indexOf(p.battle_uuid) > -1);
    for (let i = 0; i < insertBattle.length; i += 1) {
      await insertBattleInfo(rAddress, insertBattle[i]);
    }
  } catch (error) {
    console.log(error);
  }
}

async function insert_update_axie_battle_wallet(rAddress) {
  try {
    const response = await axios.get(`https://game-api.axie.technology/toprank?offset=0&limit=400`);
    const topRanks = response.data.items;
    const item = topRanks.find((p) => p.client_id === rAddress);
    if (item) {
      const mmrResponse = await axios.get(`https://game-api.axie.technology/mmr/${item.client_id}`)
      const mmr = mmrResponse.data[0];
      const slpResponse = await axios.get(`https://game-api.axie.technology/slp/${item.client_id}`)
      const slp = slpResponse.data[0];
      const isExist = await checkBattleWalletExist(rAddress);
      if (isExist) { 
        // update
        const binds = [item.rank, mmr.items[0].rank, slp.raw_total, slp.total, item.client_id];
        await updateBattleRoninWallet(binds);
      } else { // insert
        const binds = [item.client_id, item.rank, mmr.items[0].rank, slp.raw_total, slp.total];
        await insertBattleWallet(binds);
      }
    }
  } catch (er) {
    console.log(er);
  }
}

async function get_stat_twitch(rAddress) {
  await insert_update_axie_battle_wallet(rAddress);
  await get_battle_store_db(rAddress);

  const fromDate = getDateToString(-7);
  const toDate = getDateToString(1);
  const walletInfo = await getRoninBattleInfo(rAddress);
  const rs = await getRoninStats(rAddress, getDateToString(), toDate);
  const statResponse = await getRoninStats(rAddress, fromDate, toDate);
  const allTimeResponse = await getRoninStatAllTime(rAddress);

  const currentDay = rs[0];
  const stat7Days = statResponse[0];
  const statAllTime = allTimeResponse[0];

  const stat = {};
  stat.mmr = walletInfo.length > 0 ? walletInfo[0].MMR : 0;
  stat.rank = walletInfo.length > 0 ? walletInfo[0].RANK : 0;
  stat.daily_win_lose = currentDay ? currentDay?.WINS / currentDay?.LOSSES : 0;

  stat.seven_days_win = stat7Days ? stat7Days.WINS : 0;
  stat.seven_days_lose = stat7Days ? stat7Days.LOSSES : 0;
  stat.seven_days_win_lose_percent = stat7Days ? stat7Days.WINS / stat7Days.LOSSES : 0;

  stat.all_time_lose = statAllTime ? statAllTime.LOSSES : 0;
  stat.all_time_win = statAllTime ? statAllTime.WINS : 0;
  stat.all_time_win_lose_percent = statAllTime ? statAllTime.WINS / statAllTime.LOSSES : 0;

  stat.slp_balance = walletInfo.length > 0 ? walletInfo[0].SLP : 0;
  stat.total_slp_reward = walletInfo.length > 0 ? walletInfo[0].SLP_REWARDS : 0;

  return stat;
}

exports.checkEthTransaction = async function (req, res) {
  try {
    var rs = await getProfile(req.body.raddress);
    if (rs == null || rs == '')
      return res.status(200).json({ 'data': 'No found Ether address' })
    var r = await getEtherTransaction(rs);
    return res.status(200).json({ r });
  } catch (error) {
    console.log(error);
  }
}

exports.getAxies = async function (req, res) {
  try {
    var rs = await getBalance(req.query.raddress);
    if (rs <= 0) {
      return res.status(200).json(helper.APIReturn(0, { rs }, "No Axies"));
    }
    return res.status(200).json(helper.APIReturn(0, { rs }, "Success"));
  } catch (error) {
    console.log(error);
  }
}

exports.getAxiesDetail = async function (req, res) {
  try {
    let arrAxies = [];
    var rs = await getBalance(req.query.raddress);
    if (rs <= 0) {
      return res.status(200).json(helper.APIReturn(0, { rs }, "No Axies"));
    }
    for (var i = 0; i < rs; i++) {
      let tokenid = await getTokenIdByAddress(req.query.raddress, i);
      let axie = await getAxieDetail(tokenid);
      let data = {
        "Axie Name": axie.data.data.axie.name,
        "Level": axie.data.data.axie.level
      }
      arrAxies.push(data);
      console.log(tokenid);
    }
    return res.status(200).json(helper.APIReturn(0, { "Axies": arrAxies }, "Success"));
  } catch (error) {
    console.log(error);
  }
}

exports.getProfile = async function (req, res) {
  try {
    var rs = await getProfile(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { rs }, "Success"));
  } catch (error) {
    console.log(error);
  }
}

exports.getRoninBalance = async function (req, res) {
  try {
    var bls = await getRoninBalance(req.query.raddress);
    if (bls == null)
      return res.status(401).json(helper.APIReturn(101, "something wrongs"));
    return res.status(200).json(helper.APIReturn(0, { "Balances": bls }, "Success"));

  } catch (error) {
    return res.status(401).json(helper.APIReturn(101, "something wrongs"));
  }
}

exports.sendIlluvium = async function (req, res) {
  try {
    var rs = await sendIlluvium(req.body.toAddress, req.body.amount);
    return res.status(200).json(helper.APIReturn(0, { "Transaction": rs }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.check_win50_double_aqua_teams = async function (req, res) {
  try {
    var rs = await check_win50_double_aqua_teams(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { "Result": rs }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.check_win50_games_surrender = async function (req, res) {
  try {
    var rs = await check_win_surrender50_games(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { "Result": rs }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.check_over_9000_slp = async function (req, res) {
  try {
    var rs = await get_slp_balance(req.query.raddress);
    let bl = rs;
    return res.status(200).json(helper.APIReturn(0, { "Result": (bl > 9000) }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.check_over_20_axies = async function (req, res) {
  try {
    var rs = await getBalance(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { "Result": (rs >= 20) }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.check_in_top_10 = async function (req, res) {
  try {
    var rs = await check_rank_top_10(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { "Result": rs }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}


exports.check_face_johoz = async function (req, res) {
  try {
    var rs = await check_face_jihoz(req.query.raddress);
    return res.status(200).json(helper.APIReturn(0, { "Result": rs }, "Success"));
  } catch (error) {
    console.log(error);
    res.status(500).json(helper.APIReturn(101, "Something wrongs"));
  }
}

exports.stat_twitch = async function (req, res) {
  try {
    const { raddress } = req.params;
    const twitchResult = await get_stat_twitch(raddress);
    return res.status(200).json(helper.APIReturn(0, twitchResult, 'success'))
  } catch (error) {
    console.log(error)
    res.status(500).json(helper.APIReturn(101, 'Something wrongs'));
  }
}
