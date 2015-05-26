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

var Modules, Config;

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

    GM_registerMenuCommand = function(name, funk) {
    //todo
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

Config = {
    main: {
        'Modules': {
            'debug': [true, 'Diagnostic tools for VES. Useful for submitting issues to GitHub!'],
            'Hide Child Comments': [true, 'Allows you to hide all child comments for easier reading.'],
            'Single Click': [true, 'Adds an [l+c] link that opens both the link and the comments page in new tabs.'],
            'Search Helper': [true, 'Makes searching through Voat a bit easier.'],
            'filterVoat': [false, 'Filter out links by keyword, domain (use User Tagger to ignore by user) or subverse (for /v/all).'],
            'voatingNeverEnds': [false, 'Load the next pages of Voat automatically.']
        },
    },
};


var safeJSON = function(data, storageSource, silent) {
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

// common utils for modules
var VESUtils = {
    // TODO rearrange these utils logically
    css: '',    // CSS for ALL of VES's modules
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
        return VESUtils.regexes.all.test(currURL);
    },
    isMatchURL: function(moduleID) {
        if (!VESUtils.isVoat()) {
            return false;
        }
        var module = Modules[moduleID];
        if (!module) {
            console.warn("isMatchURL could not find module", moduleID);
            return false;
        }

        var exclude = module.exclude,
            include = module.include;
        return VESUtils.matchesPageLocation(include, exclude);
    },
    matchesPageLocation: function(includes, excludes) {
        includes = typeof includes === 'undefined' ? [] : [].concat(includes);
        excludes = typeof excludes === 'undefined' ? [] : [].concat(excludes);

        var excludesPageType = excludes.length && (VESUtils.isPageType.apply(VESUtils, excludes) || VESUtils.matchesPageRegex.apply(VESUtils, excludes));
        if (!excludesPageType) {
            var includesPageType = !includes.length || VESUtils.isPageType.apply(VESUtils, includes) || VESUtils.matchesPageRegex.apply(VESUtils, includes);
            return includesPageType;
        }
    },
    pageType: function() {
        if (typeof this.pageTypeSaved === 'undefined') {
            var pageType = '';
            var currURL = location.href;
            if (VESUtils.regexes.profile.test(currURL)) {
                pageType = 'profile';
            } else if (VESUtils.regexes.comments.test(currURL)) {
                pageType = 'comments';
            } else if (VESUtils.regexes.inbox.test(currURL)) {
                pageType = 'inbox';
            } else if (VESUtils.regexes.submit.test(currURL)) {
                pageType = 'submit';
            } else if (VESUtils.regexes.subverse.test(currURL)) {
                pageType = 'subverse';
            } else {
                pageType = 'linklist';
            }
            this.pageTypeSaved = pageType;
        }
        return this.pageTypeSaved;
    },
    isPageType: function(/*type1, type2*/) {
        var thisPage = VESUtils.pageType();
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
            var match = location.href.match(VESUtils.regexes.subverse);
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
    
    // adds vendor prefixes to CSS snippits.
    cssVendorPrefix: function(css) {
        return '-webkit-' + css + ';' + '-o-' + css + ';' + '-moz-' + css + ';' + '-ms-' + css + ';' + css + ';';
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
    isEmpty: function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) return false;
        }
        return true;
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
        // save it to the object and to RESStorage
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
        VESStorage.setItem('RESoptions.' + moduleID, JSON.stringify(minify(Modules[moduleID].options)));
    },
    getOptionsFirstRun: [],
    getOptions: function(moduleID) {
        if (this.getOptionsFirstRun[moduleID]) {
            // we've already grabbed these out of localstorage, so modifications should be done in memory. just return that object.
            return Modules[moduleID].options;
        }
        var thisOptions = localStorage.getItem('VESoptions.' + moduleID);
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
                var matchValue = RESUtils.firstValid(valueIdentifiers[fi], valueIdentifiers[field.name]);

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

// TODO hardcoded extension settings

(function(u) {  // define all the variables up here
    var $, $$, doc, cli, info, Conf, VES, System, CustomCSS, escape, safeJSON, Settings,
        __slice = [].slice,
        __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    Array.prototype.indexOf = function(val, i) {
        var length;
        i || (i = 0);
        length = this.length;
        while (i < length) {
            if (this[i] === val) {
                return i;
            }
            i++;
        }
        return -1;
    };

    doc = document;
    cli = console;

    info = {
        v: '0.1.0',
        namespace: 'VES.',
        name: 'Voat Enhancement Suite',
        abbr: 'VES'
    };

    Conf = {}; // loaded configs

    System = {
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

    escape = (function() {
        var str = {
            '&': '&amp;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        };
        var r = String.prototype.replace;
        var regex = /[&"'<>]/g;
        fn = function(x) {
            return str[x];
        };
        return function(text) {
            return r.call(text, regex, fn);
        };
    })();

// {{{  make a sorta-jQuery lib, http://api.jquery.com/
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

    $.fragment = function() {
        return doc.createDocumentFragment();
    };
    $.nodes = function(nodes) {
        // if just one node return it
        if (!(nodes instanceof Array)) {
            return nodes;
        }
        // if theres a bunch, create a new section of document
        frag = $.fragment();
        for (var i = 0, len = nodes.length; i < len; i++) {
            node = nodes[i];
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
        return $.oldValue[key] = GM_getValue(key);
    };

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
                if (val = GM_getValue(info.namespace + key)) {
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
            return GM_setValue(key, val);
        };
        return function(keys, val) {
            var key;
            if (typeof keys === 'string') {
                set(keys, val);
                return;
            }
            for (key in keys) {
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

    Modules = {};
// {{{  Modules.*
    Modules.debug = {
        moduleID: 'debug',
        moduleName: 'VES Debugger',
        description: 'VES analytics for debugging.',
        isEnabled: function() {
            // technically cheating
            return true;
        },
        include: [
            'all'
        ],
        isMatchURL: function() {
            return VESUtils.isMatchURL(this.moduleID);
        },
        go: function() {
            if ((this.isEnabled()) && (this.isMatchURL())) {
                // do some basic logging.
                cli.log('VES loaded: ' + Date());
                cli.log('OS: ' + System.OS);
                cli.log('browser: ' + System.browser + ' ' + System.version);
                // console.log('loggedInUser: ' + VESUtils.loggedInUser());
                // console.log('pageType: ' + VESUtils.pageType());
                // console.log('subverse: ' + VESUtils.currentSubverse());
                // add a link to VES in the footer
                var separator = $.el('span', {
                    className: 'separator',
                });
                var link = $.el('a', {
                    href: 'http://github.com/travis-g/Voat-Enhancement-Suite',
                    innerHTML: 'VES'
                });
                var footer = doc.querySelector('.footer div');
                $.add(footer, separator);
                $.add(footer, link);
            }
        },
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
            return VESUtils.isMatchURL(this.moduleID);
        },
        go: function() {
            if ((this.isEnabled()) && (this.isMatchURL())) {
                // begin creating the OP's 'hide child comments' button
                var toggleButton = document.createElement('li');
                this.toggleAllLink = document.createElement('a');
                this.toggleAllLink.textContent = 'hide all child comments';
                this.toggleAllLink.setAttribute('action', 'hide');
                this.toggleAllLink.setAttribute('href', '#');
                this.toggleAllLink.setAttribute('title', 'Show only replies to original poster.');
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
                toggleButton.appendChild(this.toggleAllLink);
                var commentMenu = document.querySelector('ul.buttons');
                if (commentMenu) {
                    // add the post's toggle
                    commentMenu.appendChild(toggleButton);
                    // get the comments of every top-level comment
                    // there's no parent element that groups every root comment's comments, so we'll need to get them all
                    var rootComments = document.querySelectorAll('div.commentarea > div.sitetable > div.thread');
                    // for every root comment add a hide child elements link
                    for (var i = 0, len = rootComments.length; i < len; i++) {
                        toggleButton = document.createElement('li');
                        var toggleLink = document.createElement('a');
                        toggleLink.textContent = 'hide child comments';
                        toggleLink.setAttribute('action', 'hide');
                        toggleLink.setAttribute('href', '#');
                        toggleLink.setAttribute('class', 'toggleChildren');
                        toggleLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            Modules.hideChildComments.toggleComments(this.getAttribute('action'), this);
                        }, true);
                        toggleButton.appendChild(toggleLink);
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
                            VESUtils.click(this.toggleAllLink);
                        }
                    }
                }
            }
        },
        toggleComments: function(action, obj) {
            var commentContainers;
            if (obj) { // toggle a single comment tree
                commentContainers = $(obj).closest('.thread');
            } else { // toggle all comments
                console.log('getting all comments...');
                commentContainers = document.querySelectorAll('div.commentarea > div.sitetable > div.thread');
            }
            for (var i = 0, len = commentContainers.length; i < len; i++) {
                // get the children under comment i
                var thisChildren = commentContainers[i].querySelectorAll('div.child');
                var numChildren = thisChildren.length;
                // get the root comment's "hide your kids" link
                var thisToggleLink = commentContainers[i].querySelector('a.toggleChildren');
                if (thisToggleLink !== null) {
                    // for each child in thisChildren either hide it or show it
                    for (var x = 0, y = thisChildren.length; x < y; x++) {
                        if (action === 'hide') {
                            // Voat's already got a .hidden class, use that
                            thisChildren[x].classList.add('hidden');
                            thisToggleLink.innerHTML = 'show child comments';
                            thisToggleLink.setAttribute('action', 'show');
                        } else {
                            thisChildren[x].classList.remove('hidden');
                            thisToggleLink.innerHTML = 'hide child comments';
                            thisToggleLink.setAttribute('action', 'hide');
                        }
                    }
                }
            }
        }
    };
    Modules.voatingNeverEnds = {
        moduleID: 'voatingNeverEnds',
        moduleName: 'Voating Never Ends',
        description: 'Load the next page of Voat automatically.',
        options: {
            autoLoad: {
                value: true,
                description: 'Autoload next page on scroll (click to load if off)'
            },
            fadeDuplicates: {
                value: true,
                description: 'Fade any duplicate entries'
            }
        },
        isEnabled: function() {
            return VESUtils.options.getModulePrefs(this.moduleID);
        },
        include: [
            'all'
        ],
        exclude: [
            'comments'
        ],
        isMatchURL: function() {
            return VESUtils.isMatchURL(this.moduleID);
        },
        go: function() {
            if ((this.isEnabled()) && (this.isMatchURL())) {
                if (typeof(Modules.voatingNeverEnds.dupeHash) == 'undefined') Modules.voatingNeverEnds.dupeHash = {};
                var entries = document.body.querySelectorAll('a.comments');
                for (var i = entries.length - 1; i > -1; i--) {
                    Modules.voatingNeverEnds.dupeHash[entries[i].href] = 1;
                }

                VESUtils.addCSS('#VNEloadmorebutton {}');

                this.allLinks = document.body.querySelectorAll('.sitetable div.submission');
                switch (this.options.hideDupes.value) {
                    case 'fade':
                        VESUtils.addCSS('.VNEdupe { opacity: 0.3 }');
                        break;
                    case 'hide':
                        VESUtils.addCSS('.VNEdupe { display: none }');
                        break;
                }
                VESUtils.addCSS('#loadingIndicator {}');
                var nextPrevLinks = Modules.voatingNeverEnds.getNextPrevLinks();
                if (nextPrevLinks) {
                    var nextLink = nextPrevLinks.next;
                    if (nextLink) {
                        this.nextPageURL = nextLink.getAttribute('href');
                        // var nextXY
                        // this.nextPageScrollY

                        // this.attachLoaderWidget();
                    }
                    // TODO watch if they're returning
                    if (this.options.returnToPrevPage.value) {
                        this.returnToPrevPageCheck(location.hash);
                    }

                    // watch for scrolling to the page's end
                    if (this.options.autoLoad.value && nextLink) {
                        window.addEventListener('scroll', VESUtils.debounce.bind(VESUtils, 'scroll.voatingNeverEnds', 300, Modules.voatingNeverEnds.handleScroll), false);
                    }

                }
                // TODO check for mail
            }
        },
        pageMarkers: [], // page separators
        pageURLs: [],
        // TODO togglePause: function() {},
        // TODO returnToPrevPageCheck: function(hash) {},
        handleScroll: function(e) {
            var thisPageNum = 1;

            for (var i = 0, len = Modules.voatingNeverEnds.pageMarkers.length; i<len; i++) {
                var thisXY = VESUtils.getXYpos(Modules.voatingNeverEnds.pageMarkers[i]);
                if (thisXY.y < window.pageYOffset) {
                    thisPageNum = Modules.voatingNeverEnds.pageMarkers[i].getAttribute('id').replace('page-','');
                } else {
                    break;
                }
            }
            var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubverse();
            console.log("thisPageType: " + thisPageType);
            VESStorage.setItem('VESmodules.voatingNeverEnds.lastPage.'+thisPageType, Modules.voatingNeverEnds.pageURLs[thisPageNum]);
            var urlParams = VESUtils.getURLParams();
            if (thisPageNum != urlParams.VNEpage) {
                if (thisPageNum > 1) {
                    urlParams.VNEpage = thisPageNum;
                    Modules.voatingNeverEnds.pastFirstPage = true;
                } else {
                    urlParams.VNEpage = null;
                }
                if (Modules.voatingNeverEnds.pastFirstPage) {
                    var qs = '?';
                    var count = 0;
                    var and = '';
                    for (i in urlParams) {
                        count++;
                        if (urlParams[i] !== null) {
                            if (count == 2) and = '&';
                            qs += and+i+'='+urlParams[i];
                        }
                    }
                    // delete query parameters if there are none to display so we don't just show a ?
                    if (qs == '?') {
                        qs = location.pathname;
                    }
                    window.history.replaceState(thisPageNum, "thepage="+thisPageNum, qs);
                }
            }
            if (Modules.voatingNeverEnds.fromBackButton !== true) {
                for (var i=0, len=Modules.voatingNeverEnds.allLinks.length; i<len; i++) {
                    if (VESUtils.elementInViewport(Modules.voatingNeverEnds.allLinks[i])) {
                        var thisClassString = Modules.voatingNeverEnds.allLinks[i].getAttribute('class');
                        var thisClass = thisClassString.match(/id-t[\d]_[\w]+/);
                        if (thisClass) {
                            var thisID = thisClass[0];
                            var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubverse();
                            VESStorage.setItem('VESmodules.voatingNeverEnds.lastVisibleIndex.'+thisPageType, thisID);
                            break;
                        }
                    }
                }
            }
            if ((VESUtils.elementInViewport(Modules.voatingNeverEnds.loadingIndicator)) && (Modules.voatingNeverEnds.fromBackButton !== true)) {
                if (Modules.voatingNeverEnds.isPaused !== true) {
                    Modules.voatingNeverEnds.loadNewPage();
                }
            }
        },
        getNextPrevLinks: function(e) {
            e = e || document.body;
            var links = {
                next: e.querySelector('.content .pagination-container a[rel~=next]'),
                prev: e.querySelector('.content .pagination-container a[rel~=prev]'),
            };

            if (!(links.next || links.prev)) links = false;
            return links;
        },
        duplicateCheck: function(newHTML){
            var newLinks = newHTML.querySelectorAll('div.link');
            for(var i = newLinks.length - 1; i > -1; i--) {
                var newLink = newLinks[i];
                var thisCommentLink = newLink.querySelector('a.comments').href;
                if( Modules.voatingNeverEnds.dupeHash[thisCommentLink] ) {
                    // console.log('found a dupe: ' + newLink.querySelector('a.title').innerHTML);
                  // let's not remove it altogether, but instead dim it...
                  // newLink.parentElement.removeChild(newLink);
                  addClass(newLink, 'VNEdupe');
                } else {
                    Modules.voatingNeverEnds.dupeHash[thisCommentLink] = 1;
                }
            }
            return newHTML;
        },
        attachLoaderWidget: function() {
            // add a widget at the bottom that will be used to detect that we've scrolled to the bottom, and will also serve as a "loading" bar...
            this.loadingIndicator = document.createElement('a');
            this.loadingIndicator.innerHTML = 'Voating Never Ends... [load more ▼]';
            this.loadingIndicator.id = 'loadingIndicator';
            this.loadingIndicator.className = 'btn-whoaverse btn-block voatingNeverEnds';
            this.loadingIndicator.addEventListener('click', function(e) {
                e.preventDefault();
                Modules.voatingNeverEnds.loadNewPage();
            }, false);
            insertAfter(this.siteTable, this.loadingIndicator);
        },
        loadNewPage: function(fromBackButton, reload) {
            var me = Modules.voatingNeverEnds;
            if (fromBackButton) {
                // TODO
            } else {
                this.fromBackButton = false;
            }
            if (this.isLoading !== true) {
                this.loadingIndicator.removeEventListener('click', me.loadNewPage, false);
                this.loadingIndicator.innerHTML = 'Sit tight...';
                this.isLoading = true;
                GM_xmlhttpRequest({
                    method: "GET",
                    url:    this.nextPageURL,
                    onload: function(response) {
                        if ((typeof(me.loadingIndicator.parentNode) != 'undefined') && (me.loadingIndicator.parentNode !== null)) {
                            me.loadingIndicator.parentNode.removeChild(me.loadingIndicator);
                        }
                        var thisHTML = response.responseText;
                        var tempDiv = document.createElement('div');
                        // clear javascript from tempDiv
                        tempDiv.innerHTML = thisHTML.replace(/<script(.|\s)*?\/script>/g, '');
                        // get the sitetable
                        var newHTML = tempDiv.querySelector('.sitetable');
                        if (newHTML) {
                            var stMultiCheck = tempDiv.querySelectorAll('.sitetable');
                            if (stMultiCheck.length == 2) {
                                console.log('Skipped a sitetable');
                                newHTML = stMultiCheck[1];
                            }
                            newHTML.setAttribute('ID','sitetable-'+me.currPage+1);
                            me.duplicateCheck(newHTML);
                            // check for new mail?
                            // load other post-modifying modules
                            if ((nextPrevLinks) && (nextPrevLinks.length)) {
                                if (isNaN(me.currPage)) me.currPage = 1;
                                if (!fromBackButton) me.currPage++;
                                if ((!(me.fromBackButton)) && (me.options.returnToPrevPage.value)) {
                                    me.pageURLs[me.currPage] = me.nextPageURL;
                                    var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubverse();
                                    VESStorage.setItem('VESmodules.voatingNeverEnds.lastPage.'+thisPageType, me.nextPageURL);
                                    // let's not change the hash anymore now that we're doing it on scroll.
                                    // location.hash = 'page='+me.currPage;
                                }
                                var nextLink = nextPrevLinks[nextPrevLinks.length-1];
                                var pageMarker = createElementWithID('div','page-'+me.currPage);
                                addClass(pageMarker,'NERPageMarker');
                                pageMarker.innerHTML = 'Page ' + me.currPage;
                                me.siteTable.appendChild(pageMarker);
                                me.pageMarkers.push(pageMarker);
                                me.siteTable.appendChild(newHTML);
                                me.isLoading = false;
                                if (nextLink) {
                                    // console.log(nextLink);
                                    if (nextLink.getAttribute('rel').indexOf('prev') != -1) {
                                        // remove the progress indicator from the DOM, it needs to go away.
                                        me.progressIndicator.style.display = 'none';
                                        var endOfVoat = createElementWithID('div','endOfVoat');
                                        endOfVoat.innerHTML = 'You\'ve reached the last page available.  There are no more pages to load.';
                                        me.siteTable.appendChild(endOfVoat);
                                        window.removeEventListener('scroll', me.handleScroll, false);
                                    }else {
                                        // console.log('not over yet');
                                        me.nextPageURL = nextLink.getAttribute('href');
                                    }
                                }
                                me.allLinks = document.body.querySelectorAll('#siteTable div.thing');
                                if ((fromBackButton) && (me.options.returnToPrevPage.value)) {
                                    me.modalWidget.style.display = 'none';
                                    me.modalContent.style.display = 'none';
                                    // window.scrollTo(0,0)
                                    // VESUtils.scrollTo(0,me.nextPageScrollY);
                                    var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubverse();
                                    var lastTopScrolledID = VESStorage.getItem('VESmodules.voatingNeverEnds.lastVisibleIndex.'+thisPageType);
                                    var lastTopScrolledEle = document.body.querySelector('.'+lastTopScrolledID);
                                    if (!lastTopScrolledEle) {
                                       lastTopScrolledEle = newHTML.querySelector('.sitetable div.thread');
                                    }
                                    thisXY=VESUtils.getXYpos(lastTopScrolledEle);
                                    VESUtils.scrollTo(0, thisXY.y);
                                    me.fromBackButton = false;
                                }
                            } else {
                                me.VNEFail();
                            }
                        } else {
                            var noresults = tempDiv.querySelector('#noresults');
                            var noresultsfound = (noresults) ? true : false;
                            me.VNEFail(noresultsfound);
                        }
                    },
                    onerror: function(err) {
                        me.VNEFail();
                    }
                });
            } else {
                console.log("load new page ignored");
            }
        },
        VNEFail: function(noresults) {
            Modules.voatingNeverEnds.isLoading = false;
            var newHTML = createElementWithID('div','VNEFail');
            if (noresults) {
                newHTML.innerHTML = 'Voat says there\'s nothing here.';
            } else {
                console.log('Voat didn\'t give a response, it may be under heavy load.');
            }
            Modules.voatingNeverEnds.siteTable.appendChild(newHTML);
        },
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
            return VESUtils.isMatchURL(this.moduleID);
        },
        go: function() {
            //if ((this.isMatchURL())) {    // force run
            if ((this.isEnabled()) && (this.isMatchURL())) {
                this.applyLinks();
                if (VESUtils.isDarkMode()) {
                    VESUtils.addCSS('.VESSingleClick { color: #bcbcbc; font-weight: bold; cursor: pointer; }');
                    VESUtils.addCSS('.VESSingleClick:hover { text-decoration: underline }');
                } else {
                    VESUtils.addCSS('.VESSingleClick { color: #6a6a6a; font-weight: bold; cursor: pointer; }');
                    VESUtils.addCSS('.VESSingleClick:hover {text-decoration: underline }');
                }
                // watch for changes to .sitetable, then reapply
                //VESUtils.watchForElement('sitetable', Modules.singleClick.applyLinks);
                document.body.addEventListener('DOMNodeInserted', function(event) {
                    if ((event.target.tagName == 'DIV') && (event.target.getAttribute('class') == 'sitetable')) {
                        Modules.singleClick.applyLinks();
                    }
                }, true);
            }
        },
        applyLinks: function(ele) {
            ele = ele || document;
            var entries = ele.querySelectorAll('.sitetable>.submission .entry'); // beware of .alert-featuredsub!
            for (var i = 0, len = entries.length; i < len; i++) {
                if ((typeof entries[i] !== 'undefined') && (!entries[i].classList.contains('lcTagged'))) {
                    entries[i].classList.add('lcTagged');
                    this.titleLA = entries[i].querySelector('A.title');
                    if (this.titleLA !== null) {
                        var thisLink = this.titleLA.href;
                        // check if it's a relative path (no http://)
                        if (!(thisLink.match(/^http/i))) {
                            thisLink = 'http://' + document.domain + thisLink;
                        }
                        //console.log("thisLink -- " + thisLink);
                        var thisComments = (thisComments = entries[i].querySelector('.comments')) && thisComments.href;
                        //console.log("thisComments -- " + thisComments);
                        var thisUL = entries[i].querySelector('ul.flat-list');
                        var singleClickLI = document.createElement('li');
                        var singleClickLink = document.createElement('a');
                        singleClickLink.setAttribute('class','VESSingleClick');
                        singleClickLink.setAttribute('thisLink',thisLink);
                        singleClickLink.setAttribute('thisComments',thisComments);
                        if (thisLink != thisComments) {
                            singleClickLink.innerHTML = '[l+c]';
                        } else if (!(this.options.hideLEC.value)) {
                            singleClickLink.innerHTML = '[l=c]';
                        }
                        singleClickLI.appendChild(singleClickLink);
                        thisUL.appendChild(singleClickLI);
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
            // return VESUtils.isMatchURL(this.moduleID);
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
                //         VESUtils.addCSS('#searchexpando .searchexpando-submit { text-align:center; }');
                //         var submitDiv = '<div class="searchexpando-submit"><button type="submit">search</button></div>';
                //         $(searchExpando).append(submitDiv);
                //     }
                // }
                // if (this.options.toggleSearchOptions.value && VESUtils.regexes.search.test(location.href)) {
                //     VESUtils.addCSS('.searchpane-toggle-hide { float: right; margin-top: -1em } .searchpane-toggle-show { float: right; } .searchpane-toggle-show:after { content:"\u25BC"; margin-left:2px; }.searchpane-toggle-hide:after { content: "\u25B2"; margin-left: 2px; }');
                //     if (this.options.hideSearchOptions.value || location.hash === '#ves-hide-options') {
                //         $('body').addClass('ves-hide-options');
                //     }
                //     VESUtils.addCSS('.ves-hide-options .search-summary, .ves-hide-options .searchpane, .ves-hide-options .searchfacets { display: none; } .ves-hide-options .searchpane-toggle-show { display: block; } .searchpane-toggle-show { display: none; }');
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
                //     VESUtils.addCSS('.ves-flairSearch { cursor: pointer; position: relative; } .linkflairlabel.ves-flairSearch a { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }');
                //     $('.sitetable').on('mouseenter', '.title > .linkflairlabel:not(.ves-flairSearch)', function(e) {
                //         var parent = $(e.target).closest('.thing')[0],
                //             srMatch = VESUtils.regexes.subverse.exec(parent.querySelector('.entry a.subverse')),
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
            var restrictSearch = document.body.querySelector('form[action="/search"] > input#l');
            if (restrictSearch && !document.head.querySelector('meta[content="search results"]')) { // prevent autochecking after searching with it unchecked
                restrictSearch.checked = true;
            }
        }
    };
    Modules.filterVoat = {
        moduleID: 'searchHelper',
        moduleName: 'Search Helper',
        category: [ 'Filters', 'Posts' ],
        description: 'Filter out links by keyword, domain (use User Tagger to ignore by user) or subverse (for /v/all).',
        options: {
            excludeUserPages: {
                type: 'boolean',
                value: false,
                description: 'Don\'t filter anything on users\' profile pages'
            },
            regexpFilters: {
                type: 'boolean',
                value: true,
                advanced: true,
                description: 'Allow RegExp in certain filterVoat fields.' +
                    '<br>If you have filters which start with <code>/</code> and don\'t know what RegExp is, you should turn this option off.'
            },
            keywords: {
                type: 'table',
                addRowText: '+add filter',
                fields: [{
                        name: 'keyword',
                        type: 'text'
                    }, {
                        name: 'applyTo',
                        type: 'enum',
                        values: [{
                            name: 'Everywhere',
                            value: 'everywhere'
                        }, {
                            name: 'Everywhere but:',
                            value: 'exclude'
                        }, {
                            name: 'Only on:',
                            value: 'include'
                        }],
                        value: 'everywhere',
                        description: 'Apply filter to:'
                    },
                    {
                        name: 'subverses',
                        type: 'list',
                        listType: 'subverses'
                    },
                    {
                        name: 'unlessKeyword',
                        type: 'text'
                    },
                ],
                value: [],
                description: 'Hide posts with certain keywords in the title.' +
                    '\n\n<br><br>RegExp like <code>/(this|that|theother)/i</code> is allowed for keyword (but not unlessKeyword).'
            },
            subverses: {
                type: 'table',
                addRowText: '+add filter',
                fields: [{
                    name: 'subverse',
                    type: 'text'
                }],
                value: [],
                description: 'Hide posts submitted to certain subverses.' +
                    '\n\n<br><br>RegExp like <code>/(this|that|theother)/i</code> is allowed for subverse.'
            },
            filterSubversesFrom: {
                type: 'enum',
                value: 'everywhere-except-subverse',
                values: [{
                    name: 'Everywhere except inside a subverse',
                    value: 'everywhere-except-subverse'
                }, {
                    name: 'Everywhere',
                    value: 'everywhere'
                }, {
                    name: '/r/all',
                    value: 'legacy',
                }, ]
            },
            domains: {
                type: 'table',
                addRowText: '+add filter',
                fields: [{
                        name: 'keyword',
                        type: 'text'
                    }, {
                        name: 'applyTo',
                        type: 'enum',
                        values: [{
                            name: 'Everywhere',
                            value: 'everywhere'
                        }, {
                            name: 'Everywhere but:',
                            value: 'exclude'
                        }, {
                            name: 'Only on:',
                            value: 'include'
                        }],
                        value: 'everywhere',
                        description: 'Apply filter to:'
                    },
                    {
                        name: 'subverses',
                        type: 'list',
                        listType: 'subverses'
                    }
                ],
                value: [],
                description: 'Hide posts that link to certain domains.' +
                    '\n\n<br><br>Caution: domain keywords like "voat" would ignore "voat.com" and "foovoatbar.com".' +
                    '\n\n<br><br>RegExp like <code>/(this|that|theother)/i</code> is allowed for domain.'
            },
            flair: {
                type: 'table',
                addRowText: '+add filter',
                fields: [{
                        name: 'keyword',
                        type: 'text'
                    }, {
                        name: 'applyTo',
                        type: 'enum',
                        values: [{
                            name: 'Everywhere',
                            value: 'everywhere'
                        }, {
                            name: 'Everywhere but:',
                            value: 'exclude'
                        }, {
                            name: 'Only on:',
                            value: 'include'
                        }],
                        value: 'everywhere',
                        description: 'Apply filter to:'
                    },
                    {
                        name: 'subverses',
                        type: 'list',
                        listType: 'subverses'
                    }
                ],
                value: [],
                description: 'Hide in posts where certain keywords are in the post\'s link flair' +
                    '\n\n<br><br>RegExp like <code>/(this|that|theother)/i</code> is allowed for flair.'
            },   
        },
        isEnabled: function() {
            return VESUtils.options.getModulePrefs(this.moduleID);
        },
        include: [
            /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/?(?:\??[\w]+=[\w]+&?)*/i,
            /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/[\w]+\/?(?:\??[\w]+=[\w]+&?)*$/i
        ],
        excludeSaved: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/user\/[\w]+\/saved/i,
        excludeModqueue: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/[\-\w\.]+\/about\/(?:modqueue|reports|spam)\/?/i,
        isMatchURL: function() {
            // if (
            //     this.options.excludeModqueue.value && this.excludeModqueue.test(location.href) ||
            //     this.options.excludeUserPages.value && VESUtils.pageType() === 'profile'
            // ) {
            //     return false;
            // }

            return VESUtils.isMatchURL(this.moduleID);
        },
        beforeLoad: function() {
            if (this.isEnabled()) {
                VESUtils.addCSS('');
            }
        },
        go: function() {
            if ((this.isEnabled()) && (this.isMatchURL())) {
                VESUtils.addCSS('.VESFiltered { border: 1px solid red !important; }');
                //console.log('filterVoat is scanning for content.');
                this.scanEntries();
                VESUtils.watchForElement('sitetable', Modules.filterVoat.scanEntries);
            }
        },
        scanEntries: function(ele) {
            var numFiltered = 0;

            var entries;
            if (typeof ele === 'undefined' || ele === null) {
                // TODO if excludeCommentsPage
                entries = document.querySelectorAll('.sitetable .link');
            } else {
                entries = ele.querySelectorAll('div.submission.link');
            }
            var filterSubs = (Modules.filterVoat.options.filterSubversesFrom.value === 'everywhere') ||
                (Modules.filterVoat.options.filterSubversesFrom.value === 'everywhere-except-subverse' && !VESUtils.currentSubverse()) ||
                (VESUtils.currentSubverse('all')) /* TODO sets, Voat's domain... */,
                onSavedPage = Modules.filterVoat.excludeSaved.test && Modules.filterVoat.excludeSaved.test(location.href);

            for (var i = 0, len = entries.length; i < len; i++) {
                var postSubverse, currSub;
                if (!onSavedPage) {
                    var postTitle = entries[i].querySelector('.entry a.title').textContent;
                    var postDomain = entries[i].querySelector('.entry span.domain > a');
                    postDomain = (postDomain) ? postDomain.textContent.toLowerCase() : 'voat.co';
                    var postFlair = entries[i].querySelector('.entry span.linkflairlabel');
                    var thisSubverse = entries[i].querySelector('.entry a.subverse');
                    if (thisSubverse !== null) {
                        postSubverse = VESUtils.regexes.subverse.exec(thisSubverse.href)[1] || false;
                    } else {
                        postSubverse = VESUtils.currentSubverse();
                    }

                    var filtered = false;

                    if (!filtered) filtered = Modules.filterVoat.executeCustomFilters(entries[i]);

                    currSub = (VESUtils.currentSubverse()) ? VESUtils.currentSubverse().toLowerCase(): null;
                    if (!filtered) filtered = Modules.filterVoat.filterTitle(postTitle, postSubverse);
                    if (!filtered) filtered = Modules.filterVoat.filterDomain(postDomain, postSubverse || currSub);
                    if ((!filtered) && (filterSubs) && (postSubverse)) {
                        filtered = Modules.filterVoat.filterSubverse(postSubverse);
                    }
                    if ((!filtered) && (postFlair)) {
                        filtered = Modules.filterVoat.filterFlair(postFlair.textContent, postSubverse);
                    }
                    if (filtered) {
                        entries[i].classList.add('VESFiltered');
                        console.log('filterVoat hid an entry.');
                        numFiltered++;
                    }
                }
                // TODO does NSFW content even make it to the client?
                if (entries[i].classList.contains('over18')) {
                    if (Modules.filterVoat.allowNSFW(postSubverse, currSub)) {
                        entries[i].classList.add('allowOver18');
                    }
                    // else if NSFW filter allowed
                }
            }
            // TODO notify if a percentage of posts is hidden
        },
        filterNSFW: function(filterOn) {
            // voat hides all the NSFW stuff server-side.
            // I'm not sure how it marks the stuff that gets through...
        },
        filterDomain: function(domain, voat) {
            domain = domain ? domain.toLowerCase() : null;
            voat = voat ? voat.toLowerCase() : null;
            return this.filtersMatchString('domains', domain, voat);
        },
        filterTitle: function(title, voat) {
            voat = voat ? voat.toLowerCase() : null;
            return this.filtersMatchString('keywords', title.toLowerCase(), voat);
        },
        filterSubverse: function(subverse) {
            if (!this.filterFormatChecked) {
                this.checkFilterFormat();
            }
            return this.filtersMatchString('subverses', subverse.toLowerCase(), null, true);
        },
        filterFlair: function(flair, voat) {
            voat = voat ? voat.toLowerCase() : null;
            return this.filtersMatchString('flair', flair.toLowerCase(), voat);
        },
        checkFilterFormat: function() {
            var i = 0,
                len = this.options.subverses.value.length,
                changed = false,
                check;

            for (; i<len; i++) {
                check = this.options.subverses.value[i][0];
                if (check.substr(0,3) === '/v/') {
                    this.options.subverses.value[i][0] = check.substr(3);
                    changed = true;
                }
            }
            if (changed) {
                VESUtils.options.saveModuleOptions('filterVoat');
            }
            this.filterFormatChecked = true;
        },
        _filters: {},
        filters: function(type) {
            var module = Modules.filterVoat;
            var sources = module.options[type].value;
            if (!module._filters[type] || module._filters[type].length !== sources.length) {
                var filters = [];
                module._filters[type] = filters;

                for (var i = 0; i < sources.length; i++) {
                    var filter = {};
                    filters.push(filter);

                    var source = sources[i];
                    if (typeof source !== 'object') {
                        source = [ source ];
                    }

                    var searchString = source[0];
                    if (Modules.filterVoat.options.regexpFilters.value && Modules.filterVoat.regexRegex.test(searchString)) {
                        var regexp = Modules.filterVoat.regexRegex.exec(searchString);
                        try {
                            searchString = new RegExp(regexp[1], regexp[2]);
                        } catch(e) {
                            // notify user
                            console.log('Something went wrong with a RegExp in filterVoat.');
                            console.log('RegExp: ' + searchString);
                            console.log(e.toString());
                        }
                    } else {
                        searchString = searchString.toString().toLowerCase();
                    }
                    filter.searchString = searchString;

                    var applyTo = source[1] || 'everywhere';
                    filter.applyTo = applyTo;

                    var applyList = (source[2] || '').toLowerCase().split(',');
                    filter.applyList = applyList;

                    var exceptSearchString = source[3] && source[3].toString().toLowerCase() || '';
                    filter.exceptSearchString = exceptSearchString;
                }
            }

            return module._filters[type];
        },
        // allowAllNSFW: null,
        // subverseAllowNSFWOption: null,
        // allowNSFW: function(postSubvers, currentSubverse) {
        //     // I don't think we need this...
        // },
        regexRegex: /^\/(.*)\/([gim]+)?$/,  // RegEx to match a RegEx
        filtersMatchString: function(filterType, stringToSearch, voat, fullmatch) {
            var filters = Modules.filterVoat.filters(filterType);
            if (!filters || !filters.length) return false;
            if (!stringToSearch) {
                // means bad filter
                return;
            }
            var i = filters.length;
            var result = false;

            while (i--) {
                var filter = filters[i];
                var skipCheck = false;

                // are we checking /v/all?
                var checkVALL = ((VESUtils.currentSubverse() === 'all') && (filter.applyList.indexOf('all') !== -1));
                switch (filter.applyTo) {
                    case 'exclude':
                        if ((filter.applyList.indexOf(voat) !== -1) || (checkVALL)) {
                            skipCheck = true;
                        }
                        break;
                    case 'include':
                        if ((filter.applyList.indexOf(voat) === -1) && (checkVALL)) {
                            skipCheck = true;
                        }
                        break;
                }

                if (!skipCheck && filter.exceptSearchString.length && stringToSearch.indexOf(filter.exceptSearchString) !== -1) {
                    // skip checking the filter
                    continue;
                } else if (filter.searchString.test) {
                    // filter is a regex
                    if (filter.searchString.test(stringToSearch)) {
                        result = true;
                        break;
                    }
                } else if (fullmatch) {
                    // simple full string match
                    if (stringToSearch === filter.searchString) {
                        result = true;
                        break;
                    }
                } else {
                    // in-string match
                    if (stringToSearch.indexOf(filter.searchString) !== -1) {
                        result = true;
                        break;
                    }
                }
            }
            return result;
        },
        toggleFilter: function(e) {
            var thisSubverse = $(e.target).data('subverse').toLowerCase();
            var filteredSubverses = Modules.filterVoat.options.subverses.value || [];
            var exists = false;
            for (var i = 0, len = filteredSubverses.length; i < len; i++) {
                if ((filteredSubverses[i]) && (filteredSubverses[i][0].toLowerCase() == thisSubverse)) {
                    exists = true;
                    filteredSubverses.splice(i, 1);
                    e.target.setAttribute('title', 'Filter this subverse from /v/all');
                    e.target.textContent = '+filter';
                    e.target.classList.remove('remove');
                    break;
                }
            }
            if (!exists) {
                var thisObj = [thisSubverse, 'everywhere', ''];
                filteredSubverses.push(thisObj);
                e.target.setAttribute('title', 'Stop filtering this subverse from /v/all');
                e.target.textContent = '-filter';
                e.target.classList.add('remove');
            }
            Modules.filterVoat.options.subverses.value = filteredSubverses;
            // save changes
            VESUtils.options.saveModuleOptions('filterVoat');
        },
        executeCustomFilters: function(thing) {
            // TODO for this.options.customFilters
            // var advancedFilterOptions = Modules.filterVoat.options['customFilters'];
            // var filters = advancedFilterOptions.value,
            //     config = advancedFilterOptions.cases;
            // for (var i = 0, len = filters.length; i < len; i++) {
            //     if (config[filters[i].body.type].evaluate(thing, filters[i].body, config)) {
            //         return true;
            //     }
            // }
            return false;
        }
    };
// }}}

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
            VESUtils.options.resetModulePrefs();

            // test for localStorage
            try {
                $.set(me.namespace + 'test');
            } catch(e) {
                localStorageFail = true;
            }
            if (localStorageFail) {
                //cli.error('Storage failed or is inaccessible. Are you in a private browsing session?');
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
            // run the modules
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
        }
    };
    VES.init();

    // inject all VES modules' CSS
    $.addStyle(VESUtils.css);
}).call(this);
