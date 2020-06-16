var jsui = window.jsui || {};
var _onloadfuncs = [];

//var hieronder houdt bij welke requests er lopen, en cancelt oude requests als er een nieuwe is naar dezelfde url
var _requests = [];

var Globals = {
    maxRowsPerPage: function () {
        var cookie = getCookie("maxRowsPerPage");
        return parseInt(cookie, 10) || 20;
    },

    _uniqueNumber : 1,
    uniqueNumber: function () {
        this._uniqueNumber = this._uniqueNumber + 1;
        return this._uniqueNumber;
    }
}

var _monitorTimer;

window.onload = function () {
    for (var i = 0; i < _onloadfuncs.length; i++) {
        var func = _onloadfuncs[i];
        func.call(this);
    }
};

function doRequest(uri, callback, postvars) {
    var url = uri.split('?')[0];
    if (url.includes('Search')) {
        for (var i = 0; i < _requests.length; i++) {
            if (url === _requests[i].url) {
                _requests[i].xhr.abort();

                _requests.splice(i, 1);
                break;
            }
        }
    }

    var xhr = $.ajax({
        type: (postvars ? "POST" : "GET"),
        cache: false,
        url: uri,
        data: postvars,
        success: function (response) {
            callback.call(this, response);
            for (var i = 0; i < _requests.length; i++) {
                if (this.url.split('?')[0] === _requests[i].url) {
                    _requests.splice(i, 1);
                    break;
                }
            }
        }
    });
    _requests[_requests.length] = { xhr: xhr, url: url };

    return xhr;
}

function toggleVisible(id) {
    var node = document.getElementById(id);
    if (node.style.display !== 'block') {
        node.style.display = 'block';
    } else {
        node.style.display = 'none';
    }
}

function togglePanel(showhidebutton) {
    var panel = showhidebutton.parentNode;
    if (panel.className === "GUIpanel") {
        panel.className += " GUIpanelCollapsed";
    } else {
        panel.className = panel.className.replace(" GUIpanelCollapsed", "");
    }
}

function CreatePopup(width, height, title) {
    var blanket = document.createElement('div');
    blanket.popup = document.createElement('div');

    blanket.id = 'blanket';
    blanket.popup.className = 'popup';
    if (width) {
        blanket.popup.style.marginLeft = (width / 2 * -1) + 'px';
        blanket.popup.style.width = width + 'px';
    }
    if (height) {
        blanket.popup.style.marginTop = (height / 2 * -1) + 'px';
        blanket.popup.style.height = height + 'px';
    }

    if (title) {
        var titleBar = document.createElement('div');
        titleBar.className = 'titleBar';
        if (width) {
            titleBar.style.width = (width - 5) + 'px';
        }
        titleBar.innerHTML = title;

        blanket.popup.appendChild(titleBar);
    }

    blanket.popup.close = function () {
        document.getElementById('closeIcon').onclick = null;

        var blanket = document.getElementById('blanket');
        if (blanket.popup.beforeclose) {
            blanket.popup.beforeclose.call();
        }
        document.body.removeChild(blanket.popup);
        blanket.popup = null;
        document.body.removeChild(blanket);
        blanket = null;
    };

    var closeIcon = document.createElement('div');
    closeIcon.id = 'closeIcon';
    closeIcon.title = 'Sluit venster';
    closeIcon.className = 'closeIcon';
    closeIcon.onclick = blanket.popup.close;

    blanket.popup.appendChild(closeIcon);

    document.body.appendChild(blanket);
    document.body.appendChild(blanket.popup);

    return blanket.popup;
}

jsui.setNotice = function (response, withOkMessages) {
    //mogelijke stati:
    //resultOk
    //resultWarning
    //resultError

    var div, now, message;

    if (response.status) {
        if ((withOkMessages || response.status === 'resultWarning' || response.status === 'resultError') && response.message) {

            now = new Date();
            message = '[' + now.getHours() + ':' +
                        now.getMinutes().padLeft(2, '0') + ':' +
                        now.getSeconds().padLeft(2, '0') + '] ' + response.message;

            if (response.status === 'resultError') {
                alert(message);
            } else {
                div = $('<div class="' + response.status + '"style="display:none;">' + message + '</div>');
                $("#messageDiv").append(div);
                div.show(200);

                setTimeout(function () {
                    div.hide(200, function () {
                        $(this).remove();
                    });
                }, 10000);
            }
        }

        return (response.status !== 'resultError');
    }

    return false;
};

var requestParms = (function () {
    var urlParts = location.href.split("?");
    var urlParms = (urlParts && urlParts.length == 2) ? urlParts[1].split("&") : [];
    var urlKeyVal = [];
    var parms = {};
    for (var i = 0; i < urlParms.length; i++) {
        urlKeyVal = urlParms[i].split('=');
        if (urlKeyVal.length == 2) {
            parms[urlKeyVal[0]] = urlKeyVal[1];
        }
    }
    return parms;
}());

function setCookie(name, value) { //set cookie value
    var expireDate = new Date();
    //set "expstring" to either future or past date, to set or delete cookie, respectively
    var expstring = expireDate.setDate(expireDate.getDate() + 30);
    document.cookie = name + "=" + value + "; expires=" + expireDate.toGMTString() + "; path=/";
}

function getCookie(name) {
    var re = new RegExp(name + "=[^;]+", "i"); //construct RE to search for target name/value pair
    if (document.cookie.match(re)) //if cookie found
    {
        return document.cookie.match(re)[0].split("=")[1];  //return its value
    }
    return "";
}
