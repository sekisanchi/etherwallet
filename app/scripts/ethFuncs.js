'use strict';
var ethFuncs = function() {}
ethFuncs.validateEtherAddress = function(address) {
	if (address.substring(0, 2) != "0x") return false;
	else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
	else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) return true;
	else
	return this.isChecksumAddress(address);
}
ethFuncs.isChecksumAddress = function(address) {
	return address == ethUtil.toChecksumAddress(address);
}
ethFuncs.validateHexString = function(str) {
	if (str == "") return true;
	str = str.substring(0, 2) == '0x' ? str.substring(2).toUpperCase() : str.toUpperCase();
	var re = /^[0-9A-F]+$/g;
	return re.test(str);
}
ethFuncs.sanitizeHex = function(hex) {
	hex = hex.substring(0, 2) == '0x' ? hex.substring(2) : hex;
	if (hex == "") return "";
	return '0x' + this.padLeftEven(hex);
}
ethFuncs.padLeftEven = function(hex) {
	hex = hex.length % 2 != 0 ? '0' + hex : hex;
	return hex;
}
ethFuncs.addTinyMoreToGas = function(hex) {
	hex = this.sanitizeHex(hex);
	return new BigNumber(hex).plus(etherUnits.getValueOfUnit('gwei')*41).toDigits(2).toString(16); //add 41 gwei extra for faster mining
}
ethFuncs.decimalToHex = function(dec) {
	return new BigNumber(dec).toString(16);
}
ethFuncs.hexToDecimal = function(hex) {
	return new BigNumber(this.sanitizeHex(hex)).toString();
}
ethFuncs.contractOutToArray = function(hex) {
	hex = hex.replace('0x', '').match(/.{64}/g);
	for (var i = 0; i < hex.length; i++) {
		hex[i] = hex[i].replace(/^0+/, '');
		hex[i] = hex[i] == "" ? "0" : hex[i];
	}
	return hex;
}
ethFuncs.getNakedAddress = function(address) {
	return address.toLowerCase().replace('0x', '');
}
ethFuncs.getDeteministicContractAddress = function(address, nonce) {
	address = address.substring(0, 2) == '0x' ? address : '0x' + address;
	return '0x' + ethUtil.sha3(ethUtil.rlp.encode([address, nonce])).slice(12).toString('hex');
}
ethFuncs.padLeft = function(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
ethFuncs.getDataObj = function(to, func, arrVals) {
	var val = "";
	for (var i = 0; i < arrVals.length; i++) val += this.padLeft(arrVals[i], 64);
	return {
		to: to,
		data: func + val
	};
}
ethFuncs.ecSignEIP155 = function(tx, privateKey, old){
  var msgHash = this.hashEIP155(tx, old);
  var sig = ethUtil.secp256k1.sign(msgHash, privateKey);
  var ret = {};
  ret.r = sig.signature.slice(0, 32);
  ret.s = sig.signature.slice(32, 64);
  ret.v = old ? sig.recovery + 27 : sig.recovery + 37; // ethChainid*2+1
  tx.raw[6] = Buffer.from([ret.v]); tx.raw[7] = ret.r; tx.raw[8] = ret.s;
}
ethFuncs.hashEIP155 = function(tx, old){
    tx.raw[6] = Buffer.from([1]); //ETH chain id
    tx.raw[7] = tx.raw[8] = 0;
    var toHash = old ? tx.raw.slice(0,6) : tx.raw;
    return ethUtil.rlphash(toHash);
}
ethFuncs.estimateGas = function(dataObj, isClassic, callback) {
    var gasLimit = 2000000;
	dataObj.gasPrice = '0x01';
    dataObj.gas = '0x' + new BigNumber(gasLimit).toString(16);
	ajaxReq.getTraceCall(dataObj, isClassic, function(data) {
		if (data.error) {
			callback(data);
			return;
		}
        function recurCheckBalance(ops){
            var startVal = 24088+ops[0].cost;
            for(var i=0;i<ops.length-1;i++){
                var remainder = startVal-(gasLimit-ops[i].ex.used);
                if (ops[i+1].sub  && ops[i+1].sub.ops.length && (gasLimit-ops[i+1].cost)> remainder) startVal+= (gasLimit-ops[i+1].cost)-startVal;
                else if (ops[i+1].cost > remainder) startVal+= ops[i+1].cost-remainder;
            }
            if(!dataObj.to) startVal+=37000; //add 37000 for contract creation
            startVal = startVal==gasLimit ? -1: startVal;
            return startVal;
        }
        if(data.data.vmTrace && data.data.vmTrace.ops.length) {
            var result = data.data.vmTrace.ops;
            var estGas = recurCheckBalance(result);
            estGas =  estGas < 0 ? -1 : estGas;
        }
        else{
            var stateDiff = data.data.stateDiff;
            stateDiff = stateDiff[dataObj.from.toLowerCase()]['balance']['*'];
            if(stateDiff)
                var estGas = new BigNumber(stateDiff['from']).sub(new BigNumber(stateDiff['to'])).sub(new BigNumber(dataObj.value));
            else 
                var estGas = new BigNumber(-1);
            if(estGas.lt(0)||estGas.eq(gasLimit)) estGas = -1;
        }
		callback({
			"error": false,
			"msg": "",
			"data": estGas.toString()
		});
	});
}
module.exports = ethFuncs;