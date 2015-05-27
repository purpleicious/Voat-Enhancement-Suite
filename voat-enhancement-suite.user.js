// ==UserScript==
// @name        Voat Enhancement Suite
// @version     0.0.4
// @description Suite of tools to enhance Voat's functionalities
// @author      travis
// @include     http://voat.co/*
// @include     https://voat.co/*
// @include     http://*.voat.co/*
// @include     https://*.voat.co/*
// @exclude
// @match
// @grant       none
// @require
// @noframes
// @downloadURL https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.user.js
// @updateURL   https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.user.js
// @icon
// ==/UserScript==

// make sure we can still use regular jQuery, 
// since we'll be using our own
var $j = jQuery.noConflict();

var info = {
    v: '0.1.0',
    namespace: 'VES.',
    name: 'Voat Enhancement Suite',
    abbr: 'VES'
};

var Config = {
    main: {
        'Modules': {
            'Debugging Tools': [true, 'Diagnostic tools for VES. Useful for submitting issues to GitHub!'],
            'Hide Child Comments': [true, 'Allows you to hide all child comments for easier reading.'],
            'Single Click': [true, 'Adds an [l+c] link that opens both the link and the comments page in new tabs.'],
            'Search Helper': [true, 'Makes searching through Voat a bit easier.'],
            'filterVoat': [false, 'Filter out links by keyword, domain (use User Tagger to ignore by user) or subverse (for /v/all).'],
            'Voating Never Ends': [false, 'Load the next pages of Voat automatically.'],
            'User Tags': [true, 'Tag Voat users in posts and comments.'],
        },
        'hideChildComments': {
            'Auto Hide Child Comments': [true, 'Automatically hide all child comments on page load.'],
        },
        'userTags': {
            'Hard Ignore': [false, 'When on, the ignored user\'s entire post is hidden, not just the title.'],
            'Dim Ignored Content': [false, 'Reduce the opacity of ignored user\'s content.'],
        }
    },
};


// GreaseMonkey API compatibility for non-GM browsers (Chrome, Safari, Firefox)
// @copyright      2009, 2010 James Campos
// @modified        2010 Steve Sobel - added some missing gm_* functions
// @license        cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
if ((typeof GM_deleteValue == 'undefined') || (typeof GM_addStyle == 'undefined')) {
    GM_addStyle = function(css) {
        var style = document.createElement('style');
        style.textContent = css;
        var head = document.getElementsByTagName('head')[0];
        if (head) {
            head.appendChild(style);
        }
    };

    GM_deleteValue = function(name) {
        localStorage.removeItem(name);
    };

    GM_getValue = function(name, defaultValue) {
        var value = localStorage.getItem(name);
        if (!value)
            return defaultValue;
        var type = value[0];
        value = value.substring(1);
        switch (type) {
            case 'b':
                return value == 'true';
            case 'n':
                return Number(value);
            default:
                return value;
        }
    };

    GM_log = function(message) {
        console.log(message);
    };

    GM_setValue = function(name, value) {
        value = (typeof value)[0] + value;
        localStorage.setItem(name, value);
    };

    GM_openInTab = function(url) {
        window.open(url);
    };
    // GM_xmlhttpRequest
}


// shortening
var doc = document,
    cli = console;

// function shorteners
var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

// make some sorta-jQuery functions, http://api.jquery.com/
var $, $$;
// {{{ 
    // querySelector
    $ = function(selector, root) {
        if (root === null) {
            root = doc.body;
        }
        return root.querySelector(selector);
    };
    // querySelectorAll
    $$ = function(selector, root) {
        if (root === null) {
            root = doc.body;
        }
        return __slice.call(root.querySelectorAll(selector));
    };

    $.extend = function(obj, prop) {
        for (var key in prop) {
            var value = prop[key];
            if (prop.hasOwnProperty(key)) {
                obj[key] = value;
            }
        }
    };

    $.id = function(id) {
        return doc.getElementById(id);
    };

    $.ready = function(func) {
        if (doc.readyState !== 'loading') {
            $.queueTask(func);
            return;
        }
        var callback = function() {
            $.off(doc, 'DOMContentLoaded', callback);
            return func();
        };
        return $.on(doc, 'DOMContentLoaded', callback);
    };

    $.extend = function(obj, props) {
        for (var key in props) {
            val = props[key];
            obj[key] = val;
        }
    };

    $.asap = function(test, callback) {
        if (test()) {   // as soon as test is doable
            return callback();  // perform the callback op
        } else {
            // if you can't do test, wait and try again
            return setTimeout($.asap, 25, test, callback);
        }
    };

    $.addStyle = function(css, id) {
        var style = $.el('style', {
            id: id,
            textContent: css
        });
        $.asap((function() {
            return doc.head;
        }), function() {
            return $.add(doc.head, style);
        });
        return style;
    };

    $.addClass = function(/*element, class1, class2...*/) {
        var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (var i = 0, len = classnames.length; i < len; i++) {
            var classname = classnames[i];
            el.classList.add(classname);
        }
    };

    $.rmClass = function(/*element, class1, class2...*/) {
        var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (var i = 0, len = classnames.length; i < len; i++) {
            var classname = classnames[i];
            el.classList.remove(classname);
        }
    };

    $.toggleClass = function(el, classname) {
        return el.classList.toggle(classname);
    };

    $.hasClass = function(el, classname) {
        return __indexOf.call(el.classList, classname) >= 0;
    };

    $.rm = function(el) {
        return el.remove();
    };

    $.rmAll = function(root) {
        root.textContent = null;
        return root.textContent;
    };

    $.fragment = function() {
        return doc.createDocumentFragment();
    };
    $.nodes = function(nodes) {
        // if just one node return it
        if (!(nodes instanceof Array)) {
            return nodes;
        }
        // if theres a bunch, create a new section of document
        var frag = $.fragment();
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            frag.appendChild(node);
        }
        return frag;
    };
    $.add = function(parent, el) {
        return parent.appendChild($.nodes(el));
    };
    $.prepend = function(parent, el) {
        return parent.insertBefore($.nodes(el), parent.firstChild);
    };
    $.after = function(root, el) {
        return root.parentNode.insertBefore($.nodes(el), root.nextSibiling);
    };
    $.before = function(root, el) {
        return root.parentNode.insertBefore($.nodes(el), root);
    };
    $.el = function(tag, props) {
        var el;
        el = doc.createElement(tag);
        if (props) {
            $.extend(el, props);
        }
        return el;
    };

    $.on = function(el, events, handler) {
        var ref = events.split(' ');
        for (var i = 0, len = ref.length; i < len; i++) {
            var event = ref[i];
            el.addEventListener(event, handler, false);
        }
    };
    // $.off
    // $.one
    // $.event

    $.open = GM_openInTab;

    $.debounce = function(wait, func) {
        var args = null;
        var lastCall = 0;
        var timeout = null;
        var that = null;
        var exec = function() {
            lastCall = Date.now();
            return func.apply(this, args);
        };
        return function() {
            args = arguments;
            that = this;
            if (lastCall < Date.now() - wait) {
                return exec();
            }
            clearTimeout(timeout);
            return timeout = setTimeout(exec, wait);
        };
    };

    $.taskQueue = (function() {
        var queue = [];
        var execTask = function() {
            var args, func, task;
            task = queue.shift();
            func = task[0];
            args = Array.prototype.slice.call(task, 1);
            return func.apply(func, args);
        };
        if (window.MessageChannel) {
            var taskChannel = new MessageChannel();
            taskChannel.port1.onmessage = execTask;
            return function() {
                queue.push(arguments);
                return taskChannel.port2.postMessage(null);
            };
        } else {
            return function() {
                queue.push(arguments);
                return setTimeout(execTask, 0);
            };
        }
    })();

    $.item = function(key, val) {
        var item = {};
        item[key] = val;
        return item;
    };

    $.syncing = {}; // sync queue

    $.oldValue = {};

    $.sync = function(key, callback) {
        key = info.namespace + key;
        $.syncing[key] = callback;
        return $.oldValue[key] = localStorage.getItem(key);
    };

    // onChange

    $.desync = function(key) {
        return delete $.syncing[info.namespace + key];
    };

    $["delete"] = function(keys) {
        var key, _i, _len;
        if (!(keys instanceof Array)) {
            keys = [keys];
        }
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
            key = keys[_i];
            key = info.namespace + key;
            localStorage.removeItem(key);
            GM_deleteValue(key);
        }
    };

    $.get = function(key, val, callback) {
        var items;
        if (typeof callback === 'function') {
            items = $.item(key, val);
        } else {
            items = key;
            callback = val;
        }
        return $.taskQueue(function() {
            for (key in items) {
                if (val = localStorage.getItem(info.namespace + key)) {
                    items[key] = JSON.parse(val);
                }
            }
            return callback(items);
        });
    };

    $.set = (function() {
        var set = function(key, val) {
            key = info.namespace + key;
            val = JSON.stringify(val);
            if (key in $.syncing) {
                localStorage.setItem(key, val);
            }
            return localStorage.setItem(key, val);
        };
        return function(keys, val) {
            if (typeof keys === 'string') {
                set(keys, val);
                return;
            }
            for (var key in keys) {
                val = keys[key];
                set(key, val);
            }
        };
    })();

    // $.clear

    $.remove = function(array, val) {
        var i = array.indexOf(val);
        if (i === -1) return false;
        array.splice(i, 1);
        return true;
    };
// }}}

var escape, safeJSON; // indexOf prototype
// {{{ 
    Array.prototype.indexOf = function(val, i) {
        i || (i = 0);
        var length = this.length;
        while (i < length) {
            if (this[i] === val) {
                return i;
            }
            i++;
        }
        return -1;
    };

    // sanitize HTML
    escape = (function() {
        var str = {
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#039;',
            '<': '&lt;',
            '>': '&gt;'
        };
        var r = String.prototype.replace;
        var regex = /[&"'<>]/g;
        var fn = function(x) {
            return str[x];
        };
        return function(text) {
            return r.call(text, regex, fn);
        };
    })();

    // don't kill everything if a JSON parse fails
    safeJSON = function(data, storageSource, silent) {
        try {
            return JSON.parse(data);
        } catch (e) {
            if (silent) return {};
            if (storageSource) {
                cli.error('Error caught: JSON parse fail on \'' + data + '\' from ' + storageSource);
                //cli.error('Storing and deleting corrupt data.');
                localStorage.setItem(storageSource + '.error', data);
            } else {
                cli.error('Error caught: JSON parse failed on: ' + data);
            }
            return {};
        }
    };
// }}}


var System = {
    init: function() {
        this.browser = this.searchString(this.dataBrowser) || "unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "unknown version";
        this.OS = this.searchString(this.dataOS) || "unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++) {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
               string: navigator.userAgent,
               subString: "iPhone",
               identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]
};
System.init();


var Utils = {
    css: '',
    addCSS: function(css) {
        this.css += css;
    },
    regexes: {
        all: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\//i,
        inbox: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/messaging\/([\w\.\+]+)\//i,
        comments: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)\/comments\/([\w\.\+]+)/i,
        //commentPermalink: 
        profile: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/user\/([\w\.\+]+)/i,
        //prefs:
        //search:
        submit: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/(?:[\-\w\.]+\/)?submit/i,
        subverse: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)/i,
        dashboard: /^https?:\/\/(dashboard\.)?voat.co\/v\/dashboard\/([\w\.\+]+)/i,
        //subversePostListing:
    },
    isVoat: function() {
        var currURL = location.href;
        return Utils.regexes.all.test(currURL);
    },
    isMatchURL: function(moduleID) {
        if (!Utils.isVoat()) {
            return false;
        }
        var module = Modules[moduleID];
        if (!module) {
            console.warn("isMatchURL could not find module", moduleID);
            return false;
        }

        var exclude = module.exclude,
            include = module.include;
        return Utils.matchesPageLocation(include, exclude);
    },
    matchesPageLocation: function(includes, excludes) {
        includes = typeof includes === 'undefined' ? [] : [].concat(includes);
        excludes = typeof excludes === 'undefined' ? [] : [].concat(excludes);

        var excludesPageType = excludes.length && (Utils.isPageType.apply(VESUtils, excludes) || Utils.matchesPageRegex.apply(VESUtils, excludes));
        if (!excludesPageType) {
            var includesPageType = !includes.length || Utils.isPageType.apply(VESUtils, includes) || Utils.matchesPageRegex.apply(VESUtils, includes);
            return includesPageType;
        }
    },
    pageType: function() {
        if (typeof this.pageTypeSaved === 'undefined') {
            var pageType = '';
            var currURL = location.href;
            if (Utils.regexes.profile.test(currURL)) {
                pageType = 'profile';
            } else if (Utils.regexes.dashboard.test(currURL)) {
                pageType = 'dashboard';
            } else if (Utils.regexes.comments.test(currURL)) {
                pageType = 'comments';
            } else if (Utils.regexes.inbox.test(currURL)) {
                pageType = 'inbox';
            } else if (Utils.regexes.submit.test(currURL)) {
                pageType = 'submit';
            } else if (Utils.regexes.subverse.test(currURL)) {
                pageType = 'subverse';
            } else {
                pageType = 'linklist';
            }
            this.pageTypeSaved = pageType;
        }
        return this.pageTypeSaved;
    },
    isPageType: function(/*type1, type2*/) {
        var thisPage = Utils.pageType();
        return Array.prototype.slice.call(arguments).some(function(e) {
            return (e === 'all') || (e === thisPage);
        });
    },
    matchesPageRegex: function(/*type1, type2, type3*/) {
        var href = document.location.href;
        return Array.prototype.slice.call(arguments).some(function(e) {
            return e.text && e.test(href);
        });
    },
};

// common utils for modules
var VESUtils = {
    // TODO rearrange these utils logically
    options: { /* defined below in $.extends() */ 
        table: {},
    },
    getOptions: function(moduleID) {
        //console.log("getting options for " + moduleID);
        var thisOptions = localStorage.getItem('VESOptions.' + moduleID);
        //console.log("thisOptions = " + thisOptions);
        var currentTime = new Date();
        if ((thisOptions) && (thisOptions != 'undefined') && (thisOptions !== null)) {
            storedOptions = JSON.parse(thisOptions);
            codeOptions = Modules[moduleID].options;
            for (var attrname in codeOptions) {
                if (typeof(storedOptions[attrname]) == 'undefined') {
                    storedOptions[attrname] = codeOptions[attrname];
                }
            }
            Modules[moduleID].options = storedOptions;
            localStorage.setItem('VESOptions.' + moduleID, JSON.stringify(Modules[moduleID].options));
        } else {
            //console.log('getOptions: setting defaults');
            // nothing's been stored, so set defaults:
            localStorage.setItem('VESOptions.' + moduleID, JSON.stringify(Modules[moduleID].options));
        }
        //console.log('getOptions: returning options for ' + moduleID);
        return Modules[moduleID].options;
    },
    getURLParams: function() {
        var result = {}, queryString = location.search.substring(1),
            re = /([^&=]+)=([^&]*)/g, m;
        while (m = re.exec(queryString)) {
            result[decodeURLComponent(m[1])] = decodeURLComponent(m[2]);
        }
        return result;
    },
    currentSubverse: function(check) {
        if (typeof this.curSub === 'undefined') {
            var match = location.href.match(Utils.regexes.subverse);
            if (match !== null) {
                this.curSub = match[1];
                if (check) return (match[1].toLowerCase() === check.toLowerCase());
                return match[1];
            } else {
                if (check) return false;
                return null;
            }
        } else {
            if (check) return (this.curSub.toLowerCase() === check.toLowerCase());
            return this.curSub;
        }
    },
    currentUserProfile: function() {
        // TODO
    },
    getXYpos: function (obj) {
        var topValue= 0,leftValue= 0;
        while(obj){
            leftValue+= obj.offsetLeft;
            topValue+= obj.offsetTop;
            obj= obj.offsetParent;
        }
        finalvalue = { 'x': leftValue, 'y': topValue };
        return finalvalue;
    },
    elementInViewport: function (obj) {
        // check the headerOffset - if we've pinned the subverse bar, we need to add some pixels so the "visible" stuff is lower down the page.
        var headerOffset = this.getHeaderOffset();
        var top = obj.offsetTop - headerOffset;
        var left = obj.offsetLeft;
        var width = obj.offsetWidth;
        var height = obj.offsetHeight;
        while(obj.offsetParent) {
            obj = obj.offsetParent;
            top += obj.offsetTop;
            left += obj.offsetLeft;
        }
        return (
            top >= window.pageYOffset &&
            left >= window.pageXOffset &&
            (top + height) <= (window.pageYOffset + window.innerHeight - headerOffset) &&
            (left + width) <= (window.pageXOffset + window.innerWidth)
        );
    },
    stripHTML: function(str) {
        var regex = /<\/?[^>]+>/gi;
        str = str.replace(regex, '');
        return str;
    },
    sanitizeHTML: function(htmlStr) {
        return window.Pasteurizer.safeParseHTML(htmlStr).wrapAll('<div></div>').parent().html();
    },
    firstValid: function() {
        for (var i = 0, len = arguments.length; i < len; i++) {
            var argument = arguments[i];

            if (argument === void 0) continue;
            if (argument === null) continue;
            if (typeof argument === 'number' && isNaN(argument)) continue;

            return argument;
        }
    },

    loggedInUser: function(tryingEarly) {
        if (typeof this.loggedInUserCached === 'undefined') {
            var userLink = document.querySelector('#header-account > .logged-in > span.user > a');
            if ((userLink !== null)) {
                this.loggedInUserCached = userLink.textContent;
            } else {
                if (tryingEarly) {
                    delete this.loggedInUserCached;
                } else {
                    this.loggedInUserCached = null;
                }
            }
        }
        return this.loggedInUserCached;
    },
    watchForElement: function(type, callback) {
        // TODO
    },
    click: function(obj, btn) {
        var evt = document.createEvent('MouseEvents');
        btn = btn || 0;
        evt.initMouseEvent('click', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
        obj.dispatchEvent(evt);
    },
    mousedown: function(obj, btn) {
        var evt = document.createEvent('MouseEvents');
        btn = btn || 0;
        evt.initMouseEvent('mousedown', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
        obj.dispatchEvent(evt);
    },
    elementUnderMouse: function(obj) {
        // TODO
    },
    isDarkMode: function() {
        // check if isDarkMode has been run already
        if (typeof(this.isDarkModeCached) != 'undefined') return this.isDarkModeCached;
        this.isDarkModeCached = document.getElementsByTagName('link')[1].href.indexOf('Dark') > -1;
        return this.isDarkModeCached;
    },
};

// shim for previous versions
VESUtils.createElement = function(elementType, id, classname, textContent) {
    var obj = document.createElement(elementType);
    if (id) {
        obj.setAttribute('id', id);
    }
    if ((typeof classname !== 'undefined') && classname && (classname !== '')) {
        obj.setAttribute('class', classname);
    }
    if (textContent) {
        if (classname && classname.split(' ').indexOf('noCtrlF') !== -1) {
            obj.setAttribute('data-text', textContent);
        } else { 
            obj.textContent = textContent;
        }
    }
    return obj;
};
$.extend(VESUtils.createElement, {
    toggleButton: function(moduleID, fieldID, enabled, onText, offText, isTable) {
        // TODO
    },
    commaDelimitedNumber: function(nStr) {
        nStr = typeof nStr === 'string' ? nStr.replace(/[^\w]/, '') : nStr;
        var locale = document.querySelector('html').getAttribute('lang') || 'en';
        return new Number(nStr).toLocaleString(locale);
    },
    table: function(items, call, context) {
        if (!items || !call) return;
        // Sanitize single item into items array
        if (!(items.length && typeof items !== 'string')) items = [items];

        var description = [];
        description.push('<table>');

        for (var i = 0; i < items.length; i++) {
            var item = call(items[i], i, items, context);
            if (typeof item === 'string') {
                description.push(item);
            } else if (item.length) {
                description = description.concat(item);
            }
        }
        description.push('</table>');
        description = description.join('\n');

        return description;
    }
});
$.extend(VESUtils.options, {
    resetModulePrefs: function() {
        prefs = {
            'debug': true,
            'hideChildComments': true,
            'voatingNeverEnds': false,
            'singleClick': true,
            'searchHelper': true,
            'filterVoat': false,
            'userTags': false,
            'voatingBooth': false
        };
        this.setModulePrefs(prefs);
        return prefs;
    },
    getAllModulePrefs: function(force) {
        var storedPrefs;
        // don't repeat if it's been done already
        if ((!force) && (typeof(this.getAllModulePrefsCached) != 'undefined')) {
            return this.getAllModulePrefsCached;  
        } 
        //console.log('entering getAllModulePrefs()...')
        if (localStorage.getItem('VES.modulePrefs') !== null) {
            storedPrefs = safeJSON(localStorage.getItem('VES.modulePrefs'));
        } else {
            //console.log('getAllModulePrefs: resetting stored prefs');
            // first time VES has been run
            storedPrefs = this.resetModulePrefs();
        }
        if (!storedPrefs) {
            storedPrefs = {};
        }
        // create a JSON object to return all prefs
        //console.log('getAllModulePrefs: creating prefs object');
        var prefs = {};
        for (var module in Modules) {
            if (storedPrefs[module]) {
                prefs[module] = storedPrefs[module];
            } else if (!Modules[module].disabledByDefault && (storedPrefs[module] === null || module.alwaysEnabled)) {
                // new module! ...or no preferences.
                prefs[module] = true;
            } else {
                prefs[module] = false;
            }
        }
        this.getAllModulePrefsCached = prefs;
        return prefs;
    },
    getModulePrefs: function(moduleID) {
        if (moduleID) {
            var prefs = this.getAllModulePrefs();
            return prefs[moduleID];
        } else {
            alert('no module name specified for getModulePrefs');
        }
    },
    setModulePrefs: function(prefs) {
        if (prefs !== null) {
            localStorage.setItem('VES.modulePrefs', JSON.stringify(prefs));
            return prefs;
        } else {
            alert('error - no prefs specified');
        }
    },
    getModuleIDsByCategory: function(category) {
        var moduleList = Object.getOwnPropertyNames(Modules);

        moduleList = moduleList.filter(function(moduleID) {
            return !Modules[moduleID].hidden;
        });
        moduleList = moduleList.filter(function(moduleID) {
            return [].concat(Modules[moduleID].category).indexOf(category) !== -1;
        });
        moduleList.sort(function(moduleID1, moduleID2) {
            var a = Modules[moduleID1];
            var b = Modules[moduleID2];

            if (a.sort !== void 0 || b.sort !== void 0) {
                var sortComparison = (a.sort || 0) - (b.sort || 0);
                if (sortComparison !== 0) {
                    return sortComparison;
                }
            }

            if (a.moduleName.toLowerCase() > b.moduleName.toLowerCase()) return 1;
            return -1;
        });

        return moduleList;
    },
    enableModule: function(moduleID, onOrOff) {
        var module = Modules[moduleID];
        if (!module) {
            console.warn('options.enableModule could not find module', moduleID);
            return;
        }
        if (module.alwaysEnabled && !onOrOff) {
            return;
        }

        var prefs = this.getAllModulePrefs(true);
        prefs[moduleID] = !! onOrOff;
        this.setModulePrefs(prefs);
        if (typeof module.onToggle === 'function') {
            Modules[moduleID].onToggle(onOrOff);
        }
    },
    setOption: function(moduleID, optionName, optionValue) {
        if (/_[\d]+$/.test(optionName)) {
            optionName = optionName.replace(/_[\d]+$/, '');
        }
        var thisOptions = this.getOptions(moduleID);
        if (!thisOptions[optionName]) {
            console.warn('Could not find option', moduleID, optionName);
            return false;
        }

        var saveOptionValue;
        if (optionValue === '') {
            saveOptionValue = '';
        } else if ((isNaN(optionValue)) || (typeof optionValue === 'boolean') || (typeof optionValue === 'object')) {
            saveOptionValue = optionValue;
        } else if (optionValue.indexOf('.') !== -1) {
            saveOptionValue = parseFloat(optionValue);
        } else {
            saveOptionValue = parseInt(optionValue, 10);
        }
        thisOptions[optionName].value = saveOptionValue;
        // save it to the object and to VESStorage
        VESUtils.options.saveModuleOptions(moduleID, thisOptions);
        return true;
    },
    saveModuleOptions: function(moduleID, newOptions) {
        function minify(obj) {
            var min = {};
            if (obj) {
                for (var key in obj) {
                    if ('value' in obj[key]) {
                        min[key] = {value: obj[key].value};
                    }
                }
            }
            return min;
        }
        if (newOptions) {
            Modules[moduleID].options = newOptions;
        }
        VESStorage.setItem('VESOptions.' + moduleID, JSON.stringify(minify(Modules[moduleID].options)));
    },
    getOptionsFirstRun: [],
    getOptions: function(moduleID) {
        if (this.getOptionsFirstRun[moduleID]) {
            // we've already grabbed these out of localstorage, so modifications should be done in memory. just return that object.
            return Modules[moduleID].options;
        }
        var thisOptions = localStorage.getItem('VESOptions.' + moduleID);
        if ((thisOptions) && (thisOptions !== 'undefined') && (thisOptions !== null)) {
            // merge options (in case new ones were added via code) and if anything has changed, update to localStorage
            var storedOptions = safeJSON(thisOptions, 'VESoptions.' + moduleID);
            var codeOptions = Modules[moduleID].options;
            var newOption = false;
            for (var attrname in codeOptions) {
                codeOptions[attrname].default = codeOptions[attrname].value;
                if (typeof storedOptions[attrname] === 'undefined') {
                    newOption = true;
                } else {
                    codeOptions[attrname].value = storedOptions[attrname].value;
                }
            }
            Modules[moduleID].options = codeOptions;
            if (newOption) {
                VESUtils.options.saveModuleOptions(moduleID);
            }
        } else {
            // nothing in localStorage, let's set the defaults...
            VESUtils.options.saveModuleOptions(moduleID);
        }
        this.getOptionsFirstRun[moduleID] = true;
        return Modules[moduleID].options;
    },
});
$.extend(VESUtils.options.table, {
    getMatchingValue: function(moduleID, optionKey, valueIdentifiers) {
        var option = Modules[moduleID].options[optionKey];
        var values = option.value;
        var matchingValue;
        if (!(option.type === 'table' && values && values.length)) return;

        for (var vi = 0, vlength = values.length; vi < vlength; vi++) {
            var value = values[vi];
            var match = false;
            for (var fi = 0, flength = option.fields.length; fi < flength; fi++) {
                var field = option.fields[fi];
                var fieldValue = value[fi];
                var matchValue = VESUtils.firstValid(valueIdentifiers[fi], valueIdentifiers[field.name]);

                if (matchValue === undefined) {
                    continue;
                } else if (matchValue === fieldValue) {
                    match = true;
                    continue;
                } else {
                    match = false;
                    break;
                }
            }

            if (match) {
                matchingValue = value;
                break;
            }
        }

        return matchingValue;
    },
    addValue: function(moduleID, optionKey, value) {
        var option = Modules[moduleID].options[optionKey];
        if (option.type !== 'table') {
            console.error('Tried to save table value to non-table option: Modules[\'' + moduleID + '\'].options.' + optionKey);
            return;
        }

        if (!option.value) {
            option.value = [];
        }
        var values = option.value;

        var optionValue = [];
        for (var i = 0, length = option.fields.length; i < length; i++) {
            var field = option.fields[i];

            var fieldValue = VESUtils.firstValid(value[i], value[field.name], field.value);
            optionValue.push(fieldValue);
        }

        values.push(optionValue);
        VESUtils.options.setOption(moduleID, optionKey, values);

        return optionValue;
    },
    getMatchingValueOrAdd: function(moduleID, optionKey, valueIdentifier, hydrateValue) {
        var matchingValue = VESUtils.options.table.getMatchingValue(moduleID, optionKey, valueIdentifier);
        if (!matchingValue) {
            var value = valueIdentifier;
            if (hydrateValue) {
                value = hydrateValue(valueIdentifier);
            }

            matchingValue = VESUtils.options.table.addValue(moduleID, optionKey, value);
        }

        return matchingValue;
    },
    mapValueToObject: function(moduleID, optionKey, value) {
        var option = Modules[moduleID].options[optionKey];

        var object = {};
        for (var i = 0, length = option.fields.length; i < length; i++) {
            var field = option.fields[i];

            object[field.name] = value[i];
        }

        return object;
    }
});
(function(module) {
    var stagedOptions;

    clearStagedOptions();

    function stageOption(moduleID, optionName, optionValue) {
        stagedOptions[moduleID] = stagedOptions[moduleID] || {};
        stagedOptions[moduleID][optionName] = {
            value: optionValue
        };
    }
    function commitStagedOptions() {
        $.each(stagedOptions, function (moduleID, module) {
            $.each(module, function(optionName, option) {
                VESUtils.options.setOption(moduleID, optionName, option.value);
            });
        });
        clearStagedOptions();
    }
    function clearStagedOptions() {
        stagedOptions = {};
    }

    function hasStagedOptions() {
        return Object.getOwnPropertyNames(stagedOptions).length;
    }

    function getOptions(moduleID) {
        return stagedOptions[moduleID];
    }

    module.reset = clearStagedOptions;
    module.add = stageOption;
    module.commit = commitStagedOptions;
    module.isDirty = hasStagedOptions;
    module.get = getOptions;
})(VESUtils.options.stage = VESUtils.options.stage || {});


var Modules = {};

Modules.debug = {
    moduleID: 'debug',
    moduleName: 'VES Debugger',
    description: 'VES analytics for debugging.',
    options: {
        printSystemInfos: {
            type: 'boolean',
            value: true,
            description: 'Print system information (OS & browser) to the console. Helps when submitting bug reports.'
        },
        printLocalStorage: {
            type: 'boolean',
            value: false,
            description: 'Print the contents of localStorage to the console on every page load.'
        },
    },
    isEnabled: function() {
        // technically cheating
        return true;
    },
    include: [
        'all'
    ],
    isMatchURL: function() {
        return Utils.isMatchURL(this.moduleID);
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            cli.log('VES loaded: ' + Date());

            this.printSystemInfos();

            // add a link to VES in the footer
            var separator = $.el('span', {
                className: 'separator',
            });
            var link = $.el('a', {
                href: 'http://github.com/travis-g/Voat-Enhancement-Suite',
                innerHTML: 'VES'
            });
            var footer = $('.footer div', doc);
            $.add(footer, separator);
            $.add(footer, link);
        }
    },
    printSystemInfos: function() {
        if (this.options.printSystemInfos) {
            cli.log('System Information:');
            var json = {
                'OS': System.OS,
                'Browser': System.browser + ' ' + System.version
            };
            cli.log(JSON.stringify(json));
        }
    },
    printLocalStorage: function() {
        // this should probably go in Utils
        cli.log('localStorage data...')
        for (var key in localStorage) {
            cli.log(key + ':')
            cli.log(localStorage[key]);
        }
    }
};
Modules.hideChildComments = {
    moduleID: 'hideChildComments',
    moduleName: 'Hide All Child Comments',
    description: 'Allows you to hide all child comments for easier reading.',
    options: {
        automatic: {
            type: 'boolean',
            value: false,
            description: 'Automatically hide all child comments on page load?'
        }
    },
    include: [
        'comments'
    ],
    isEnabled: function() {
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    isMatchURL: function() {
        return Utils.isMatchURL(this.moduleID);
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            // begin creating the OP's 'hide child comments' button
            var toggleButton = $.el('li');
            this.toggleAllLink = $.el('a', {
                textContent: 'hide all child comments',
                href: '#',
                title: 'Show only replies to original poster.',
            });
            this.toggleAllLink.setAttribute('action', 'hide');
            this.toggleAllLink.addEventListener('click', function(e) {
                e.preventDefault();
                Modules.hideChildComments.toggleComments(this.getAttribute('action'));
                if (this.getAttribute('action') == 'hide') {
                    this.setAttribute('action', 'show');
                    this.setAttribute('title', 'Show all comments.');
                    this.textContent = 'show all child comments';
                } else {
                    this.setAttribute('action', 'hide');
                    this.setAttribute('title', 'Show only replies to original poster.');
                    this.textContent = 'hide all child comments';
                }
            }, true);
            $.add(toggleButton, this.toggleAllLink);
            var commentMenu = doc.querySelector('ul.buttons');
            if (commentMenu) {
                // add the post's toggle
                commentMenu.appendChild(toggleButton);
                // get the comments of every top-level comment
                // there's no parent element that groups every root comment's comments, so we'll need to get them all
                var rootComments = doc.querySelectorAll('div.commentarea > div.sitetable > div.thread');
                // for every root comment add a hide child elements link
                for (var i = 0, len = rootComments.length; i < len; i++) {
                    toggleButton = $.el('li');
                    var toggleLink = $.el('a', {
                        textContent: 'hide child comments',
                        href: '#',
                        className: 'toggleChildren'
                    });
                    toggleLink.setAttribute('action', 'hide');
                    toggleLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        Modules.hideChildComments.toggleComments(this.getAttribute('action'), this);
                    }, true);
                    $.add(toggleButton, toggleLink);
                    //console.log('toggleButton: ' + typeof(toggleButton));
                    // get the first (if any) comment of the root
                    var childComment = rootComments[i].querySelector('.child');
                    if (childComment !== null) { // only add the link if they're comments
                        var rootMenu = rootComments[i].querySelector('ul.buttons');
                        if (rootMenu) rootMenu.appendChild(toggleButton);
                    }
                }
                if (this.options.automatic.value) {
                    // don't auto-hide in comment permalinks
                    // url: /comments/12345/123456
                    var linkRE = /\/comments\/(?:\w+)\/(?:\w+)/;
                    if (! location.pathname.match(linkRE)) {
                        Utils.click(this.toggleAllLink);
                    }
                }
            }
        }
    },
    toggleComments: function(action, obj) {
        var commentContainers;
        if (obj) { // toggle a single comment tree
            commentContainers = $j(obj).closest('.thread');
        } else { // toggle all comments
            cli.log('Hiding all child comments...');
            commentContainers = doc.querySelectorAll('div.commentarea > div.sitetable > div.thread');
        }
        for (var i = 0, len = commentContainers.length; i < len; i++) {
            // get the children under comment i
            var thisChildren = commentContainers[i].querySelectorAll('div.child');
            var numChildren = thisChildren.length;
            // cli.log('hiding ' + numChildren + ' children');
            // get the root comment's "hide your kids" link
            var thisToggleLink = commentContainers[i].querySelector('a.toggleChildren');
            if (thisToggleLink !== null) {
                // for each child in thisChildren either hide it or show it
                for (var x = 0, y = thisChildren.length; x < y; x++) {
                    if (action === 'hide') {
                        // Voat's already got a .hidden class, use that
                        $.addClass(thisChildren[x], 'hidden');
                        thisToggleLink.innerHTML = 'show child comments';
                        thisToggleLink.setAttribute('action', 'show');
                    } else {
                        $.rmClass(thisChildren[x], 'hidden');
                        thisToggleLink.innerHTML = 'hide child comments';
                        thisToggleLink.setAttribute('action', 'hide');
                    }
                }
            }
        }
    }
};
Modules.singleClick = {
    moduleID: 'singleClick',
    moduleName: 'Single Click',
    description: 'Adds an [l+c] link that opens both the link and the comments page in new tabs.',
    options: {
        openOrder: {
            type: 'enum',
            values: [
                { name: 'open comments then link', value: 'commentsfirst' },
                { name: 'open link then comments', value: 'linkfirst' }
            ],
            value: 'commentsfirst',
            description: 'What order to open the link/comments in.'
        },
        hideLEC: {
            type: 'boolean',
            value: false,
            description: 'Hide the [l=c] where the link is the same as the comments page'
        }
    },
    isEnabled: function() {
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    include: [
        'all',
    ],
    exclude: [
        'comments',
    ],
    isMatchURL: function() {
        return Utils.isMatchURL(this.moduleID);
    },
    beforeLoad: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            if (VESUtils.isDarkMode()) {
                Utils.addCSS('.VESSingleClick { color: #bcbcbc; font-weight: bold; }');
                Utils.addCSS('.VESSingleClick:hover { text-decoration: underline; cursor: pointer; }');
            } else {
                Utils.addCSS('.VESSingleClick { color: #6a6a6a; font-weight: bold; }');
                Utils.addCSS('.VESSingleClick:hover { text-decoration: underline; cursor: pointer; }');
            }
        }
    },
    go: function() {
        //if ((this.isMatchURL())) {    // force run
        if ((this.isEnabled()) && (this.isMatchURL())) {
            this.applyLinks();
            // watch for changes to .sitetable, then reapply
            //VESUtils.watchForElement('sitetable', Modules.singleClick.applyLinks);
            doc.body.addEventListener('DOMNodeInserted', function(event) {
                if ((event.target.tagName == 'DIV') && (event.target.getAttribute('class') == 'sitetable')) {
                    Modules.singleClick.applyLinks();
                }
            }, true);
        }
    },
    applyLinks: function(ele) {
        ele = ele || doc;
        var entries = $$('.sitetable>.submission .entry', ele); // beware of .alert-featuredsub!
        for (var i = 0, len = entries.length; i < len; i++) {
            if ((typeof entries[i] !== 'undefined') && (!entries[i].classList.contains('lcTagged'))) {
                $.addClass(entries[i], 'lcTagged');
                this.titleLA = $('A.title', entries[i]);
                if (this.titleLA !== null) {
                    var thisLink = this.titleLA.href;
                    // check if it's a relative path (no http://)
                    if (!(thisLink.match(/^http/i))) {
                        thisLink = 'http://' + document.domain + thisLink;
                    }
                    //console.log("thisLink -- " + thisLink);
                    var thisComments = (thisComments = entries[i].querySelector('.comments')) && thisComments.href;
                    //console.log("thisComments -- " + thisComments);
                    var thisUL = $('ul.flat-list', entries[i]);
                    var singleClickLI = $.el('li');
                    var singleClickLink = $.el('a', {
                        className: 'VESSingleClick'
                    });
                    singleClickLink.setAttribute('thisLink',thisLink);
                    singleClickLink.setAttribute('thisComments',thisComments);
                    if (thisLink != thisComments) {
                        singleClickLink.innerHTML = '[l+c]';
                    } else if (!(this.options.hideLEC.value)) {
                        singleClickLink.innerHTML = '[l=c]';
                    }
                    $.add(singleClickLI, singleClickLink);
                    $.add(thisUL, singleClickLI);
                    singleClickLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        if(e.button != 2) {
                            // check if it's a relative link (no http://voat.co) because chrome barfs on these when creating a new tab...
                            var thisLink = this.getAttribute('thisLink');
                            if (Modules.singleClick.options.openOrder.value == 'commentsfirst') {
                                if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
                                    // console.log('open comments');
                                    window.open(this.getAttribute('thisComments'));
                                }
                                window.open(this.getAttribute('thisLink'));
                            } else { // Modules.singleClick.options.openOrder.value == 'linkfirst'
                                window.open(this.getAttribute('thisLink'));
                                if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
                                    // console.log('open comments');
                                    window.open(this.getAttribute('thisComments'));
                                }
                            }
                        }
                    }, true);
                }
            }
        }
    }
};
Modules.searchHelper = {
    moduleID: 'searchHelper',
    moduleName: 'Search Helper',
    description: 'Provide help with the use of search.',
    options: {
        searchSubverseByDefault: {
            type: 'boolean',
            value: true,
            description: 'Search the current subverse by default when using the search box, instead of all of voat.'
        },
        // addSearchOptions: {
        //     type: 'boolean',
        //     value: true,
        //     description: 'Allow you to choose sorting and time range on the search form of the side panel.'
        // },
        // addSubmitButton: {
        //     type: 'boolean',
        //     value: false,
        //     description: 'Add a submit button to the search field.'
        // },
        // toggleSearchOptions: {
        //     type: 'boolean',
        //     value: true,
        //     description: 'Add a button to hide search options while searching.',
        //     advanced: true
        // },
        // searchByFlair: {
        //     type: 'boolean',
        //     value: true,
        //     description: 'When clicking on a post\'s flair, search its subverse for that flair. <p>May not work in some subverses that hide the actual flair and add pseudo-flair with CSS (only workaround is to disable subverse style).</p>'
        // }
    },
    isEnabled: function() {
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    // include: [
    // ],
    isMatchURL: function() {
        // return Utils.isMatchURL(this.moduleID);
        return true;
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            var searchExpando;
            if (this.options.searchSubverseByDefault.value) {
                this.searchSubverseByDefault();
            }
            // if (this.options.addSearchOptions.value) {
            //     searchExpando = document.getElementById('searchexpando');
            //     if (searchExpando) {
            //         var searchOptionsHtml = '<label>Sort:<select name="sort"><option value="relevance">relevance</option><option value="new">new</option><option value="hot">hot</option><option value="top">top</option><option value="comments">comments</option></select></label> <label>Time:<select name="t"><option value="all">all time</option><option value="hour">this hour</option><option value="day">today</option><option value="week">this week</option><option value="month">this month</option><option value="year">this year</option></select></label>';
            //         if ($(searchExpando).find('input[name=restrict_sr]').length) { // we don't want to add the new line if we are on the front page
            //             searchOptionsHtml = '<br />' + searchOptionsHtml;
            //         }
            //         $(searchExpando).find('#moresearchinfo').before(searchOptionsHtml);
            //     }
            // }
            // if (this.options.addSubmitButton.value) {
            //     searchExpando = document.getElementById('searchexpando');
            //     if (searchExpando) {
            //         Utils.addCSS('#searchexpando .searchexpando-submit { text-align:center; }');
            //         var submitDiv = '<div class="searchexpando-submit"><button type="submit">search</button></div>';
            //         $(searchExpando).append(submitDiv);
            //     }
            // }
            // if (this.options.toggleSearchOptions.value && Utils.regexes.search.test(location.href)) {
            //     Utils.addCSS('.searchpane-toggle-hide { float: right; margin-top: -1em } .searchpane-toggle-show { float: right; } .searchpane-toggle-show:after { content:"\u25BC"; margin-left:2px; }.searchpane-toggle-hide:after { content: "\u25B2"; margin-left: 2px; }');
            //     if (this.options.hideSearchOptions.value || location.hash === '#ves-hide-options') {
            //         $('body').addClass('ves-hide-options');
            //     }
            //     Utils.addCSS('.ves-hide-options .search-summary, .ves-hide-options .searchpane, .ves-hide-options .searchfacets { display: none; } .ves-hide-options .searchpane-toggle-show { display: block; } .searchpane-toggle-show { display: none; }');
            //     $('.content .searchpane').append('<a href="#ves-hide-options" class="searchpane-toggle-hide">hide search options</a>');
            //     $('.content .searchpane ~ .menuarea').prepend('<a href="#ves-show-options" class="searchpane-toggle-show">show search options</a>');
            //     $('.searchpane-toggle-hide').on('click', function() {
            //         $('body').addClass('ves-hide-options');
            //     });
            //     $('.searchpane-toggle-show').on('click', function() {
            //         $('body').removeClass('ves-hide-options');
            //     });
            // }
            // if (this.options.searchByFlair) {
            //     Utils.addCSS('.ves-flairSearch { cursor: pointer; position: relative; } .linkflairlabel.ves-flairSearch a { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }');
            //     $('.sitetable').on('mouseenter', '.title > .linkflairlabel:not(.ves-flairSearch)', function(e) {
            //         var parent = $(e.target).closest('.thing')[0],
            //             srMatch = Utils.regexes.subverse.exec(parent.querySelector('.entry a.subverse')),
            //             subverse = (srMatch) ? srMatch[1] : VESUtils.currentSubverse(),
            //             flair = e.target.title.replace(/\s/g, '+');
            //         if (flair && subverse) {
            //             var link = document.createElement('a');
            //             link.href = '/r/' + encodeURIComponent(subverse) + '/search?sort=new&restrict_sr=on&q=flair%3A' + encodeURIComponent(flair);
            //             e.target.classList.add('ves-flairSearch');
            //             e.target.appendChild(link);
            //         }
            //     });
            // }
        }
    },
    searchSubverseByDefault: function() {
        var restrictSearch = $j('form[action="/search"] > input#l');
        if (restrictSearch && !$('meta[content="search results"]', doc.head)) { // prevent autochecking after searching with it unchecked
            restrictSearch.checked = true;
        }
    }
};
Modules.userTags = {
    moduleID: 'userTags',
    moduleName: 'User Tags',
    category: 'Users',
    description: 'Tag Voat users in posts and comments.',
    options: {
        hardIgnore: {
            type: 'boolean',
            value: false,
            description: 'When on, the ignored user\'s entire post is hidden, not just the title.'
        }
    },
    isEnabled: function() {
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    isMatchURL: function() {
        return Utils.isMatchURL(this.moduleID);
    },
    include: [
        'all',
    ],
    //exclude: [],
    beforeLoad: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            // load CSS
        }
    },
    usernameSelector: 'p.tagline a.author, .sidecontentbox a.author, div.md a[href^="/u/"], div.md a[href^="/user/"]',
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {

            this.tags = null;
            if (typeof tags !== 'undefined') {
                this.tags = safeJSON(tags, 'userTags.tags', true);
            }
            this.applyTags();
        }
    },
    applyTags: function(ele) {
        ele = ele || doc;
    },
    applyTag: function(authorObj) {
        var userObject = [],
            thisTag = null,
            thisColor = null,
            thisIgnore = null,
            thisAuthor, thisPost, thisComment;

        if ((authorObj) && (!($.hasClass(authorObj, 'userTagged'))) && (typeof authorObj !== 'undefined') && (authorObj !== null)) {
            if (authorObj.getAttribute('data-username')) {
                thisAuthor = authorObj.getAttribute('data-username');
            }
            noTag = false;
            if ((thisAuthor) && (thisAuthor.substr(0, 3) === '/u/')) {
                noTag = true;
                thisAuthor = thisAuthor.substr(3);
            }                
            thisAuthor = thisAuthor.toLowerCase();
            if (!noTag) {
                $.addClass(authorObj, 'userTagged');
                if (typeof userObject[thisAuthor] === 'undefined') {
                    if (this.tags && this.tags[thisAuthor]) {
                        if (typeof this.tags[thisAuthor].tag !== 'undefined') {
                            thisTag = this.tags[thisAuthor].tag;
                        }
                        if (typeof this.tags[thisAuthor].color !== 'undefined') {
                            thisColor = this.tags[thisAuthor].color;
                        }
                        if (typeof this.tags[thisAuthor].ignore !== 'undefined') {
                            thisIgnore = this.tags[thisAuthor].ignore;
                        }
                    }
                    userObject[thisAuthor] = {
                        tag: thisTag,
                        color: thisColor,
                        ignore: thisIgnore,
                    };
                }
                var tag = $.el('span', {
                    className: 'VESUserTag',
                    alt: thisAuthor,
                    textContent: '+'
                });
                $.after(authorObj, tag);
            }
        }
    },
    createTagDialog: function() {

    },
    closeTagDialog: function() {

    },
    saveUserTag: function() {

    },
    ignoreComment:function() {

    },
    ignoreUser: function() {

    },
};
Modules.voatingBooth = {
    moduleID: 'voatingBooth',
    moduleName: 'Voating Booth',
    description: 'UI enhancements for Voat.',
    options: {
        fullVoat: {
            type: 'boolean',
            value: false,
            description: 'Make Voat use the full screen width?'
        },
        pinHeader: {
            type: 'enum',
            values: [{
                name: 'None',
                value: 'none'
            }, {
                name: 'Subverse Bar only',
                value: 'sub'
            }, {
                name: 'Full Header',
                value: 'header'
            }],
            value: 'none',
            description: 'Pin header elements to the page top, even when scrolling.'
        }
    },
    include: [
        'all'
    ],
    isEnabled: function() {
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    isMatchURL: function() {
        return Utils.isMatchURL(this.moduleID);
    },
    beforeLoad: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            if (this.options.fullVoat.value) {
                var css = '#header-container { padding-left: 10px; padding-right: 10px }';
                css += '#header-banner { max-width: initial }';
                css += 'body > #container { margin-left: 10px; margin-right: 10px; max-width: initial }';
                Utils.addCSS(css);
            }
            switch (this.options.pinHeader.value) {
                case 'header':
                    $.addClass(doc.body, 'pinHeader-header');
                    break;
                case 'sub':
                    $.addClass(doc.body, 'pinHeader-sub');
                    break;
                default:
                    break;
            }
        }
    },
    go: function() {
        if ((this.isEnabled()) && this.isMatchURL()) {
            switch (this.options.pinHeader.value) {
                case 'header':
                    this.pinHeader();
                    break;
                case 'sub':
                    this.pinSubverseBar();
                    break;
                default:
                    break;
            }
        }
    },
    pinHeader: function() {
        var header = $.id('header');
        if (header === null) {
            return;
        }

        var spacer = $.el('div');
        spacer.id = 'VESPinnedHeaderSpacer';

        var css = '#sr-header-area { left: 0; right: 0 }';
        spacer.style.height = $j('#header').outerHeight() + 'px';

        $.before(header.nextSibling, spacer);

        css += 'body > #container { margin-top: 10px }';
        css += '#header { position: fixed }';
        css += '#header { left: 0; right: 0 }';
        css += '#sr-more-link: { position: fixed }';
        Utils.addCSS(css);
        cli.log(css);
        cli.log(Utils.css);
    },
    pinSubverseBar: function() {
        // Make the subverse bar at the top of the page a fixed element

        var sb = $.id('sr-header-area');
        if (sb === null) {
            return;
        }
        var header = $.id('header');

        // add a dummy <div> inside the header to replace the subreddit bar (for spacing)
        var spacer = $.el('div');
        spacer.style.paddingTop = window.getComputedStyle(sb, null).paddingTop;
        spacer.style.paddingBottom = window.getComputedStyle(sb, null).paddingBottom;
        spacer.style.height = window.getComputedStyle(sb, null).height;

        //window.setTimeout(function(){
        // add the spacer; take the subreddit bar out of the header and put it above
        header.insertBefore(spacer, sb);
        doc.body.insertBefore(sb, header);

        var css = '#header-bottom-left { margin-top: 19px; }';
        css += 'div#sr-header-area {position: fixed; z-index: 10000 !important; left: 0; right: 0; }';
        //this.pinCommonElements(sm);
        css += '#sr-more-link: {position: fixed;}';
        Utils.addCSS(css);
    },
};


(function(u) {
    var Conf, Settings, VES;

    Conf = {}; // loaded configs

    Settings = {
        "export": function() {
            return $.get(Conf, function(Conf) {
                return Settings.downloadExport('Settings', {
                    version: info.version,
                    date: Date.now(),
                    Conf: Conf
                });
            });
        },
        downloadExport: function(title, data) {
            var a = $.el('a', { // craft a link
                download: 'VES v' + info.version + ' ' + title + '.' + data.date + '.json',
                href: "data:application/json;base64," + (btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))))
            });
            $.add(doc.body, a);
            a.click();  // force clicking the download link
            return $.rm(a); // remove the download link
        }
    };

    VES = { // for the extension itself
        localStorageFail: false,
        init: function() {
            pathname = location.pathname.split('/');
            VESUtils.options.resetModulePrefs();

            // test for localStorage
            try {
                $.set('test', test);
            } catch(e) {
                localStorageFail = true;
            }
            if (localStorageFail) {
                // cli.error('Storage failed or is inaccessible. Are you in a private browsing session?');
                // TODO create a visual indicator
            }

            // load Config into memory
            load = function(parent, obj) {
                if (obj instanceof Array) {
                    Conf[parent] = obj[0];
                } else if (typeof obj === 'object') {
                    for (var key in obj) {
                        var val = obj[key];
                        load(key, val);
                    }
                } else {
                    Conf[parent] = obj;
                }
            };
            load(null, Config);

            // load previously saved configs
            return $.get(Conf, function(items) {
                $.extend(Conf, items);
                return $.asap((function() {
                    return doc.head;
                }), VES.loadModules);
            });
        },
        loadModules: function() {
            var module;
            // if there's preloading needed, do it
            for (module in Modules) {
                if (typeof Modules[module] === 'object') {
                    if (typeof Modules[module].beforeLoad === 'function') {
                        Modules[module].beforeLoad();
                    }
                }
            }
            // run the modules' .go() function
            for (module in Modules) {
                if (typeof Modules[module] === 'object') {
                    try {
                        Modules[module].go();
                    } catch (e) {
                        cli.log('\"' + Modules[module].moduleName + '\" initialization crashed!');
                        cli.error(e.name + ': ' + e.message);
                    }
                }
            }
            // inject the CSS from all the modules
            $.addStyle(Utils.css, 'VESStyles');
        }
    };
    VES.init();

}).call(this);
