/*
 * Copyright (c) 2016 qinyuhangxiaoxiang@gmail.com
 * Uber API belongs to Uber Technologies, Inc.
 *
 * This software is release under MIT license, you should see an license file
 * in the project folder.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict'
var request = require('request');
var Client = require('./Client.js');
var Errors = require('./Errors.js');
function UberAPI(clientSecret, clientId, serverToken, serverURI, runningFlag){
	if(!clientSecret) { throw "Client secret is empty!"; }
	if(!clientId) { throw "Client id is empty!"; }
	if(!serverToken) { throw "Server token is empty!"; }
	if(!serverURI) { throw "Server URI is empty!"; }
    this.runningFlag = runningFlag || "product";
	if(runningFlag == "debug") { console.log("running on DEBUG mode!"); }
	else if(runningFlag == "product") { console.log("running on PRODUCT mode!"); }
	this._clientSecret = clientSecret;
	this._clientId = clientId;
	this._serverToken = serverToken;
	this._serverURI = serverURI;
    this._responseCodeList = {
        STATUS_OK : 200,
        STATUS_UNAUTHORIZED : 401,
        STATUS_CONFLICT : 409,
        STATUS_UNPROCESSABLE_ENTITY : 422,
        STATUS_INTERNAL_SERVER_ERROR : 500,
        STATUS_SERVICE_UNAVAILABLE : 503
    }
	this._APIList = {
        uberSandBoxEndPoint : 'https://sandbox-api.uber.com/',
        uberAPIEndPoint : 'https://api.uber.com/',
		uberPOSTTokenURI : 'https://login.uber.com.cn/oauth/v2/token',
		uberGETUserInfoURL : 'https://api.uber.com.cn/v1/me',
		uberGETHistoryURI : 'https://api.uber.com.cn/v1.2/history',
		uberRevokURI : 'https://login.uber.com/oauth/revoke',
		uberCheckPhoneRegisterURI : 'https://get.uber.com.cn/validate_field/',
		uberMagicEnveloperPOSTURI : 'https://get.uber.com.cn/envelope_submit/',
		uberMagicEnveloperPOSTURICN : 'https://get.uber.com.cn/envelope_submit/?lang:zh_CN',
		uberMagicEnveloperBaseURI : 'https://get.uber.com.cn/envelope/',
		uberGetWebBaseURI : 'https://get.uber.com.cn/',
        uberApplyPromoURI : 'https://api.uber.com.cn/v1.2/me',//you need tu use PATCH method
	};
    this._UberAPIErrors = new Errors();
//    this._UberClient = new Client(clientSecret, clientId, serverToken, serverURI);
    return this;
}

UberAPI.prototype.getUserAccessToken = function (uberOauthCode, callbackFunction) {
    if (this.runningFlag == "debug") { console.log('UberAPI module has code' + uberOauthCode); }

    var options = {
        method: 'POST',
        uri: this.APIList.uberPOSTTokenURI,
        form: {
            client_secret: this.clientSecret,
            client_id: this.clientId,
            grant_type: 'authorization_code',
            redirect_uri: this.serverURI,
            code: uberOauthCode
        },
        headers: {
            //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
        }
    };

    request.post(options, function (error, response, body) {
        console.log('POST request sent');
        if (!error && response.statusCode == 200) {
            //            var info = JSON.parse(body);
            //            console.log(response);
            //console.log('UberAPI return to app.js ' + body);
            callbackFunction(body, true);
        } else if (response != 200) {
            console.log(error + ' get exchage access token error ');
            //stack here with {"error": "access_denied"}
            callbackFunction('', false);
        }
    });
}

UberAPI.prototype.getUserAccessTokenForPrize = function (uberOauthCode, callbackFunction) {
    if(this.runningFlag == "debug"){ console.log('UberAPI module has code' + uberOauthCode); }

    var options = {
        method: 'POST',
        uri: this.APIList.uberPOSTTokenURI,
        form: {
            client_secret: this.clientSecret,
            client_id: this.clientId,
            grant_type: 'authorization_code',
            redirect_uri: this.serverURI,
            code: uberOauthCode
        },
        headers: {
            //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
        }
    };

    request.post(options, function (error, response, body) {
        if(this.runningFlag == "debug") {console.log('POST request sent');}
        if (!error && response.statusCode == 200) {
            //            var info = JSON.parse(body);
            //            console.log(response);
            //console.log('UberAPI return to app.js ' + body);
            callbackFunction(body, true);
        } else if (response != 200) {
            console.log(error + ' get exchage access token error ');
            //stack here with {"error": "access_denied"}
            callbackFunction('', false);
        }
    });
}

UberAPI.prototype.getUserInfo = function (access_token, callbackFunction) {

    var requestOptions = {
        url: 'https://api.uber.com.cn/v1/me',
        headers: {
            'User-Agent': 'request',
            'Authorization': 'Bearer ' + access_token
        }
    };

    request(requestOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //            var info = JSON.parse(body);
            //            console.log(typeof (response));
            callbackFunction(body);
        }
    });
    //    console.log(returnInfo);
    //    return returnInfo;
}

UberAPI.prototype.getUserTrips = function (access_token, tripsNumber, callbackFunction) {
    //if tripsNumber is large then 50,make it a offset, judge it if larger then total trips;and set offset limits

    if (tripsNumber >= 50) {
        var pageCount = Math.floor(tripsNumber / 50);
        var enderCount = tripsNumber % 50;
        var dataArr = [];
        for(var i=0; i<pageCount; i++){
            var requestOptions = {
                url: uberGETHistoryURI + '?limit=50',
                headers: {
                    'User-Agent': 'request',
                    'Authorization': 'Bearer ' + access_token
                }
            };
            request(requestOptions, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //                var info = JSON.parse(body);
                    //                console.log(response);
                    dataArr.push(body);
                }
            });
        }
    } else {
        var requestOptions = {
            url: uberGETHistoryURI + '?limit=' + tripsNumber,
            headers: {
                'User-Agent': 'request',
                'Authorization': 'Bearer ' + access_token
            }
        };
        request(requestOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //                var info = JSON.parse(body);
                //                console.log(response);
                callbackFunction(body);
            }
        });
    }


    //return example
    //{
    //  "offset": 0,
    //  "limit": 1,
    //  "count": 5,
    //  "history": [
    //    {
    //     "status":"completed",
    //     "distance":1.64691465,
    //     "request_time":1428876188,
    //     "start_time":1428876374,
    //     "start_city":{
    //        "display_name":"San Francisco",    
    //        "latitude":37.7749295,
    //        "longitude":-122.4194155
    //     },
    //     "end_time":1428876927,
    //     "request_id":"37d57a99-2647-4114-9dd2-c43bccf4c30b",
    //     "product_id":"a1111c8c-c720-46c3-8534-2fcdd730040d"
    //  },
    //  ]
    //}
}

UberAPI.prototype.refreshUberToken = function (refresh_token, callbackFunction) {
    var options = {
        method: 'POST',
        uri: uberPOSTTokenURI,
        form: {
            client_secret: process.env.CLIENT_SECRET,
            client_id: process.env.CLIENT_ID,
            grant_type: 'refresh_token',
            redirect_uri: 'https://yourubertrip.leanapp.cn/',
            refresh_token: refresh_token
        },
        headers: {
            //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
        }
    };

    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //            var info = JSON.parse(body);
            //            console.log(response);
            callbackFunction(body);
        }
    });
}

UberAPI.prototype.revokeUberToken = function (acces_token, callbackFunction) {
    var options = {
        method: 'POST',
        uri: uberRevokURI,
        form: {
            client_secret: process.env.CLIENT_SECRET,
            client_id: process.env.CLIENT_ID,
            token: acces_token
        },
        headers: {
            //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
        }
    };

    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //            var info = JSON.parse(body);
            //            console.log(response);
            callbackFunction(body);
        }
    });
}

UberAPI.prototype.isAccessTokenExpired = function (access_token, expire_date, callBackFunction) {
    if (Math.round(Date.now()) >= expire_date) {
        callBackFunction(true);
    } else {
        callBackFunction(false);
    }
}

UberAPI.prototype.isRefreshTokenChanged = function (new_refresh_token, old_refresh_token, callBackFunction) {
    if (new_refresh_token == old_refresh_token) {
        callBackFunction(old_refresh_token, false);
    } else {
        callBackFunction(new_refresh_token, true);
    }
}

//
//
//var iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75';
//var UAs = [{
//    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13F69'
//}, {
//    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.2; zh-cn; SAMSUNG-SM-N9009 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/1.5 Chrome/28.0.1500.94 Mobile Safari/537.36'
//}, {
//    'User-Agent': 'Mozilla/5.0 (Linux; U; Android 6.0.1; zh-cn; MI 4LTE Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/46.0.2490.85 Mobile Safari/537.36 XiaoMi/MiuiBrowser/2.1.1'
//}]
//
//
//
//
//
//
//
//
//
//
//
////已经废弃
//exports.getCookieFromEnveloper = function (phoneNumber, promoCode, callbackFunction) {
//    var options = {
//        method: 'POST',
//        uri: uberCheckPhoneRegisterURI,
//        form: {
//            field: 'mobile',
//            mobile: phoneNumber,
//            mobile_country_iso2: 'CN'
//        },
//        headers: {
//            'User-Agent': UAs[Math.round(Math.random() * (UAs.length - 1))]["User-Agent"],
//            'Referer': uberMagicEnveloperBaseURI + promoCode + '/',
//            'Origin': uberGetWebBaseURI
//                //'Accept-Language': 'zh-Hans-CN'
//                //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
//        }
//    };
//
//    request.post(options, function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//            //            var info = JSON.parse(body);
//            //            console.log(response);
//            callbackFunction(response);
//        }
//    });
//}
//
//exports.isPhoneRegister = function (phoneNumber, promoCode, callbackFunction) {
//
//
//    var badCookie = 'ag_fid=Uquy6PkST6Nu240F; mp_e39a4ba8174726fb79f6a6c77b7a5247_mixpanel={"distinct_id": "15553404755216-057385f15177ce-373e0834-5217f-15553404756527","__mps": {},"__mpso": {},"__mpa": {},"__mpu": {},"__mpap": [],"Lead Page": "https://get.uber.com.cn/envelope/%E6%88%91%E7%88%B1%E6%8E%8C%E4%B8%8A%E9%9D%92%E5%B2%9B/","$initial_referrer": "$direct","$initial_referring_domain": "$direct"}; mp_mixpanel__c=0; mp_mixpanel__c3=0; mp_mixpanel__c4=0; mp_mixpanel__c5=0; utag_main=v_id:015553404490000eb2cf2d2e8a45000880058080004d0$_sn:1$_ss:1$_pn:1;exp-session$_st:1465982382723$ses_id:1465980568720;exp-session$segment:b';
//
//    var j = request.jar();
//    request.head({
//        url: 'https://get.uber.com.cn/envelope/supportCLE/',
//        jar: j
//    }, function () {
//
//        var sessionInfo = 'session=' + JSON.parse(JSON.stringify(j['_jar'])).cookies[0].value;
//        var goodCookie = sessionInfo + badCookie;
//        //console.log(sessionInfo);
//        var options = {
//            method: 'POST',
//            uri: uberCheckPhoneRegisterURI,
//            form: {
//                field: 'mobile',
//                mobile: phoneNumber,
//                mobile_country_iso2: 'CN'
//            },
//            headers: {
//                'User-Agent': UAs[Math.round(Math.random() * (UAs.length - 1))]["User-Agent"],
//                'Referer': uberMagicEnveloperBaseURI + encodeURI(promoCode) + '/',
//                'Origin': uberGetWebBaseURI,
//                'cookie': goodCookie
//                    //'Accept-Language': 'zh-Hans-CN'
//                    //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
//            }
//        };
//        request(options, function (error, res, body) {
//            callbackFunction(body);
//        })
//    })
//}
//
//exports.applyPromoMagicEnveloper = function(phoneNumber,promoCode,callbackFunction){
//     var options = {
//        method: 'POST',
//        uri: uberMagicEnveloperPOSTURICN,
//        form: {
//            mobile_country_iso2: 'CN',
//            mobile_country_code: '+86',
//            mobile: phoneNumber,
//            promo_code: promoCode,
//            token: METoken
//        }
//    };
//
//    request.post(options, function (error, response, body) {
//            callbackFunction(body);
//    });
//}
//
//exports.applyPromoNewUser = function (phoneNumber, promoCode, callbackFunction) {
//    var badCookie = 'ag_fid=Uquy6PkST6Nu240F; mp_e39a4ba8174726fb79f6a6c77b7a5247_mixpanel={"distinct_id": "15553404755216-057385f15177ce-373e0834-5217f-15553404756527","__mps": {},"__mpso": {},"__mpa": {},"__mpu": {},"__mpap": [],"Lead Page": "https://get.uber.com.cn/envelope/%E6%88%91%E7%88%B1%E6%8E%8C%E4%B8%8A%E9%9D%92%E5%B2%9B/","$initial_referrer": "$direct","$initial_referring_domain": "$direct"}; mp_mixpanel__c=0; mp_mixpanel__c3=0; mp_mixpanel__c4=0; mp_mixpanel__c5=0; utag_main=v_id:015553404490000eb2cf2d2e8a45000880058080004d0$_sn:1$_ss:1$_pn:1;exp-session$_st:1465982382723$ses_id:1465980568720;exp-session$segment:b';
//
//    var j = request.jar();
//    request.head({
//        url: 'https://get.uber.com.cn/envelope/supportCLE/',
//        jar: j
//    }, function () {
//
//        var sessionInfo = 'session=' + JSON.parse(JSON.stringify(j['_jar'])).cookies[0].value;
//        var goodCookie = sessionInfo + badCookie;
//        //console.log(sessionInfo);
//        var options = {
//            method: 'POST',
//            uri: uberMagicEnveloperPOSTURI,
//            form: {
//                mobile_country_iso2: 'CN',
//                mobile_country_code: '+86',
//                mobile: phoneNumber,
//                promo_code: promoCode,
//                is_new_client: true
//            },
//            headers: {
//                'User-Agent': UAs[Math.round(Math.random() * (UAs.length - 1))]["User-Agent"],
//                'Referer': uberMagicEnveloperBaseURI + encodeURI(promoCode) + '/',
//                'Origin': uberGetWebBaseURI,
//                'cookie': goodCookie
//                    //'Accept-Language': 'zh-Hans-CN'
//                    //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
//            }
//        };
//
//        request.post(options, function (error, response, body) {
//            //            var info = JSON.parse(body);
//            //        console.log(error);
//            //        console.log(response);
//            callbackFunction(body);
//        });
//    })
//}
//
//exports.applyPromoOldUser = function (phoneNumber, promoCode, callbackFunction) {
//    var options = {
//        method: 'POST',
//        uri: uberMagicEnveloperPOSTURI,
//        form: {
//            mobile_country_iso2: 'CN',
//            mobile_country_code: '+86',
//            mobile: phoneNumber,
//            promo_code: promoCode,
//            is_new_client: false
//        },
//        headers: {
//            'User-Agent': UAs[Math.round(Math.random() * (UAs.length - 1))]["User-Agent"],
//            'Referer': uberMagicEnveloperBaseURI + encodeURI(promoCode) + '/',
//            'Origin': uberGetWebBaseURI
//                //* 'content-type': 'application/x-www-form-urlencoded' */ // Set automatically
//        }
//    };
//
//    request.post(options, function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//            //            var info = JSON.parse(body);
//            //            console.log(response);
//            callbackFunction(body);
//        }
//    });
//}
//
//exports.applyPromo = function(phoneNumber, promoCode,callback) {
//    
//}

module.exports = UberAPI;