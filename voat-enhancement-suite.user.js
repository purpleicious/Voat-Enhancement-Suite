// ==UserScript==
// @name        Voat Enhancement Suite
// @version     0.0.9
// @namespace   http://tjg.io/Voat-Enhancement-Suite
// @description Suite of tools to enhance Voat
// @author      travis
// @include     http://voat.co/*
// @include     https://voat.co/*
// @include     http://*.voat.co/*
// @include     https://*.voat.co/*
// @exclude
// @match
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_openInTab
// @run-at      document-start
// @require     http://code.jquery.com/jquery-latest.js
// @noframes
// @updateURL   https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.meta.js
// @downloadURL https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.user.js
// @icon
// ==/UserScript==
//'use strict';

/*  stop jQuery conflicts with our homebrew $ function.
    jQuery aliases $ = jQuery, so prevent that ASAP.
    (https://api.jquery.com/jquery.noconflict/)         */
var j = jQuery.noConflict();

var info = {
    v: '0.0.9',
    namespace: 'VES.',
    name: 'Voat Enhancement Suite',
    abbr: 'VES'
    // TODO add pageType up here?
};


Defaults = {
    modules: {
        'Debug': [true, 'Analytics for debugging.'],
        'Hide Child Comments': [true, 'Allows you to hide child comments for easier reading.'],
        'Search Helper': [true, 'Provides help with the use of search.'],
        'Single Click': [true, 'Adds an [l+c] link that opens both the link and the comments page in new tabs.'],
        'User Tags': [false, 'Tag Voat users in posts and comments.'],
        'Voating Booth': [false, 'UI enhancements for Voat.'],
        'Voating Never Ends': [false, 'Autoload next pages of posts.']
    }
};


// GreaseMonkey API compatibility for non-GM browsers (Chrome, Safari, Firefox)
// @copyright      2009, 2010 James Campos
// @modified        2010 Steve Sobel - added some missing gm_* functions
// @license        cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
if ((typeof GM_deleteValue == 'undefined') || (typeof GM_addStyle == 'undefined')) {
    var GM_addStyle = function(css) {
        var style = document.createElement('style');
        style.textContent = css;
        var head = document.getElementsByTagName('head')[0];
        if (head) {
            head.appendChild(style);
        }
    };

    var GM_deleteValue = function(name) {
        localStorage.removeItem(name);
    };

    var GM_getValue = function(name, defaultValue) {
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

    var GM_log = function(message) {
        console.log(message);
    };

    var GM_setValue = function(name, value) {
        value = (typeof value)[0] + value;
        localStorage.setItem(name, value);
    };

    var GM_openInTab = function(url) {
        window.open(url);
    };
    // GM_xmlhttpRequest
}


// shortening
var doc = document,
    cli = console;

// function aliases
var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

// make some sorta-jQuery functions, http://api.jquery.com/
var $, $$;
// {{{ 
    // querySelector on root (or document.body)
    $ = function(selector, root) {
        if (root === null) {
            root = doc.body;
        }
        return root.querySelector(selector);
    };
    // querySelectorAll on root (or document.body)
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

    // alias for getElementById(id)
    $.id = function(id) {
        return doc.getElementById(id);
    };

    // once page is loaded execute a function
    $.ready = function(func) {
        // if the document is ready queue the task
        if (doc.readyState !== 'loading') {
            $.taskQueue(func);
            return;
        }
        // create a callback to unbind the event from the document and
        // execute the function
        var callback = function() {
            $.off(doc, 'DOMContentLoaded', callback);
            return func();
        };
        // set an event to execute the callback function once the page is loaded
        return $.on(doc, 'DOMContentLoaded', callback);
    };

    // add a list of properties to an object
    $.extend = function(obj, props) {
        for (var key in props) {
            val = props[key];
            obj[key] = val;
        }
    };

    // wait until test can be done and then perform a callback
    $.asap = function(test, callback) {
        // if test CAN be done perform the callback
        if (test()) {
            return callback();
        } else {
            // if you can't do test, wait and try again
            return setTimeout($.asap, 25, test, callback);
        }
    };

    // create a <style> element with given CSS and an id,
    // and append it to <head> as soon as possible.
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

    // add a class or list of classes to an element
    $.addClass = function(/*element, class1, class2...*/) {
        var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (var i = 0, len = classnames.length; i < len; i++) {
            var classname = classnames[i];
            el.classList.add(classname);
        }
    };

    // remove a class or list of classes from an element
    $.rmClass = function(/*element, class1, class2...*/) {
        var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (var i = 0, len = classnames.length; i < len; i++) {
            var classname = classnames[i];
            el.classList.remove(classname);
        }
    };

    // toggle a class on an element
    $.toggleClass = function(el, classname) {
        return el.classList.toggle(classname);
    };

    // return true if an element has a given class
    $.hasClass = function(el, classname) {
        return __indexOf.call(el.classList, classname) >= 0;
    };

    // remove a single element
    $.rm = function(el) {
        return el.remove();
    };

    // remove everything inside a root element
    $.rmAll = function(root) {
        root.textContent = null;
        return root.textContent;
    };

    // make a new piece of document to be added
    $.fragment = function() {
        return doc.createDocumentFragment();
    };
    $.nodes = function(nodes) {
        // if just one node return it
        if (!(nodes instanceof Array)) {
            return nodes;
        }
        // if theres a bunch, create a new section of document,
        // then add all of the nodes as sibilings
        var frag = $.fragment();
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            frag.appendChild(node);
        }
        return frag;
    };
    // add an element after its parent's existing children
    $.add = function(parent, el) {
        return parent.appendChild($.nodes(el));
    };
    // add an element to a parent as a firstChild
    $.prepend = function(parent, el) {
        return parent.insertBefore($.nodes(el), parent.firstChild);
    };
    // add an element after another
    $.after = function(root, el) {
        return root.parentNode.insertBefore($.nodes(el), root.nextSibiling);
    };
    // insert an element before another
    $.before = function(root, el) {
        return root.parentNode.insertBefore($.nodes(el), root);
    };

    // create an element and set it's properties using JSON data
    $.el = function(tag, props) {
        var el = doc.createElement(tag);
        // if a JSON of properties is passed in, apply them
        if (props) {
            $.extend(el, props);
        }
        return el;
    };

    // add an event and a handler to an element
    $.on = function(el, events, handler) {
        var ref = events.split(' ');
        for (var i = 0, len = ref.length; i < len; i++) {
            var event = ref[i];
            el.addEventListener(event, handler, false);
        }
    };
    
    // remove an event and handler from an element
    $.off = function(el, events, handler) {
        var ref = events.split(' ');
        for (var i = 0, len = ref.length; i < len; i++) {
            var event = ref[i];
            el.removeEventListener(event, handler, false);
        }
    };

    // $.one
    
    // create a custom event type
    $.event = function(event, detail, root) {
        // OR function(event, detail), if root is document
        if (root === null) {
            root = doc;
        }
        if ((detail !== null) && typeof cloneInto === 'function') {
            detail = cloneInto(detail, doc.defaultView);
        }
        return root.dispatchEvent(new CustomEvent(event, {
            bubbles: true,
            detail: detail
        }));
    };

    $.open = GM_openInTab;

    // limit the rate the a function can fire at, so 
    // browser performance is maintained
    $.debounce = function(wait, func) {
        var args = null;
        var lastCall = 0;
        var timeout = null;
        var that = null;
        var exec = function() {
            lastCall = Date.now();
            return func.apply(that, args);
        };
        return function() {
            args = arguments;
            that = this;
            // if enough time has passed exec the function
            if (lastCall < Date.now() - wait) {
                return exec();
            }
            clearTimeout(timeout);
            timeout = setTimeout(exec, wait);
            return timeout;
        };
    };

    // create a queue of tasks to execute when possible
    $.taskQueue = (function() {
        var queue = [];
        // function to execute the next task in queue
        var execTask = function() {
            var task = queue.shift(); // pop the next task!
            //  task = [function, arg1, arg2, ...]

            // read the task's base function
            var func = task[0];
            // get the task's function args (everything starting at task[1])
            var args = Array.prototype.slice.call(task, 1);

            // do the task
            return func.apply(func, args);
        };

        // window.MessageChannel is for intra- and inter-window communication.
        // http://www.w3.org/TR/webmessaging/
        if (window.MessageChannel) { // check if MessageChannels are supported
            // create a new message channel
            var taskChannel = new MessageChannel();
            // execute the task when port1 receives a message
            taskChannel.port1.onmessage = execTask;
            return function() {
                // push the function into the queue
                queue.push(arguments);
                // send a message to port1 to trigger the function
                return taskChannel.port2.postMessage(null);
            };
        } else {
            return function() {
                // if MessageChannels aren't supported then add the function
                // to the queue and exec
                queue.push(arguments);
                return setTimeout(execTask, 0);
            };
        }
    })();

    // create a JSON from key/val pair
    $.item = function(key, val) {
        var item = {};
        item[key] = val;
        return item;
    };

    $.syncing = {}; // list of functions to keep values synchronized

    // create a callback to keep a value updated
    $.sync = function(key, callback) {
        key = info.namespace + key;
        $.syncing[key] = callback;
        // back up the previous key value from localStorage
        Storage[key] = localStorage.getItem(key);
        return Storage[key];
    };

    // create an event to synchronize settings changes
    (function() {
        var onChange = function(key) {
            var callback;
            // check if there's a method to sync the key
            if (!(callback = $.syncing[key])) {
                return; // no method
            }
            // get the new value, and if it's the same don't bother with changes
            var newValue = GM_getValue(key);
            if (newValue === Storage[key]) {
                return;
            }
            // if we didn't delete the value record the change
            if (newValue !== null) {
                Storage[key] = newValue;
                return callback(JSON.parse(newValue), key);
            } else {
                delete Storage[key];
                return callback(void 0, key);
            }
        };
        $.on(window, 'storage', function(arg) {
            var key = arg.key;
            return onChange(key);
        });
        return $.forceSync = function(key) {
            return onChange(info.namespace + key);
        };
    })();

    // stop syncing a value
    $.desync = function(key) {
        return delete $.syncing[info.namespace + key];
    };

    // remove data from localStorage
    $["delete"] = function(keys) {
        if (!(keys instanceof Array)) { // we'll want an array
            keys = [keys];
        }
        // delete each key:
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            key = info.namespace + key; // key names are prefixed with 'VES.'
            // purge the key's data
            localStorage.removeItem(key);
            GM_deleteValue(key);
        }
    };

    // get values out of localStorage, and perform an
    // action using them with the callback. 'items' (whatever matches 'key')
    // can be used as the argument in the callback.
    $.get = function(key, val, callback) {
    //   OR function(key, callback), if val isn't specified
        var items;
        // if val is specified then we're looking for the specific instance of
        // 'key' with value 'val'
        if (typeof callback === 'function') {
            items = $.item(key, val);
        } else { // if val isn't specified get every entry with the key
            items = key;
            callback = val;
        }
        // add a task to the queue with the callback we want to perform
        return $.taskQueue(function() {
            for (key in items) {
                val = localStorage.getItem(info.namespace + key);
                if (val) {
                    items[key] = JSON.parse(val);
                }
            }
            return callback(items);
        });
    };

    // set values to localStorage.
    $.set = (function() {
        var set = function(key, val) {
            key = info.namespace + key;
            val = JSON.stringify(val);
            if (key in $.syncing) {
                localStorage.setItem(key, val);
            }
            return GM_setValue(key, val);
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

    // delete ALL everything associated with VES from storage
    $.clear = function(callback) {
        // TODO
        return typeof callback === "function" ? callback() : void 0;
    };

    // remove a single value val from an array
    $.remove = function(array, val) {
        var i = array.indexOf(val);
        // if the value isn't found return false
        if (i === -1) return false;

        // remove the value (which was found at array[i])
        array.splice(i, 1); // array.splice(indexToRemove, removeHowMany)
        return true;
    };
// }}}

var escape, safeJSON; // Array.prototype.indexOf
// {{{
    // check for the index of val, and if i 
    // start checking at index i
    Array.prototype.indexOf = function(val, i) {
        if (!i) i = 0;
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

// register the OS, browser, and so on.
var System = {
    init: function() {
        this.browser = this.searchString(this.dataBrowser) || "unknown browser";
        this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "unknown version";
        this.OS = this.searchString(this.dataOS) || "unknown OS";
        this.storage = this.localStorageTest();
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
    ],
    // return whether or not we can store data
    localStorageTest: function() {
        test = 'test';
        try {
            // GM_set/deleteValue falls back to localStorage
            GM_setValue(info.namespace + test, test);
            GM_deleteValue(info.namespace + test);
            return true;
        } catch (e) {
            console.error('Setting a value to storage failed. Are you in a private session?');
            return false;
        }
    }
};
System.init();


// keycodes
var KEY = {
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
    NUMPAD_ENTER: 108,
    COMMA: 188
};


var Storage = {};
function setUpStorage() {
    /**
        This init function is for defining anything browser-specific needed for
        manipulating localStorage or -monkey storage.
    **/
    if (typeof(unsafeWindow) !== 'undefined') localStorage = unsafeWindow.localStorage;
    if (!(System.storage)) {
        cli.error('Browser storage is unreachable. Are you in a private session?');
    }
}


// common utils/functions for modules
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

        var excludesPageType = excludes.length && (Utils.isPageType.apply(Utils, excludes) || Utils.matchesPageRegex.apply(Utils, excludes));
        if (!excludesPageType) {
            var includesPageType = !includes.length || Utils.isPageType.apply(Utils, includes) || Utils.matchesPageRegex.apply(Utils, includes);
            return includesPageType;
        }
    },
    pageType: function() {
        if (typeof this.pageTypeSaved === 'undefined') {
            var pageType = '';
            var currURL = location.href;
            if (Utils.regexes.profile.test(currURL)) {
                pageType = 'profile';
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
    getURLParams: function() {
        var result = {}, queryString = location.search.substring(1),
            re = /([^&=]+)=([^&]*)/g, m = re.exec(queryString);
        while (m) {
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
        // search the VES stylesheet link URL for 'Dark'
        this.isDarkModeCached = document.getElementsByTagName('link')[1].href.indexOf('Dark') > -1;
        return this.isDarkModeCached;
    },
};

// getters/setters for VES options
$.extend(Utils, {
    resetModulePrefs: function() {
        prefs = {
            'debug': true,
            'hideChildComments': true,
            'voatingNeverEnds': false,
            'singleClick': true,
            'searchHelper': false,
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
            localStorage.setItem(info.namespace + 'modulePrefs', JSON.stringify(prefs));
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
        Utils.saveModuleOptions(moduleID, thisOptions);
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
       localStorage.setItem(info.namespace + moduleID, JSON.stringify(minify(Modules[moduleID].options)));
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
                Utils.saveModuleOptions(moduleID);
            }
        } else {
            // nothing in localStorage, let's set the defaults...
            Utils.saveModuleOptions(moduleID);
        }
        this.getOptionsFirstRun[moduleID] = true;
        return Modules[moduleID].options;
    },
    /*getOptions: function(moduleID) {
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
    }, */
    "export": function() {
        var settings = Storage;
        return $.get(settings, function(settings) {
            return Settings.downloadExport('Settings', {
                version: info.version,
                date: Date.now(),
                settings: settings
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
});


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
        // new options format:
        //'Log System Info': [true, 'Print system information to the console. Helps when submitting bug reports.'],
        //'Print localStorage': [true, 'Print the contents of localStorage to the console on each page.']
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

            $.asap((function() {
                return doc.body;
            }), function() {
                var footer = $('.footer div', doc);
                $.add(footer, separator);
                $.add(footer, link);
            });
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
        cli.log('localStorage data...');
        for (var key in localStorage) {
            cli.log(key + ':');
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
        // new options format
        //'Auto Hide Child Comments': [false, 'Automatically hide all child comments on page load.'],
    },
    include: [
        'comments'
    ],
    isEnabled: function() {
        return Utils.getModulePrefs(this.moduleID);
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
            commentContainers = j(obj).closest('.thread');
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
        // new options format:
        //'Open Order': ['commentsfirst', 'The order to open the link and comments.' ['commentsfirst', 'linkfirst']],
        //'Hide [l=c]': [false, 'Hide the [l=c] on self/text posts']
    },
    isEnabled: function() {
        return Utils.getModulePrefs(this.moduleID);
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
            if (Utils.isDarkMode()) {
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
            //Utils.watchForElement('sitetable', Modules.singleClick.applyLinks);
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

        // new options format:
        //'Auto Search Current Subverse': [true, 'Search the current subverse by default when using the search box.']
    },
    isEnabled: function() {
        return Utils.getModulePrefs(this.moduleID);
    },
    // include: [
    // ],
    isMatchURL: function() {
        // return Utils.isMatchURL(this.moduleID);
        return true;
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            //var searchExpando;
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
            //             subverse = (srMatch) ? srMatch[1] : Utils.currentSubverse(),
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
        var restrictSearch = j('form[action="/search"] > input#l');
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
        // new options format:
        //'Hard Ignore': [false, 'When on, the ignored user\'s entire post is hidden, not just the title.'],
    },
    isEnabled: function() {
        return Utils.getModulePrefs(this.moduleID);
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
        // new options format:
        //'Full Voat': [false, 'Make Voat use the device\'s full width'],
        //'Pin Header': ['none', 'Pin Voat elements to the page top when scrolling.', ['none', 'sub', 'header']]
    },
    include: [
        'all'
    ],
    isEnabled: function() {
        return Utils.getModulePrefs(this.moduleID);
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
        spacer.style.height = $('#header').outerHeight() + 'px';

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


(function() {
    var VES;

    /**
        VES needs to go through and first load ALL of the modules' defaults in order
        to make sure that no new options (after an update) are left out of storage.
        This will also account for when VES is run for the first time.
        After all the defaults are loaded, $.extend the loaded defaults and replace 
        all the values with whatever the user's settings are (from localStorage). 
        THEN we can start preloading the modules and running them.
    **/

    setUpStorage();

    VES = { // for the extension itself
        init: function() {
            Utils.resetModulePrefs();

            /*
                This is where we load options. To make sure we get everything, 
                check the saved configs and see if we're running a newer version
                of VES than we had previously. If it's newer, load the old
                stuff, extend it with the new, and load the old stuff again.
                Then look at the defaults for the list of all modules, and load
                them if the user has them enabled.
            */

            // load a user's saved settings
            return $.get(Storage, function(items) { // get saved Settings
                // extend and replace the loaded defaults
                $.extend(Storage, items);
                
                debugger;

                // start loading the modules once <head> can be found
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
            // run the modules' .go() function ASAP
            // often, the document body is not available yet, so wait
            $.asap((function() {
                return doc.body;
            }), function() {
                for (module in Modules) {
                    if (typeof Modules[module] === 'object') {
                        try {
                            Modules[module].go();
                        } catch (e) { // if one module breaks don't kill everything
                            cli.log('\"' + Modules[module].moduleName + '\" initialization crashed!');
                            cli.log(e.name + ': ' + e.message);
                        }
                    }
                }
            });
            // inject the CSS from all the modules
            $.addStyle(Utils.css, 'VESStyles');
        }
    };
    VES.init();

}).call(this);
