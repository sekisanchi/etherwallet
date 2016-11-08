'use strict';
var sendOfflineTxCtrl = function($scope, $sce, walletService) {
	walletService.wallet = null;
	walletService.password = '';
	$scope.unitReadable = "ETH";
	$scope.valueReadable = "";
	$scope.showAdvance = false;
	$scope.showRaw = false;
	$scope.showWalletInfo = false;
	$scope.gasPriceDec = 0;
	$scope.nonceDec = 0;
	$scope.tokens = Token.popTokens;
	$scope.Validator = Validator;
	$scope.tx = {
		gasLimit: globalFuncs.defaultTxGasLimit,
		from: "",
		data: "",
		to: "",
		unit: "ether",
		value: '',
		nonce: null,
		gasPrice: null,
		donate: false
	}
	$scope.tokenTx = {
		to: '',
		value: 0,
		id: 'ether',
		gasLimit: 150000
	};
	$scope.localToken = {
		contractAdd: "",
		symbol: "",
		decimals: "",
		type: "custom",
	};
	$scope.$watch(function() {
		if (walletService.wallet == null) return null;
		return walletService.wallet.getAddressString();
	}, function() {
		if (walletService.wallet == null) return;
		$scope.wallet = walletService.wallet;
	});
	$scope.setTokens = function() {
		$scope.tokenObjs = [];
		for (var i = 0; i < $scope.tokens.length; i++) {
			$scope.tokenObjs.push(new Token($scope.tokens[i].address, '', $scope.tokens[i].symbol, $scope.tokens[i].decimal, $scope.tokens[i].type));
		}
		var storedTokens = localStorage.getItem("localTokens") != null ? JSON.parse(localStorage.getItem("localTokens")) : [];
		for (var i = 0; i < storedTokens.length; i++) {
			$scope.tokenObjs.push(new Token(storedTokens[i].contractAddress, '', globalFuncs.stripTags(storedTokens[i].symbol), storedTokens[i].decimal, storedTokens[i].type));
		}
	}
	$scope.setTokens();
	$scope.getWalletInfo = function() {
		if (ethFuncs.validateEtherAddress($scope.tx.from)) {
			ajaxReq.getTransactionData($scope.tx.from, false, function(data) {
				if (data.error) throw data.msg;
				data = data.data;
				$scope.gasPriceDec = ethFuncs.hexToDecimal(ethFuncs.sanitizeHex(ethFuncs.addTinyMoreToGas(data.gasprice)));
				$scope.nonceDec = ethFuncs.hexToDecimal(data.nonce);
				$scope.showWalletInfo = true;
			});
		}
	}
	$scope.$watch('tx', function() {
		$scope.showRaw = false;
		$scope.sendTxStatus = "";
	}, true);
    $scope.$watch('tokenTx.id', function() {
		if($scope.tokenTx.id!='ether'){
		  $scope.tx.gasLimit = 150000;
		} else {
		  $scope.tx.gasLimit = globalFuncs.defaultTxGasLimit;
		}
	});
	$scope.setSendMode = function(index) {
		$scope.tokenTx.id = index;
		if (index == 'ether') {
			$scope.unitReadable = 'ETH';
		} else {
			$scope.unitReadable = $scope.tokens[index].symbol;
		}
		$scope.dropdownAmount = false;
	}
	$scope.validateAddress = function(address, status) {
		if (ethFuncs.validateEtherAddress(address)) {
			$scope[status] = $sce.trustAsHtml(globalFuncs.getSuccessText(globalFuncs.successMsgs[0]));
		} else {
			$scope[status] = $sce.trustAsHtml(globalFuncs.getDangerText(globalFuncs.errorMsgs[5]));
		}
	}
	$scope.generateTx = function() {
		try {
			if (!$scope.Validator.isValidAddress($scope.tx.to)) throw globalFuncs.errorMsgs[5];
			else if (!$scope.Validator.isPositiveNumber($scope.tx.value)) throw globalFuncs.errorMsgs[7];
			else if (!$scope.Validator.isPositiveNumber($scope.gasPriceDec)) throw globalFuncs.errorMsgs[10];
			else if (!$scope.Validator.isPositiveNumber($scope.nonceDec)) throw globalFuncs.errorMsgs[11];
			else if (!$scope.Validator.isPositiveNumber($scope.tx.gasLimit)) throw globalFuncs.errorMsgs[8];
			else if (!$scope.Validator.isValidHex($scope.tx.data)) throw globalFuncs.errorMsgs[9];
			var rawTx = {
				nonce: ethFuncs.sanitizeHex(ethFuncs.decimalToHex($scope.nonceDec)),
				gasPrice: ethFuncs.sanitizeHex(ethFuncs.decimalToHex($scope.gasPriceDec)),
				gasLimit: ethFuncs.sanitizeHex(ethFuncs.decimalToHex($scope.tx.gasLimit)),
				to: ethFuncs.sanitizeHex($scope.tx.to),
				value: ethFuncs.sanitizeHex(ethFuncs.decimalToHex(etherUnits.toWei($scope.tx.value, $scope.tx.unit))),
				data: ethFuncs.sanitizeHex($scope.tx.data)
			}
      if($scope.tokenTx.id!='ether'){
          rawTx.data = $scope.tokenObjs[$scope.tokenTx.id].getData($scope.tx.to, $scope.tx.value).data;
          rawTx.to = $scope.tokenObjs[$scope.tokenTx.id].getContractAddress();
          rawTx.value = '0x00';
      }
      $scope.valueReadable = $scope.tx.value;
      //console.log(rawTx);
			var eTx = new ethUtil.Tx(rawTx);
			eTx.sign(new Buffer($scope.wallet.getPrivateKeyString(), 'hex'));
			$scope.rawTx = JSON.stringify(rawTx);
			$scope.signedTx = '0x' + eTx.serialize().toString('hex');
			$scope.validateTxStatus = $sce.trustAsHtml(globalFuncs.getDangerText(''));
		} catch (e) {
			$scope.showRaw = false;
			$scope.validateTxStatus = $sce.trustAsHtml(globalFuncs.getDangerText(e));
		}
	}
	$scope.confirmSendTx = function() {
		try {
			if ($scope.signedTx == "" || !ethFuncs.validateHexString($scope.signedTx)) throw globalFuncs.errorMsgs[12];
			var eTx = new ethUtil.Tx($scope.signedTx);
			new Modal(document.getElementById('sendTransactionOffline')).open();
		} catch (e) {
			$scope.offlineTxPublishStatus = $sce.trustAsHtml(globalFuncs.getDangerText(e));
		}
	}
	$scope.sendTx = function() {
		new Modal(document.getElementById('sendTransactionOffline')).close();
		ajaxReq.sendRawTx($scope.signedTx, false, function(data) {
			if (data.error) {
				$scope.offlineTxPublishStatus = $sce.trustAsHtml(globalFuncs.getDangerText(data.msg));
			} else {
			     $scope.offlineTxPublishStatus = $sce.trustAsHtml(globalFuncs.getSuccessText(globalFuncs.successMsgs[2] + "<a href='http://etherscan.io/tx/" + data.data + "' target='_blank'>" + data.data + "</a>"))
			}
		});
	}
};
module.exports = sendOfflineTxCtrl;
