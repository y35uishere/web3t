// Generated by LiveScript 1.6.0
(function(){
  var mainnetConfig, testnetConfig, testnet2Config, mainnet, testnet, ref$, ref1$, color, type, enabled, name, token, image, usdInfo, out$ = typeof exports != 'undefined' && exports || this;
  mainnetConfig = {
    decimals: 18,
    txFee: '0.0014',
    txFeeOptions: {
      auto: '0.0020',
      cheap: '0.00014'
    },
    messagePrefix: 'Ethereum',
    mask: '0x0000000000000000000000000000000000000000',
    api: {
      provider: 'velas2',
      web3Provider: 'https://explorer.velas.com/rpc',
      url: 'https://explorer.velas.com',
      apiUrl: 'https://explorer.velas.com/api'
    }
  };
  testnetConfig = {
    decimals: 18,
    txFee: '0.0014',
    txFeeOptions: {
      auto: '0.0020',
      cheap: '0.0020'
    },
    messagePrefix: 'Ethereum',
    mask: '0x0000000000000000000000000000000000000000',
    api: {
      provider: 'velas2',
      web3Provider: 'https://explorer.testnet.veladev.net/rpc',
      url: 'https://explorer.testnet.veladev.net',
      apiUrl: 'https://explorer.testnet.veladev.net/api'
    }
  };
  testnet2Config = {
    disabled: true,
    decimals: 18,
    txFee: '0.0014',
    txFeeOptions: {
      auto: '0.0020',
      cheap: '0.00014'
    },
    messagePrefix: 'Ethereum',
    mask: '0x0000000000000000000000000000000000000000',
    api: {
      provider: 'velas2',
      web3Provider: 'https://tn.yopta.net/rpc',
      url: 'https://testnet-v2.velas.com',
      apiUrl: "http://139.59.138.137"
    }
  };
  out$.mainnet = mainnet = mainnetConfig;
  out$.testnet = testnet = (typeof window != 'undefined' && window !== null ? (ref$ = window.location) != null ? (ref1$ = ref$.href) != null ? ref1$.indexOf('testnet2') : void 8 : void 8 : void 8) > -1 ? testnet2Config : testnetConfig;
  out$.color = color = '#9E4FEB';
  out$.type = type = 'coin';
  out$.enabled = enabled = true;
  out$.name = name = 'Velas';
  out$.token = token = 'vlx2';
  out$.image = image = "data:image/png;base64,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";
  out$.usdInfo = usdInfo = "url(https://explorer.velas.com/ticker).price_usd";
}).call(this);
