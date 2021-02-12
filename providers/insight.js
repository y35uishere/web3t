// Generated by LiveScript 1.6.0
(function(){
  var moment, ref$, map, foldl, any, each, find, sum, filter, head, values, join, get, post, plus, minus, div, times, BitcoinLib, bip39, jsonParse, deadline, decode, WAValidator, segwitAddress, segwitAddress2, getBitcoinFullpairByIndex, getMasternodeList, findMax, getOneOfMasternode, getEnough, calcFeePerByte, calcDynamicFee, getCalcFeeFunc, calcFeePrivate, calcFeeInstantx, calcFee, getKeys, extend, getDec, addValue, getOutputs, parseRateString, extractVal, parseResult, getDepositAddressInfo, getDepositAddressFromList, getDepositAddress, addOutputsPrivate, addOutputs, getError, createTransaction, pushTx, getTotalReceived, getUnconfirmedBalance, getBalance, incomingVout, outcomingVouts, transformIn, transformOut, transformTx, getApiUrl, checkTxStatus, getTransactions, isValidAddress, toString$ = {}.toString, slice$ = [].slice, out$ = typeof exports != 'undefined' && exports || this;
  moment = require('moment');
  ref$ = require('prelude-ls'), map = ref$.map, foldl = ref$.foldl, any = ref$.any, each = ref$.each, find = ref$.find, sum = ref$.sum, filter = ref$.filter, head = ref$.head, values = ref$.values, join = ref$.join;
  ref$ = require('./superagent.js'), get = ref$.get, post = ref$.post;
  ref$ = require('../math.js'), plus = ref$.plus, minus = ref$.minus, div = ref$.div, times = ref$.times;
  ref$ = require('./deps.js'), BitcoinLib = ref$.BitcoinLib, bip39 = ref$.bip39;
  jsonParse = require('../json-parse.js');
  deadline = require('../deadline.js');
  decode = require('bs58').decode;
  WAValidator = require('multicoin-address-validator');
  segwitAddress = function(publicKey){
    var witnessScript, scriptPubKey;
    witnessScript = BitcoinLib.script.witnessPubKeyHash.output.encode(BitcoinLib.crypto.hash160(publicKey));
    scriptPubKey = BitcoinLib.script.scriptHash.output.encode(BitcoinLib.crypto.hash160(witnessScript));
    return BitcoinLib.address.fromOutputScript(scriptPubKey);
  };
  segwitAddress2 = function(publicKey){
    var scriptPubKey;
    scriptPubKey = BitcoinLib.script.witnessPubKeyHash.output.encode(BitcoinLib.crypto.hash160(publicKey));
    return BitcoinLib.address.fromOutputScript(scriptPubKey);
  };
  getBitcoinFullpairByIndex = function(mnemonic, index, network){
    var seed, hdnode, address, privateKey, publicKey, address2, address3;
    seed = bip39.mnemonicToSeedHex(mnemonic);
    hdnode = BitcoinLib.HDNode.fromSeedHex(seed, network).derive(index);
    address = hdnode.getAddress();
    privateKey = hdnode.keyPair.toWIF();
    publicKey = hdnode.getPublicKeyBuffer().toString('hex');
    address2 = segwitAddress(publicKey);
    address3 = segwitAddress2(publicKey);
    return {
      address: address,
      privateKey: privateKey,
      publicKey: publicKey,
      address2: address2,
      address3: address3
    };
  };
  getMasternodeList = function(arg$, cb){
    var network;
    network = arg$.network;
    return get(getApiUrl(network) + "/masternodes/list").timeout({
      deadline: deadline
    }).end(function(err, res){
      var ref$, list;
      if (err != null) {
        return cb("cannot obtain list - err: " + ((ref$ = err.message) != null ? ref$ : err));
      }
      if (toString$.call(res.body).slice(8, -1) !== 'Array') {
        return cb("expected array");
      }
      list = filter(function(it){
        return it.status === 'ENABLED';
      })(
      res.body);
      return cb(null, list);
    });
  };
  findMax = function(first, current){
    if (current.rank < first.rank) {
      return current;
    } else {
      return first;
    }
  };
  getOneOfMasternode = function(arg$, cb){
    var network;
    network = arg$.network;
    return getMasternodeList({
      network: network
    }, function(err, list){
      var item;
      if (err != null) {
        return cb(err);
      }
      item = foldl(findMax, list[0])(
      list);
      if (item == null) {
        return cb("Not Found");
      }
      return cb(null, item);
    });
  };
  getEnough = function(arg$, amount, youHave, cb){
    var output, outputs, outputAmount, ref$, nextAmount, youHaveNext;
    output = arg$[0], outputs = slice$.call(arg$, 1);
    if (output == null) {
      return cb("Not Enough Funds (Unspent Outputs). You have " + youHave);
    }
    if (output.amount == null) {
      return cb("Expected output amount, got " + output.amount);
    }
    outputAmount = (ref$ = output.amount) != null ? ref$ : 0;
    nextAmount = minus(amount, outputAmount);
    if (+nextAmount <= 0) {
      return cb(null, [output]);
    }
    youHaveNext = plus(youHave, outputAmount);
    return getEnough(outputs, nextAmount, youHaveNext, function(err, other){
      var current, all;
      if (err != null) {
        return cb(err);
      }
      current = (function(){
        switch (false) {
        case +outputAmount !== 0:
          return [];
        default:
          return [output];
        }
      }());
      all = current.concat(other);
      return cb(null, all);
    });
  };
  calcFeePerByte = function(config, cb){
    var network, feeType, account, o, txFee, ref$, amountFee, recipient;
    network = config.network, feeType = config.feeType, account = config.account;
    o = network != null ? network.txFeeOptions : void 8;
    txFee = (ref$ = o != null ? o[feeType] : void 8) != null
      ? ref$
      : (ref$ = network.txFee) != null ? ref$ : 0;
    if (feeType !== 'auto') {
      return cb(null, txFee);
    }
    feeType = 'cheap';
    amountFee = o.cheap;
    recipient = config.account.address;
    return createTransaction((import$({
      feeType: feeType,
      amountFee: amountFee,
      recipient: recipient
    }, config)), function(err, data){
      var bytes, infelicity, calcFee, finalPrice;
      if ((err + "").indexOf("Not Enough Funds (Unspent Outputs)") > -1) {
        return cb(null, o.cheap);
      }
      if (err != null) {
        return cb(err, o.cheap);
      }
      if (toString$.call(data.rawtx).slice(8, -1) !== 'String') {
        return cb("rawtx is expected");
      }
      bytes = data.rawtx.length / 2;
      infelicity = 1;
      calcFee = times(bytes + infelicity, o.feePerByte);
      finalPrice = (function(){
        switch (false) {
        case !(calcFee > +o.cheap):
          return calcFee;
        default:
          return o.cheap;
        }
      }());
      return cb(null, finalPrice);
    });
  };
  calcDynamicFee = function(arg$, cb){
    var network, tx, txType, account, feeType, o, txFee, ref$;
    network = arg$.network, tx = arg$.tx, txType = arg$.txType, account = arg$.account, feeType = arg$.feeType;
    o = network != null ? network.txFeeOptions : void 8;
    txFee = (ref$ = o != null ? o[feeType] : void 8) != null
      ? ref$
      : (ref$ = network.txFee) != null ? ref$ : 0;
    if (feeType !== 'auto') {
      return cb(null, txFee);
    }
    return get(getApiUrl(network) + "/utils/estimatefee?nbBlocks=6").timeout({
      deadline: deadline
    }).end(function(err, data){
      var vals, exists, ref$, calcedFee;
      if (err != null) {
        return cb(err);
      }
      vals = values(data.body);
      exists = (ref$ = vals[0]) != null
        ? ref$
        : -1;
      calcedFee = (function(){
        switch (false) {
        case vals[0] !== -1:
          return network.txFee;
        default:
          return vals[0];
        }
      }());
      return cb(null, calcedFee);
    });
  };
  getCalcFeeFunc = function(network){
    switch (false) {
    case (network != null ? network.txFeeAutoMode : void 8) !== 'per-byte':
      return calcFeePerByte;
    default:
      return calcDynamicFee;
    }
  };
  calcFeePrivate = function(config, cb){
    var network, tx, txType, account, feeType, ref$, o, calcFee;
    network = config.network, tx = config.tx, txType = config.txType, account = config.account, feeType = config.feeType;
    if (((ref$ = account != null ? account.address : void 8) != null ? ref$ : "") === "") {
      return cb("address cannot be empty");
    }
    o = network != null ? network.txFeeOptions : void 8;
    calcFee = getCalcFeeFunc(network);
    return calcFee(config, function(err, txFee){
      if (err != null) {
        return cb(err);
      }
      return getOutputs({
        network: network,
        address: account.address
      }, function(err, outputs){
        var numberOfInputs, fee;
        if (err != null) {
          return cb(err);
        }
        numberOfInputs = outputs.length > 0 ? outputs.length : 1;
        if (o.privatePerInput == null) {
          return cb("private-per-input is missing");
        }
        fee = plus(times(txFee, 2), times(numberOfInputs, o.privatePerInput));
        return cb(null, fee);
      });
    });
  };
  calcFeeInstantx = function(arg$, cb){
    var network, tx, txType, account, feeType, ref$, o, calcFee;
    network = arg$.network, tx = arg$.tx, txType = arg$.txType, account = arg$.account, feeType = arg$.feeType;
    if (((ref$ = account != null ? account.address : void 8) != null ? ref$ : "") === "") {
      return cb("address cannot be empty");
    }
    o = network != null ? network.txFeeOptions : void 8;
    calcFee = getCalcFeeFunc(network);
    return calcFee({
      network: network,
      tx: tx,
      txType: txType,
      account: account,
      feeType: feeType
    }, function(err, txFee){
      if (err != null) {
        return cb(err);
      }
      return getOutputs({
        network: network,
        address: account.address
      }, function(err, outputs){
        var numberOfInputs, fee;
        if (err != null) {
          return cb(err);
        }
        numberOfInputs = outputs.length > 0 ? outputs.length : 1;
        if (o.instantPerInput == null) {
          return cb("instant-per-input is missing");
        }
        fee = times(numberOfInputs, o.instantPerInput);
        return cb(null, fee);
      });
    });
  };
  out$.calcFee = calcFee = function(config, cb){
    var network, tx, txType, account, calcFee;
    network = config.network, tx = config.tx, txType = config.txType, account = config.account;
    if (txType === 'private') {
      return calcFeePrivate(config, cb);
    }
    if (txType === 'instant') {
      return calcFeeInstantx(config, cb);
    }
    calcFee = getCalcFeeFunc(network);
    return calcFee(config, cb);
  };
  out$.getKeys = getKeys = function(arg$, cb){
    var network, mnemonic, index, result;
    network = arg$.network, mnemonic = arg$.mnemonic, index = arg$.index;
    result = getBitcoinFullpairByIndex(mnemonic, index, network);
    return cb(null, result);
  };
  extend = curry$(function(add, json){
    return import$(json, add);
  });
  getDec = function(network){
    var decimals;
    decimals = network.decimals;
    return Math.pow(10, decimals);
  };
  addValue = curry$(function(network, it){
    var dec;
    dec = getDec(network);
    return it.value = (function(){
      switch (false) {
      case it.satoshis == null:
        return it.satoshis;
      case it.amount == null:
        return times(it.amount, dec);
      default:
        return 0;
      }
    }());
  });
  getOutputs = curry$(function(arg$, cb){
    var network, address, url;
    network = arg$.network, address = arg$.address;
    url = network.api.url;
    return get(getApiUrl(network) + "/addr/" + address + "/utxo").timeout({
      deadline: deadline
    }).end(function(err, data){
      var ref$;
      if (err != null) {
        return cb("cannot get outputs - err " + ((ref$ = err.message) != null ? ref$ : err));
      }
      return function(it){
        return cb(null, it);
      }(
      map(extend({
        network: network,
        address: address
      }))(
      filter(function(it){
        return it.amount != null;
      })(
      each(addValue(network))(
      data.body))));
    });
  });
  parseRateString = function(usdInfo){
    var ref$, _, url, extract;
    ref$ = usdInfo.match(/url\(([^)]+)\)(.+)?/), _ = ref$[0], url = ref$[1], extract = ref$[2];
    return {
      url: url,
      extract: extract
    };
  };
  extractVal = function(data, arg$){
    var head, tail;
    head = arg$[0], tail = slice$.call(arg$, 1);
    if (head == null) {
      return data;
    }
    return extractVal(data[head], tail);
  };
  parseResult = function(text, extract, cb){
    if ((extract != null ? extract : "") === "") {
      return cb(null, text);
    }
    return jsonParse(text, function(err, model){
      var result;
      if (err != null) {
        return cb(err);
      }
      result = extractVal(model, extract);
      return cb(null, result);
    });
  };
  getDepositAddressInfo = function(arg$, cb){
    var amount, recipient, network, ref$, mixingInfo, url, extract;
    amount = arg$.amount, recipient = arg$.recipient, network = arg$.network;
    mixingInfo = ((ref$ = network != null ? network.api : void 8) != null
      ? ref$
      : {}).mixingInfo;
    if (toString$.call(mixingInfo).slice(8, -1) !== 'String') {
      return cb("Mixing Pool is not connected");
    }
    ref$ = parseRateString(mixingInfo), url = ref$.url, extract = ref$.extract;
    return get(url).end(function(err, data){
      var ref$;
      if (err != null) {
        return cb("cannot get deposit info - err: " + ((ref$ = err.message) != null ? ref$ : err));
      }
      return cb(null, parseResult(data.text, extract));
    });
  };
  getDepositAddressFromList = function(arg$, cb){
    var amount, recipient, network;
    amount = arg$.amount, recipient = arg$.recipient, network = arg$.network;
    return getMasternodeList({
      network: network
    }, function(err, list){
      if (err != null) {
        return cb(err);
      }
      return cb("Not Implemented");
    });
  };
  getDepositAddress = function(arg$, cb){
    var amount, recipient, network, ref$, mixingInfo;
    amount = arg$.amount, recipient = arg$.recipient, network = arg$.network;
    mixingInfo = ((ref$ = network != null ? network.api : void 8) != null
      ? ref$
      : {}).mixingInfo;
    if (toString$.call(mixingInfo).slice(8, -1) === 'String') {
      return getDepositAddressInfo({
        amount: amount,
        recipient: recipient,
        network: network
      }, cb);
    }
    return getDepositAddressFromList({
      amount: amount,
      recipient: recipient,
      network: network
    }, cb);
  };
  addOutputsPrivate = function(config, cb){
    var txType, total, value, fee, tx, recipient, network, account, o, rest, fee2, ref$, amount;
    txType = config.txType, total = config.total, value = config.value, fee = config.fee, tx = config.tx, recipient = config.recipient, network = config.network, account = config.account;
    if (fee == null || value == null || total == null) {
      return cb("fee, value, total are required");
    }
    o = network != null ? network.txFeeOptions : void 8;
    rest = minus(minus(total, value), fee);
    fee2 = (ref$ = o != null ? o[feeType] : void 8) != null
      ? ref$
      : (ref$ = network.txFee) != null ? ref$ : 0;
    amount = minus(plus(value, fee), fee2);
    return getDepositAddress({
      recipient: recipient,
      amount: amount,
      network: network
    }, function(err, address){
      if (err != null) {
        return cb(err);
      }
      tx.addOutput(address, +value);
      if (+rest !== 0) {
        tx.addOutput(account.address, +rest);
      }
      return cb(null);
    });
  };
  addOutputs = function(config, cb){
    var txType, total, value, fee, tx, recipient, account, rest;
    txType = config.txType, total = config.total, value = config.value, fee = config.fee, tx = config.tx, recipient = config.recipient, account = config.account;
    if (fee == null || value == null || total == null) {
      return cb("fee, value, total are required");
    }
    if (txType === 'private') {
      return addOutputsPrivate(config, cb);
    }
    rest = minus(minus(total, value), fee);
    tx.addOutput(recipient, +value);
    if (+rest !== 0) {
      tx.addOutput(account.address, +rest);
    }
    return cb(null);
  };
  getError = function(config, fields){
    var result;
    result = join(", ")(
    map(function(it){
      return it + " is required field";
    })(
    filter(function(it){
      return config[it] == null;
    })(
    fields)));
    if (result === "") {
      return null;
    }
    return result;
  };
  out$.createTransaction = createTransaction = function(config, cb){
    var err, network, account, recipient, amount, amountFee, feeType, txType;
    err = getError(config, ['network', 'account', 'amount', 'amountFee', 'recipient']);
    if (err != null) {
      return cb(err);
    }
    network = config.network, account = config.account, recipient = config.recipient, amount = config.amount, amountFee = config.amountFee, feeType = config.feeType, txType = config.txType;
    return getOutputs({
      network: network,
      address: account.address
    }, function(err, outputs){
      var amountWithFee;
      if (err != null) {
        return cb(err);
      }
      amountWithFee = plus(amount, amountFee);
      return getEnough(outputs, amountWithFee, 0, function(err, outputs){
        var isNoValue, dec, value, fee, total, tx;
        if (err != null) {
          return cb(err);
        }
        isNoValue = find(function(it){
          return it.value == null;
        })(
        outputs);
        if (isNoValue) {
          return cb('Each output should have a value');
        }
        dec = getDec(network);
        value = times(amount, dec);
        fee = times(amountFee, dec);
        total = sum(
        map(function(it){
          return it.value;
        })(
        outputs));
        if (+minus(minus(total, fee), value) < 0) {
          return cb("Balance is not enough to send tx");
        }
        if (isNaN(total)) {
          return cb('Total is NaN');
        }
        tx = new BitcoinLib.TransactionBuilder(network);
        return addOutputs({
          txType: txType,
          total: total,
          value: value,
          fee: fee,
          tx: tx,
          recipient: recipient,
          network: network,
          account: account
        }, function(err){
          var apply, sign, rawtx;
          if (err != null) {
            return cb(err);
          }
          apply = function(output, i){
            return tx.addInput(output.txid, output.vout);
          };
          sign = function(output, i){
            var key;
            key = BitcoinLib.ECPair.fromWIF(account.privateKey, network);
            return tx.sign(i, key);
          };
          outputs.forEach(apply);
          outputs.forEach(sign);
          rawtx = tx.build().toHex();
          return cb(null, {
            rawtx: rawtx
          });
        });
      });
    });
  };
  out$.pushTx = pushTx = curry$(function(arg$, cb){
    var network, rawtx, txType, sendType;
    network = arg$.network, rawtx = arg$.rawtx, txType = arg$.txType;
    sendType = (function(){
      switch (false) {
      case txType !== 'instant':
        return 'sendix';
      default:
        return 'send';
      }
    }());
    return post(getApiUrl(network) + "/tx/" + sendType, {
      rawtx: rawtx
    }).end(function(err, res){
      var ref$, ref1$;
      if (err != null) {
        return cb(err + ": " + (res != null ? res.text : void 8));
      }
      if (res != null && res.error) {
        return cb("Error: " + (res != null ? res.error : void 8));
      }
      if ((res != null ? (ref$ = res.body) != null ? ref$.txid : void 8 : void 8) == null) {
        return cb("Error: " + (res != null ? res.text : void 8));
      }
      return cb(null, (ref1$ = res.body) != null ? ref1$.txid : void 8);
    });
  });
  out$.getTotalReceived = getTotalReceived = function(arg$, cb){
    var address, network, ref$;
    address = arg$.address, network = arg$.network;
    if ((network != null ? (ref$ = network.api) != null ? ref$.url : void 8 : void 8) == null) {
      return cb("Url is not defined");
    }
    return get(getApiUrl(network) + "/addr/" + address + "/totalReceived").timeout({
      deadline: deadline
    }).end(function(err, data){
      var dec, num;
      if (err != null || data.text.length === 0) {
        return cb(err);
      }
      dec = getDec(network);
      num = div(data.text, dec);
      return cb(null, num);
    });
  };
  out$.getUnconfirmedBalance = getUnconfirmedBalance = function(arg$, cb){
    var network, address, ref$;
    network = arg$.network, address = arg$.address;
    if ((network != null ? (ref$ = network.api) != null ? ref$.url : void 8 : void 8) == null) {
      return cb("Url is not defined");
    }
    return get(getApiUrl(network) + "/addr/" + address + "/unconfirmedBalance").timeout({
      deadline: deadline
    }).end(function(err, data){
      var dec, num;
      if (err != null || data.text.length === 0) {
        return cb(err);
      }
      dec = getDec(network);
      num = div(data.text, dec);
      return cb(null, num);
    });
  };
  out$.getBalance = getBalance = function(arg$, cb){
    var address, network, ref$;
    address = arg$.address, network = arg$.network;
    if ((network != null ? (ref$ = network.api) != null ? ref$.url : void 8 : void 8) == null) {
      return cb("Url is not defined");
    }
    return get(getApiUrl(network) + "/addr/" + address + "/balance").timeout({
      deadline: deadline
    }).end(function(err, data){
      var dec, num;
      if (err != null || data.text.length === 0) {
        return cb(err);
      }
      dec = getDec(network);
      num = div(data.text, dec);
      return cb(null, num);
    });
  };
  incomingVout = curry$(function(address, vout){
    var addrs, ref$;
    addrs = (ref$ = vout.scriptPubKey) != null ? ref$.addresses : void 8;
    if (toString$.call(addrs).slice(8, -1) !== 'Array') {
      return false;
    }
    return addrs.indexOf(address) > -1;
  });
  outcomingVouts = curry$(function(address, vout){
    var addresses, ref$;
    addresses = (ref$ = vout.scriptPubKey) != null ? ref$.addresses : void 8;
    if (toString$.call(addresses).slice(8, -1) !== 'Array') {
      return null;
    }
    if (addresses.indexOf(address) === -1) {
      return {
        value: vout.value,
        address: addresses.join(",")
      };
    }
    return null;
  });
  transformIn = function(arg$, t){
    var net, address, network, tx, time, fee, ref$, vout, pending, unspend, amount, to, from, url;
    net = arg$.net, address = arg$.address;
    network = net.token;
    tx = t.txid;
    time = t.time;
    fee = (ref$ = t.fees) != null ? ref$ : 0;
    vout = (ref$ = t.vout) != null
      ? ref$
      : [];
    pending = t.confirmations === 0;
    unspend = head(
    filter(incomingVout(address))(
    vout));
    amount = unspend != null ? unspend.value : void 8;
    to = address;
    from = (function(){
      switch (false) {
      case toString$.call(t.vin).slice(8, -1) !== 'Array':
        return t.vin.map(function(it){
          return it.addr;
        })[0];
      default:
        return t.vin.addr;
      }
    }());
    url = net.api.url + "/tx/" + tx;
    return {
      network: network,
      tx: tx,
      amount: amount,
      fee: fee,
      time: time,
      url: url,
      to: to,
      from: from,
      pending: pending
    };
  };
  transformOut = function(arg$, t){
    var net, address, network, tx, time, fee, ref$, vout, pending, outcoming, amount, to, from, url;
    net = arg$.net, address = arg$.address;
    network = net.token;
    tx = t.txid;
    time = t.time;
    fee = (ref$ = t.fees) != null ? ref$ : 0;
    vout = (ref$ = t.vout) != null
      ? ref$
      : [];
    pending = t.confirmations === 0;
    outcoming = filter(function(it){
      return it != null;
    })(
    map(outcomingVouts(address))(
    vout));
    amount = foldl(plus, 0)(
    map(function(it){
      return it.value;
    })(
    outcoming));
    to = outcoming.map(function(it){
      return it.address;
    }).join(",");
    from = address;
    url = net.api.url + "/tx/" + tx;
    return {
      network: network,
      tx: tx,
      amount: amount,
      fee: fee,
      time: time,
      url: url,
      to: to,
      pending: pending,
      from: from
    };
  };
  transformTx = curry$(function(config, t){
    var selfSender, ref$;
    selfSender = find(function(it){
      return it.addr === config.address;
    })(
    (ref$ = t.vin) != null
      ? ref$
      : []);
    if (selfSender == null) {
      return transformIn(config, t);
    }
    return transformOut(config, t);
  });
  getApiUrl = function(network){
    var apiName, ref$;
    apiName = (ref$ = network.api.apiName) != null ? ref$ : 'api';
    return network.api.url + "/" + apiName;
  };
  out$.checkTxStatus = checkTxStatus = function(arg$, cb){
    var network, tx;
    network = arg$.network, tx = arg$.tx;
    return cb("Not Implemented");
  };
  out$.getTransactions = getTransactions = function(arg$, cb){
    var network, address, ref$;
    network = arg$.network, address = arg$.address;
    if ((network != null ? (ref$ = network.api) != null ? ref$.url : void 8 : void 8) == null) {
      return cb("Url is not defined");
    }
    return get(getApiUrl(network) + "/txs/?address=" + address).timeout({
      deadline: 15000
    }).end(function(err, data){
      if (err != null) {
        return cb(err);
      }
      return jsonParse(data.text, function(err, result){
        var txs;
        if (err != null) {
          return cb(err);
        }
        if (toString$.call(result != null ? result.txs : void 8).slice(8, -1) !== 'Array') {
          return cb("Unexpected result");
        }
        txs = filter(function(it){
          return it != null;
        })(
        map(transformTx({
          net: network,
          address: address
        }))(
        result.txs));
        return cb(null, txs);
      });
    });
  };
  out$.isValidAddress = isValidAddress = function(arg$, cb){
    var address, network, token, addressIsValid;
    address = arg$.address, network = arg$.network, token = arg$.token;
    if (token != null) {
      token = token.toUpperCase();
    }
    addressIsValid = WAValidator.validate(address, token, 'both');
    if (!addressIsValid) {
      return cb("Address is not valid");
    }
    return cb(null, address);
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
