'use strict';
var Token = function(contractAddress, userAddress, symbol, decimal, type) {
	this.contractAddress = contractAddress;
	this.userAddress = userAddress
	this.symbol = symbol;;
	this.decimal = decimal;
	this.type = type;
	this.balance = "loading";
}
Token.balanceHex = "0x70a08231";
Token.transferHex = "0xa9059cbb";
Token.popTokens = [{
	"address": "0x74c1e4b8cae59269ec1d85d3d4f324396048f4ac",
	"symbol": "BeerCoin 🍺 ",
	"decimal": 0,
	"type": "default"
},
/*{ http://www.blockcdn.org/
  "address": "0x1e797Ce986C3CFF4472F7D38d5C4aba55DfEFE40",
  "symbol": "BlockCDN",
  "decimal": 0, // ???
  "type": "default"
},*/
{
  "address": "0xe4c94d45f7aef7018a5d66f44af780ec6023378e",
  "symbol": "CryptoCarbon",
  "decimal": 6,
  "type": "default"
},
{
	"address": "0xbb9bc244d798123fde783fcc1c72d3bb8c189413",
	"symbol": "DAO",
	"decimal": 16,
	"type": "default"
},
{
	"address": "0x5c40eF6f527f4FbA68368774E6130cE6515123f2",
	"symbol": "DAO extraBalance",
	"decimal": 0,
	"type": "default"
},
{
	"address": "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a",
	"symbol": "DGD",
	"decimal": 9,
	"type": "default"
},
{
	"address": "0x54bda709fed875224eae569bb6817d96ef7ed9ad",
	"symbol": "DGDb",
	"decimal": 0,
	"type": "default"
},
{
  "address": "0xa74476443119A942dE498590Fe1f2454d7D4aC0d",
  "symbol": "GNT (Golem)",
  "decimal": 18,
  "type": "default"
},
{
  "address": "0xb582baaf5e749d6aa98a22355a9d08b4c4d013c8",
  "symbol": "HKG",
  "decimal": 3,
  "type": "default"
},
{
  "address": "0x888666CA69E0f178DED6D75b5726Cee99A87D698",
  "symbol": "ICN",
  "decimal": 18,
  "type": "default"
},
{
	"address": "0xc66ea802717bfb9833400264dd12c2bceaa34a6d",
	"symbol": "MKR",
	"decimal": 18,
	"type": "default"
},
{
	"address": "0x45e42D659D9f9466cD5DF622506033145a9b89Bc",
	"symbol": "Nexium",
	"decimal": 3,
	"type": "default"
},
{
	"address": "0xD8912C10681D8B21Fd3742244f44658dBA12264E",
	"symbol": "PLU",
	"decimal": 18,
	"type": "default"
},
{
	"address": "0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5",
	"symbol": "REP",
	"decimal": 18,
	"type": "default"
},
{
	"address": "0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009",
	"symbol": "SNGLS",
	"decimal": 0,
	"type": "default"
},
{
	"address": "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
	"symbol": "Unicorn 🦄 ",
	"decimal": 0,
	"type": "default"
},
{
	"address": "0x4DF812F6064def1e5e029f1ca858777CC98D2D81",
	"symbol": "XAUR",
	"decimal": 8,
	"type": "default"
}];
Token.prototype.getContractAddress = function() {
	return this.contractAddress;
}
Token.prototype.getUserAddress = function() {
	return this.userAddress;
}
Token.prototype.setUserAddress = function(address) {
	this.userAddress = address;
}
Token.prototype.getSymbol = function() {
	return this.symbol;
}
Token.prototype.getDecimal = function() {
	return this.decimal;
}
Token.prototype.getBalance = function() {
	return this.balance;
}
Token.prototype.getBalanceBN = function() {
	return this.balanceBN;
}
Token.prototype.setBalance = function() {
	var balanceCall = ethFuncs.getDataObj(this.contractAddress, Token.balanceHex, [ethFuncs.getNakedAddress(this.userAddress)]);
	var parentObj = this;
	ajaxReq.getEthCall(balanceCall, false, function(data) {
		try {
			if (!data.error) {
				parentObj.balance = new BigNumber(data.data).div(new BigNumber(10).pow(parentObj.getDecimal())).toString();
				parentObj.balanceBN = new BigNumber(data.data).toString();
			}
		} catch (e) {
			parentObj.balance = globalFuncs.errorMsgs[20];
            parentObj.balanceBN = '0';
		}
	});
}
Token.prototype.getData = function(toAdd, value) {
	try {
		if (!ethFuncs.validateEtherAddress(toAdd)) throw globalFuncs.errorMsgs[5];
		else if (!globalFuncs.isNumeric(value) || parseFloat(value) < 0) throw globalFuncs.errorMsgs[7];
		var value = ethFuncs.padLeft(new BigNumber(value).times(new BigNumber(10).pow(this.getDecimal())).toString(16), 64);
		var toAdd = ethFuncs.padLeft(ethFuncs.getNakedAddress(toAdd), 64);
		var data = Token.transferHex + toAdd + value;
		return {
			isError: false,
			data: data
		};
	} catch (e) {
		return {
			isError: true,
			error: e
		};
	}
}
module.exports = Token;
