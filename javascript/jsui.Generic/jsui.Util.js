//namespace root;
var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Util = jsui.Util || {};

    jsui.Util.htmlEncode = function (value) {
        //create a in-memory div, set it's inner text(which jQuery automatically encodes)
        //then grab the encoded contents back out.  The div never exists on the page.
        return $('<div/>').text(value).html();
    };

    jsui.Util.htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };

    jsui.Util.handleJsonError = function (e) {
        if (e && e.responseJSON) {
            var ex = e.responseJSON;
            var msg = ex.Message;

            while (ex.InnerException) {
                ex = ex.InnerException;
                msg += '\n' + ex.Message;
            }
            alert(msg);
        } else if (e.responseText) {
            alert('Onbekende fout\n' + (e.responseText || JSON.stringify(e)));
        } else if (e.getAllResponseHeaders && e.getAllResponseHeaders()) {
            //check if there are responseheaders. If not, user aborted and we show no error
            alert('Onbekende fout connectiefout');
        } else {
            console.log(JSON.stringify(e));
            //hier kan het alles zijn.
            //als het uberhaupt een ajax fout is, is het een aborted connection en willen we niets zien
        }
    };

    jsui.Util.sortBy = function (field, reverse, primer) {
        var key = primer ?
            function (x) { return primer(x[field]); } :
            function (x) { return x[field]; };

        reverse = !reverse ? 1 : -1;

        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        };
    };

    jsui.Util.getSearchParams = function (name, search) {
        if (!search)
            search = window.location.search;

        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(search);

        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    jsui.Util.specialKeys = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27,

        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,

        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        DELETE: 46,

        NUMPAD_MULTIPLY: 106,
        NUMPAD_ADD: 107,
        NUMPAD_ENTER: 108,
        NUMPAD_SUBTRACT: 109,
        NUMPAD_DECIMAL: 110,
        NUMPAD_DIVIDE: 111,

        COMMA: 188,
        PERIOD: 190,
    };

    jsui.Util.capitalizeFirstChar = function (val) {
        /// <summary>Capitalizes the first char of a string</summary>
        /// <param name="val" type="String">The string to change the first char of</param>
        /// <returns type="String">String with first char capitalized</returns>
        if (!val)
            return val;

        var lower = val.toLowerCase();
        var result = lower.charAt(0).toUpperCase() + lower.slice(1);

        return result;
    };

    jsui.Util.makeNice = function (val) {
        if (!val)
            return '';

        var result = val.replace(/[a-zA-Z\u00C0-\u017F_]+/g, function replacer(m, offset, string) {
            var res;

            if (m.length > 1 && m.substr(0, 2).toLowerCase() == "ij")
                res = m.substr(0, 2).toUpperCase() + m.substr(2).toLowerCase();
            else
                res = m.substr(0, 1).toUpperCase() + m.substr(1).toLowerCase();

            if (res == "De")
                return "de";
            if (res == "Den")
                return "den";
            if (res == "Der")
                return "der";
            if (res == "Van")
                return "van";
            if (res == "Aan")
                return "aan";
            if (res == "Op")
                return "op";
            if (res == "Ter")
                return "ter";
            if (res == "En")
                return "en";

            if (res == "Ii")
                return "II";
            if (res == "Iii")
                return "III";
            if (res == "Iv")
                return "IV";
            //Frans
            if (res == "Du")
                return "du";
            if (res == "Des")
                return "des";
            if (res == "La")
                return "la";

            return res;
        });

        result = result.substr(0, 1).toUpperCase() + result.substr(1);

        result = result.replace("'S", "'s");
        result = result.replace("'T", "'t");

        //Frans
        result = result.replace("D'", "d'");
        result = result.replace("L'", "l'");

        return result;
    };

    jsui.Util.makeNiceDt = function (val) {
        var sval = val.toString();
        if (sval.length === 8)
            return sval.substr(6, 2) + '-' + sval.substr(4, 2) + '-' + sval.substr(0, 4);
        else if (val === -1)
            return '?';
        else
            return val;
    };

    jsui.Util.dateToDateText = function (dateString, withPadding) {
        var date,
            result;

        if (!dateString)
            return '';

        date = new Date(dateString);
        result = (withPadding ? ('0' + date.getDate()).slice(-2) : date.getDate()) + "-" +
                 (withPadding ? ('0' + (date.getMonth() + 1)).slice(-2) : date.getMonth() + 1) + "-" +
                 date.getFullYear();
        //ie8
        if (result.includes("NaN")) {
            result = dateString.substring(8, 10) + '-' + dateString.substring(5, 7) + '-' + dateString.substring(0, 4);
        }
        return result;
    };

    jsui.Util.dateToDateTimeText = function (dateString, withPadding) {
        var date,
            result;

        if (!dateString)
            return '';

        date = new Date(dateString);
        result = (withPadding ? ('0' + date.getDate()).slice(-2) : date.getDate()) + "-" +
                 (withPadding ? ('0' + (date.getMonth() + 1)).slice(-2) : date.getMonth() + 1) + "-" +
                 date.getFullYear() + " " +
                 (withPadding ? ('0' + date.getHours()).slice(-2) : date.getHours()) + ":" +
                 ('0' + date.getMinutes()).slice(-2);
        //ie
        if (result.includes("NaN")) {
            result = dateString.substring(8, 10) + '-' + dateString.substring(5, 7) + '-' + dateString.substring(0, 4) + ' ' + dateString.substring(11, 16);
        }
        return result;
    };

    /**
    * dateValueNow - returns the ISO variant van de tijd gecorrigeerd op TimeZone
    * @param {boolean} withSeconds - met of zonder seconden
    * @returns date time in ISO format corrected by TimeZone
    */
    jsui.Util.dateValueNow = function (withSeconds) {
        var d = new Date();
        d.setHours(d.getHours() + (-d.getTimezoneOffset() / 60)); //TimeZone correctie

        var ret = withSeconds ? d.toISOString().slice(0, -5) : d.toISOString().slice(0, -8);
        ret = ret.replace('T', '');
        console.log('ret: '+ ret);
        return ret;
    };

}(jQuery));