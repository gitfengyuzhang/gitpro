/*!
 * ======================================================
 * API For XinjiangApp
 * ======================================================
 */

/*打开指定窗口*/
function openWindow(url, id, data, preload) {
	mui.openWindow({
		url: url,
		id: id,
		preload: (preload? true : false),
		extras: data,
		show: {
			aniShow: 'pop-in',
			duration: 200
		},
		styles: {
			popGesture: 'hide'
		},
		waiting: {
			autoShow: false
		}
	});
}

/*验证手机号码*/
function isPhoneNumber(number) {
	var re = /^1[34578]\d{9}$/;
	return re.test(number);
}

/*验证车牌号*/
function isVehicleNumber(number) {
	var creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
	var xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
	if(number.length == 7) { // 普通车
		return creg.test(number);
	} else if(number.length == 8) { // 新能源车
		return xreg.test(number);
	} else {
		return false;
	}
}

/* API 接口
 *
 * 正式服：
 * 测试服：
 */
var BASE_URL = "http://192.168.1.199:8011/repair";

var API_VERIFICATION = "API_VERIFICATION";
var API_REGISTER = "API_REGISTER";
var API_LOGIN = "API_LOGIN";
var API_FORGET_PSW = "API_FORGET_PSW";
var API_CHANGE_PSW = "API_CHANGE_PSW";

URL[API_VERIFICATION] = "/sendVerificationCode";
URL[API_REGISTER] = "/register";
URL[API_LOGIN] = "/login";
URL[API_FORGET_PSW] = "/forgetPassword";
URL[API_CHANGE_PSW] = "/changePassword";

/*发送短信验证码*/
var apiSendVerification = function(mobileNumber, type, callback) {
	var data = {
		mobileNumber: mobileNumber,
		type: type.toString()
	};
	api_basePost(API_VERIFICATION, data, callback);
};

/*注册*/
var apiRegister = function(mobileNumber, carNo, verificationCode, password, callback) {
	var data = {
		mobileNumber: mobileNumber,
		carNo: carNo,
		verificationCode: verificationCode,
		password: password
	};
	api_basePost(API_REGISTER, data, callback);
};

/*登录*/
var apiLogin = function(mobileNumber, password, callback) {
	var data = {
		mobileNumber: mobileNumber,
		password: password
	};
	api_basePost(API_LOGIN, data, callback, true);
};

/*忘记密码*/
var apiForgetPassword = function(mobileNumber, verificationCode, password, callback) {
	var data = {
		mobileNumber: mobileNumber,
		verificationCode: verificationCode,
		password: password
	};
	api_basePost(API_FORGET_PSW, data, callback);
};

/*修改密码*/
var apiChangePassword = function(mobileNumber, oldPassword, newPassword, callback) {
	var data = {
		mobileNumber: mobileNumber,
		oldPassword: oldPassword,
		newPassword: newPassword
	};
	api_basePost(API_CHANGE_PSW, data, callback);
};

/*基础POST请求*/
var api_basePost = function(apiId, data, callback, length) {
	if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
		callback(false, '网络错误');
		return;
	}
	
	// 公共参数
	var commonData = {
		tokenId: getTokenId() || ''
	};
	
	// 最后参数
	var newData = {};

	for(var attr in commonData) {
		if((commonData[attr] || '').length > 0) {
			newData[attr] = commonData[attr];
		}
	}

	for(var attr1 in data) {
		if((data[attr1] || '').length > 0) {
			newData[attr1] = data[attr1];
		}
	}
	
	var url = HOST_NAME + URL[apiId];
	mui.ajax(url, {
		data: newData,
		dataType: 'json',
		type: 'POST',
		timeout: 10000,
		success: function(data, textStatus, xhr) { // data本身就是JSON对象
//			console.log(JSON.stringify(data));
			if(data.resultCode == '0') {
				if((data.resultData || '').length == 0) { // 注意：resultData是JSON数组格式！
					callback(true, data.resultMessage);
				} else {
					if(length) { // 某些接口仅需获取JSON数组的第一个元素
						callback(true, data.resultData[0]);
					} else {
						callback(true, data.resultData);
					}
				}
			} else {
				callback(false, data.resultMessage);
			}
		},
		error: function(xhr, type, errorThrown) {
			callback(false, "请求失败[" + type + "]");
		}
	});
};

/*POST请求+文件上传*/
var api_multiPost = function(apiId, data, files, callback) {
	if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
		callback(false, '网络错误');
		return;
	}
	
	// 公共参数
	var commonData = {
		tokenId: getTokenId() || ''
	};
	
	// 最后参数
	var newData = {};

	for(var attr in commonData) {
		if((commonData[attr] || '').length > 0) {
			newData[attr] = commonData[attr];
		}
	}

	for(var attr1 in data) {
		if((data[attr1] || '').length > 0) {
			newData[attr1] = data[attr1];
		}
	}
	
	var url = HOST_NAME + URL[apiId];
	var task = plus.uploader.createUpload(url, {
		method: "POST"
	}, function(upload, status) {
		closeWaiting();
		if(status == 200) { 
			var data = JSON.parse(upload.responseText);
			if (data.resultCode == '0') {
				callback(true, data.resultMessage);
			} else {
				callback(false, data.resultMessage);
			}
		} else {
			callback(false, "上传失败[" + status + "]");
		}
	});
	// 添加上传数据
	mui.each(newData, function(index, element) {
		task.addData(index, element);
	});
	// 添加上传文件
	mui.each(files, function(index, element) {
		if(element.name == "images") {
			task.addFile(element.path, { key: element.name + (index + 1) }); // 注：此处key应当是API文档规定的参数名，但5+API不支持上传任务中存在key相同的文件或数据，导致传到后台的图片始终只有一张
		} else {
			task.addFile(element.path, { key: element.name });
		}
	});
	// 开始上传任务
	task.start();
	showWaiting("正在上传");
};

/*加载框*/
function showWaiting(title) {
	plus.nativeUI.showWaiting(title);
}

function closeWaiting() {
	plus.nativeUI.closeWaiting();
}