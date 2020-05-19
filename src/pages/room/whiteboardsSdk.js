var EMPTYFN = function(){}
var _createStandardXHR = function () {
    try {
        return new window.XMLHttpRequest();
    } catch (e) {
        return false;
    }
};

var _createActiveXHR = function () {
    try {
        return new window.ActiveXObject('Microsoft.XMLHTTP');
    } catch (e) {
        return false;
    }
};

var _xmlrequest = function (crossDomain) {
    crossDomain = crossDomain || true;
    var temp = _createStandardXHR() || _createActiveXHR();

    if ('withCredentials' in temp) {
        return temp;
    }
    if (!crossDomain) {
        return temp;
    }
    if (typeof window.XDomainRequest === 'undefined') {
        return temp;
    }
    var xhr = new XDomainRequest();
    xhr.readyState = 0;
    xhr.status = 100;
    xhr.onreadystatechange = EMPTYFN;
    xhr.onload = function () {
        xhr.readyState = 4;
        xhr.status = 200;

        var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = 'false';
        xmlDoc.loadXML(xhr.responseText);
        xhr.responseXML = xmlDoc;
        xhr.response = xhr.responseText;
        xhr.onreadystatechange();
    };
    xhr.ontimeout = xhr.onerror = function () {
        xhr.readyState = 4;
        xhr.status = 500;
        xhr.onreadystatechange();
    };
    return xhr;
};
var _parseJSON = function (data) {

    if (window.JSON && window.JSON.parse) {
        return window.JSON.parse(data + '');
    }

    var requireNonComma,
        depth = null,
        str = utils.trim(data + '');

    return str && !utils.trim(
        str.replace(/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g
            , function (token, comma, open, close) {

                if (requireNonComma && comma) {
                    depth = 0;
                }

                if (depth === 0) {
                    return token;
                }

                requireNonComma = open || comma;
                depth += !close - !open;
                return '';
            })
    )
        ? (Function('return ' + str))()
        : (Function('Invalid JSON: ' + data))();
}

var code = {
    102: {error_code: 102, error_msg: 'Server disconnect'},
    10: {error_code: 10, error_msg: "Whiteboards don't exist"},
    15: {error_code: 15, error_msg: "Wrong roomname or password"},
    20: {error_code: 20, error_msg: "Token authentication failed"},
    25: {error_code: 25, error_msg: "Whiteboard creation failed"},
    30: {error_code: 30, error_msg: "Whiteboard name can't be null"},
    35: {error_code: 35, error_msg: "Permission Denied"},
    40: {error_code: 40, error_msg: "Wrong roomname or password"},
    45: {error_code: 45, error_msg: "The whiteboard name has been used"},
    50: {error_code: 50, error_msg: "Wrong data, please login again"},
    99: {error_code: 99, error_msg: 'Unpredictable error'}
}
var _ajax = function (options) {
    var dataType = options.dataType || 'text';
    var suc = options.success || EMPTYFN;
    var error = options.error || EMPTYFN;
    var xhr = _xmlrequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var status = xhr.status || 0;
            if (status === 200) {
                try {
                    switch (dataType) {
                        case 'text':
                            suc(xhr.responseText);
                            break;
                        case 'json':
                            var json = _parseJSON(xhr.responseText);
                            if (json.status == false && json.error_code) {
                                return error(Object.assign({status: 0}, code[json.error_code]))
                            }
                            suc(json, xhr);
                            break;
                        case 'xml':
                            if (xhr.responseXML && xhr.responseXML.documentElement) {
                                suc(xhr.responseXML.documentElement, xhr);
                            } else {
                                error({
                                    // type: _code.WEBIM_CONNCTION_AJAX_ERROR,
                                    data: xhr.responseText
                                });
                            }
                            break;
                        default: 
                            suc(xhr.response || xhr.responseText, xhr);
                    }
                } catch (e) {
                    console.warn(e)
                    error(Object.assign({status: 0},code['99']));
                }
            } else {
                error({
                    data: xhr.responseText
                });
                return;
            }
        }
        if (xhr.readyState === 0) {
            error({
                data: xhr.responseText
            });
        }
    };

    if (options.responseType) {
        if (xhr.responseType) {
            xhr.responseType = options.responseType;
        }
    }
    if (options.mimeType) {
        if (utils.hasOverrideMimeType) {
            xhr.overrideMimeType(options.mimeType);
        }
    }

    var type = options.type || 'POST',
        data = options.data || null,
        tempData = '';

    if (type.toLowerCase() === 'get' && data) {
        for (var o in data) {
            if (data.hasOwnProperty(o)) {
                tempData += o + '=' + data[o] + '&';
            }
        }
        tempData = tempData ? tempData.slice(0, -1) : tempData;
        options.url += (options.url.indexOf('?') > 0 ? '&' : '?') + (tempData ? tempData + '&' : tempData) + '_v=' + new Date().getTime();
        data = null;
        tempData = null;
    }
    xhr.open(type, options.url, xhr.setRequestHeader);

    if (xhr.setRequestHeader) {
        var headers = options.headers || {};
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
    }
    // fix: ie8 status error
    window.XDomainRequest && (xhr.readyState = 2)
    xhr.send(data);
    return xhr;
}

var whiteBoards = function(options){
    if(options.restApi == 'http:' || options.restApi == 'https:'){
       options.restApi = '' 
    }
    this.restApi = options.restApi;
    this.appKey = options.appKey;
    this.orgName = options.appKey.split("#")[0];
    this.appName = options.appKey.split("#")[1];

    this.dnsArr = ['https://rs.easemob.com', 'http://182.92.174.78', 'http://112.126.66.111']; 
    this.dnsIndex = 0
    this.restIndex = 0
    this.restHosts = []
}

whiteBoards.prototype.getRestFromHttpDNS = function (options) {
    if (this.restIndex >= this.restHosts.length) {
        return false;
    }

    var url = '';
    var host = this.restHosts[this.restIndex];
    var domain = host.domain;
    var ip = host.ip;
    if (ip) {
        var port = host.port;
        url = (location.protocol === 'https:' ? 'https:' : 'http:') + '//' + ip + ':' + port;
    } else {
        url = (location.protocol === 'https:' ? 'https:' : 'http:') + '//' + domain;
    }

    if (url != '') {
        this.apiUrl = url;
    }
    return url
};

whiteBoards.prototype.getHttpDNS = function (options) {
    var self = this;
    if(!this.appKey) {
        console.warn('appKey illegal')
        return
    }
    var suc = function (data, xhr) {
        var restHosts = data.rest.hosts;
        if (!restHosts) {
            return;
        }
        var httpType = location.protocol;

        for(var i = 0; i< restHosts.length; i++){
            if( restHosts[i].protocol === httpType ){
                var currentPost = restHosts[i];
                restHosts.splice(i,1);
                restHosts.unshift(currentPost);
            }
        }
        self.restHosts = restHosts;
        options.suc({restHosts: restHosts})

    };
    var error = function (res, xhr, msg) {
        self.dnsIndex++;
        if (self.dnsIndex < self.dnsArr.length) {
            return self.getHttpDNS.call(self, options);
        }
        options.error(res)
    };

    var options2 = {
        url: this.dnsArr[this.dnsIndex] + '/easemob/server.json',
        dataType: 'json',
        type: 'GET',
        data: {app_key: encodeURIComponent(this.appKey)},
        success: suc,
        error: error
    };
    _ajax(options2);
};


//options.userName   - 用户名
//options.roomName   - 房间名
//options.password -房间密码
//options.token   - im的token
//options.suc - 成功的回调
//options.error - 失败的回调
whiteBoards.prototype.create = function(options){
    if (!this.restApi) {
        var me = this
        var sucFun = function(res){
            me.restApi = me.getRestFromHttpDNS()
            _create.call(me)
        }

        var errFun = function(err){
            me.restIndex ++;
            if(me.getRestFromHttpDNS()){
                return sucFun()
            }
            options.error(err)
        }

        this.getHttpDNS({suc: sucFun, error: errFun})
    }else{
        _create.call(this)
    }

    function _create(){
        var opts = {
            url: this.restApi + '/' + this.orgName + '/' + this.appName + '/whiteboards/',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify({
                userId: options.userName,
                whiteBoardName: options.roomName,
                password: options.password
            }),
            headers: {
                'Authorization': 'Bearer ' + options.token,
                'Content-Type': 'application/json'
            },
            success: options.suc,
            error: errFun
        }

        _ajax(opts);
    }
	
}

/**
 * 加入房间 有房间加入，没有房间创建
 * options.userName   - 用户名
 * options.roomName   - 加入房间名
 * options.password -房间密码
 * options.token   - im的token
 * options.suc - 成功的回调
 * options.error - 失败的回调
*/
whiteBoards.prototype.join = function(options){
    if (!this.restApi) {
        var me = this
        var sucFun = function(res){
            me.restApi = me.getRestFromHttpDNS()
            _join.call(me)
        }

        var errFun = function(err){
            me.restIndex ++;
            if(me.getRestFromHttpDNS()){
                return sucFun()
            }
            options.error(err)
        }

        this.getHttpDNS({suc: sucFun, error: errFun})
    }else{
        _join.call(this)
    }

    function _join(){
        var opts = {
            url: this.restApi + '/' + this.orgName + '/' + this.appName + '/whiteboards/joinorcreate/byname/',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify({
                userId: options.userName,
                whiteBoardName: options.roomName,
                password: options.password
            }),
            headers: {
                'Authorization': 'Bearer ' + options.token,
                'Content-Type': 'application/json'
            },
            success: options.suc,
            error: errFun
        }

        _ajax(opts);
    }
}


//options.userName   - 用户名
//options.roomName   - 加入房间名
//options.password -房间密码
//options.token   - im的token
//options.suc - 成功的回调
//options.error - 失败的回调
whiteBoards.prototype.joinByRoomName= function(options){
    if (!this.restApi) {
        var me = this
        var sucFun = function(res){
            me.restApi = me.getRestFromHttpDNS()
            _joinByRoomName.call(me)
        }

        var errFun = function(err){
            me.restIndex ++;
            if(me.getRestFromHttpDNS()){
                return sucFun()
            }
            options.error(err)
        }

        this.getHttpDNS({suc: sucFun, error: errFun})
    }else{
        _joinByRoomName.call(this)
    }

    function _joinByRoomName(){
        var opts = {
            url: this.restApi + '/' + this.orgName + '/' + this.appName + '/whiteboards/url-by-name/',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify({
                userId: options.userName,
                whiteBoardName: options.roomName,
                password: options.password
            }),
            headers: {
                'Authorization': 'Bearer ' + options.token,
                'Content-Type': 'application/json'
            },
            success: options.suc,
            error: errFun
        }

        _ajax(opts);
    }
}

//options.userName   - 用户名
//options.roomId   - 加入房间id
//options.password -房间密码
//options.token   - im的token
//options.suc - 成功的回调
//options.error - 失败的回调
whiteBoards.prototype.joinByRoomId= function(options){
    if (!this.restApi) {
        var me = this
        var sucFun = function(res){
            me.restApi = me.getRestFromHttpDNS()
            _joinByRoomId.call(me)
        }

        var errFun = function(err){
            me.restIndex ++;
            if(me.getRestFromHttpDNS()){
                return sucFun()
            }
            options.error(err)
        }

        this.getHttpDNS({suc: sucFun, error: errFun})
    }else{
        _joinByRoomId.call(this)
    }

    function _joinByRoomId(){
        var opts = {
            url: this.restApi + '/' + this.orgName + '/' + this.appName + '/whiteboards/' + options.roomId + '/url/',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify({
                userId: options.userName,
                roomId: options.roomId,
                password: options.password
            }),
            headers: {
                'Authorization': 'Bearer ' + options.token,
                'Content-Type': 'application/json'
            },
            success: options.suc,
            error: errFun
        }

        _ajax(opts);
    }
}

//options.roomId   - 删除房间ID
//options.token   - im的token
//options.userName - 用户名
//options.suc - 成功的回调
//options.error - 失败的回调
whiteBoards.prototype.destroy= function(options){
    if (!this.restApi) {
        var me = this
        var sucFun = function(res){
            me.restApi = me.getRestFromHttpDNS()
            _destroy.call(me)
        }

        var errFun = function(err){
            me.restIndex ++;
            if(me.getRestFromHttpDNS()){
                return sucFun()
            }
            options.error(err)
        }

        this.getHttpDNS({suc: sucFun, error: errFun})
    }else{
        _joinByRoomId.call(this)
    }

    function _destroy(){
        var opts = {
            url: this.restApi + '/' + this.orgName + '/' + this.appName + '/whiteboards/' + options.roomId + '/',
            dataType: 'json',
            type: 'DELETE',
            data: JSON.stringify({
                userId: options.userName
            }),
            headers: {
                'Authorization': 'Bearer ' + options.token,
                'Content-Type': 'application/json'
            },
            success: options.suc,
            error: errFun
        }

        _ajax(opts); 
    }
}


module.exports = whiteBoards;




