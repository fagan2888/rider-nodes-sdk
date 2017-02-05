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
var UberAPIErrors = function(){
    this.errorCodeDescriptionDict = {
        'distance_exceeded': 'Distance between two points exceeds 100 miles.',
        'unauthorized': 'Invalid OAuth 2.0 credentials provided.',
        'validation_failed': 'Invalid request.',
        'internal_server_error': 'Unexpected internal server error occurred.',
        'service_unavailable': 'Service temporarily unavailable.',
        'surge': 'Surge pricing is in effect.',
        'same_pickup_dropoff': 'Pickup and Dropoff can\'t be the same.'
    }
    return this;
}
UberAPIErrors.prototype.HTTPError = function(res){
    if (res.headers['content-type'] == 'application/json'){
        var body = JSON.parse(res.body);
        var status = res.statusCode;
    }
    throw this.errorCodeDescriptionDict.service_unavailable;
}
module.exports = UberAPIErrors;
