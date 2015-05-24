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


var VESMetadata = {
    name: 'Voat Enhancement Suite',
    version: '0.0.4',
    categories: [ 'About RES', 'Content', 'Editing', 'Style', 'Filters', 'Posts', 'Comments', 'Subreddits', '*', 'Core' ]
};

var modules = {};
// TODO define options for modules up here so they can be accessed more easily


// some basic utils
function hasClass(e,c) {
    if ((typeof(e) == 'undefined') || (e === null)) {
        console.log(arguments,callee,caller);
        return false;
    }
    return ele.className.match(new RegExp('(\\s|^)'+c+'(\\s|$)'));
}
function addClass(e,c) {
    if (!hasClass(e,c)) e.className += " "+c;
}
function removeClass(e,c) {
    if (hasClass(e,c)) {
        var r = new RegExp('(\\s|^)'+c+'(\\s|$)');
        e.className = e.className.replace(r,' ');
    }
}
function insertAfter(target, node) {
    if ((typeof(target) == 'undefined') || (target === null)){
        console.log(arguments.callee.caller);
    } else if ((typeof(target.parentNode) != 'undefined') && (typeof(target.nextSibling) != 'undefined')) {
        target.parentNode.insertBefore( node, target.nextSibiling);
    }
}

var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
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
        {   string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
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
            subString: "iCab",
            identity: "iCab"
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
        {       // for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        {       // for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
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
BrowserDetect.init();

var _beforeLoadComplete = false;
function VESdoBeforeLoad() {
    if (document && document.html && document.html.classList) {
        if (_beforeLoadComplete) return;
        _beforeLoadComplete = true;
        // if (beforeLoadDoneOnce) return;
        // first, go through each module and set all of the options so that if a module needs to check another module's options, they're ready...
        // console.log('get options start: ' + Date());
        for (var thisModuleID in modules) {
            if (typeof modules[thisModuleID] === 'object') {

                // Allow the module to instaniate any dynamic options
                if (typeof modules[thisModuleID].loadDynamicOptions === 'function') {
                    modules[thisModuleID].loadDynamicOptions();
                }
            }
        }
        for (var thisModuleID in modules) {
            if (typeof modules[thisModuleID] === 'object') {
                VESUtils.options.getOptions(thisModuleID);
            }
        }

        // console.log('get options end: ' + Date());
        for (var thisModuleID in modules) {
            if (typeof modules[thisModuleID] === 'object') {
                if (typeof modules[thisModuleID].beforeLoad === 'function') {
                    modules[thisModuleID].beforeLoad();
                }
            }
        }
        //VESUtils.addBodyClasses();

        // apply style...
        //VESUtils.addStyle(RESUtils.css);
        // clear out css cache...
        VESUtils.css = '';
    } else {
        setTimeout(VESdoBeforeLoad, 1);
    }
}

function VESdoAfterLoad() {
    $.each(modules, function(name, module) {
        if (typeof module.afterLoad === 'function') {
            module.afterLoad();
        }
    });
}

function VESInit() {
    // VESUtils.addBodyClasses();

    // if VESStorage isn't fully loaded, and _beforeLoadComplete isn't true,
    // then wait. It means we haven't read all of the modules' options yet.
    if (!VESStorage.isReady || !_beforeLoadComplete) {
        setTimeout(VESInit, 10);
        return;
    }

    // $.browser shim since jQuery removed it
    $.browser = {
        safari: BrowserDetect.isSafari(),
        mozilla: BrowserDetect.isFirefox(),
        chrome: BrowserDetect.isChrome(),
        opera: BrowserDetect.isOpera()
    };

    $.fn.safeHtml = function(string) {
        if (!string) return '';
        else return $(this).html(VESUtils.sanitizeHTML(string));
    };

    VESUtils.initObservers();
    var localStorageFail = false;

    // Check for localStorage functionality...
    // try {
    //     localStorage.setItem('VES.localStorageTest', 'test');
    //     VESUtils.runtime.localStorageTest();
    // } catch (e) {
    //     localStorageFail = true;
    // }

    if (localStorageFail) {
        // TODO
    } else {
        document.body.addEventListener('mousemove', VESUtils.setMouseXY, false);
        // added this if statement because some people's Greasemonkey "include" lines are getting borked or ignored, so they're calling RES on non-reddit pages.
        if (VESUtils.regexes.all.test(location.href)) {
            // go through each module and run it
            for (var thisModuleID in modules) {
                if (typeof modules[thisModuleID] === 'object') {
                    // console.log(thisModuleID + ' start: ' + Date());
                    // perfTest(thisModuleID+' start');
                    modules[thisModuleID].go();
                    // perfTest(thisModuleID+' end');
                    // console.log(thisModuleID + ' end: ' + Date());
                }
            }
            //VESUtils.addStyle(RESUtils.css);
            //  console.log('end: ' + Date());
        }
    }

    VESUtils.postLoad = true;
}

var safeJSON = {
    // safely parses JSON and won't kill the whole script if JSON.parse fails
    // if localStorageSource is specified, will offer the user the ability to delete that localStorageSource to stop further errors.
    parse: function(data, localStorageSource, silent) {
        try {
            if (typeof(safari) != 'undefined') {
                if (data.substring(0,2) == 's{') {
                    data = data.substring(1,data.length);
                }
            }
            return JSON.parse(data);
        } catch (error) {
            if (silent) return {};
            if (localStorageSource) {
                var msg = 'Error caught: JSON parse failure on the following data from "'+localStorageSource+'": <textarea rows="5" cols="50">' + data + '</textarea><br>RES can delete this data to stop errors from happening, but you might want to copy/paste it to a text file so you can more easily re-enter any lost information.';
                alert(msg, function() {
                    // back up a copy of the corrupt data
                    localStorage.setItem(localStorageSource + '.error', data);
                    // delete the corrupt data
                    VESStorage.removeItem(localStorageSource);
                });
            } else {
                alert('Error caught: JSON parse failure on the following data: ' + data);
            }
            return {};
        }
    }
};

// Get firebug to show console.log
if (typeof(unsafeWindow) != 'undefined') {
    if ((typeof(unsafeWindow.console) != 'undefined') && (typeof(self.on) != 'function')) {
        console = unsafeWindow.console;
    } else if (typeof(console) == 'undefined') {
        console = {
            log: function(str) {
                return false;
            }
        };
    }
}

// for applying VESUtils.css
function injectCSS(css) {
    // make a new <style/> tag
    var style = document.createElement('style');
    style.textContent = css;
    // append the <style/> tag within <head>
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        head.appendChild(style);
    }
}

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
        var module = modules[moduleID];
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
            codeOptions = modules[moduleID].options;
            for (var attrname in codeOptions) {
                if (typeof(storedOptions[attrname]) == 'undefined') {
                    storedOptions[attrname] = codeOptions[attrname];
                }
            }
            modules[moduleID].options = storedOptions;
            localStorage.setItem('VESOptions.' + moduleID, JSON.stringify(modules[moduleID].options));
        } else {
            //console.log('getOptions: setting defaults');
            // nothing's been stored, so set defaults:
            localStorage.setItem('VESOptions.' + moduleID, JSON.stringify(modules[moduleID].options));
        }
        //console.log('getOptions: returning options for ' + moduleID);
        return modules[moduleID].options;
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

// createElement functions
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
            'filterVoat': true,
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
            storedPrefs = safeJSON.parse(localStorage.getItem('VES.modulePrefs'));
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
        for (var module in modules) {
            if (storedPrefs[module]) {
                prefs[module] = storedPrefs[module];
            } else if (!modules[module].disabledByDefault && (storedPrefs[module] === null || module.alwaysEnabled)) {
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
        var moduleList = Object.getOwnPropertyNames(modules);

        moduleList = moduleList.filter(function(moduleID) {
            return !modules[moduleID].hidden;
        });
        moduleList = moduleList.filter(function(moduleID) {
            return [].concat(modules[moduleID].category).indexOf(category) !== -1;
        });
        moduleList.sort(function(moduleID1, moduleID2) {
            var a = modules[moduleID1];
            var b = modules[moduleID2];

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
        var module = modules[moduleID];
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
            modules[moduleID].onToggle(onOrOff);
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
            modules[moduleID].options = newOptions;
        }
        VESStorage.setItem('RESoptions.' + moduleID, JSON.stringify(minify(modules[moduleID].options)));
    },
    getOptionsFirstRun: [],
    getOptions: function(moduleID) {
        if (this.getOptionsFirstRun[moduleID]) {
            // we've already grabbed these out of localstorage, so modifications should be done in memory. just return that object.
            return modules[moduleID].options;
        }
        var thisOptions = localStorage.getItem('VESoptions.' + moduleID);
        if ((thisOptions) && (thisOptions !== 'undefined') && (thisOptions !== null)) {
            // merge options (in case new ones were added via code) and if anything has changed, update to localStorage
            var storedOptions = safeJSON.parse(thisOptions, 'VESoptions.' + moduleID);
            var codeOptions = modules[moduleID].options;
            var newOption = false;
            for (var attrname in codeOptions) {
                codeOptions[attrname].default = codeOptions[attrname].value;
                if (typeof storedOptions[attrname] === 'undefined') {
                    newOption = true;
                } else {
                    codeOptions[attrname].value = storedOptions[attrname].value;
                }
            }
            modules[moduleID].options = codeOptions;
            if (newOption) {
                VESUtils.options.saveModuleOptions(moduleID);
            }
        } else {
            // nothing in localStorage, let's set the defaults...
            VESUtils.options.saveModuleOptions(moduleID);
        }
        this.getOptionsFirstRun[moduleID] = true;
        return modules[moduleID].options;
    },
});
$.extend(VESUtils.options.table, {
    getMatchingValue: function(moduleID, optionKey, valueIdentifiers) {
        var option = modules[moduleID].options[optionKey];
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
        var option = modules[moduleID].options[optionKey];
        if (option.type !== 'table') {
            console.error('Tried to save table value to non-table option: modules[\'' + moduleID + '\'].options.' + optionKey);
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
        var option = modules[moduleID].options[optionKey];

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

modules.debug = {
    moduleID: 'debug',
    moduleName: 'VES Debugger',
    description: 'VES analytics for debugging.',
    options: {

    },
    isEnabled: function() {
        //console.log('debug.isEnabled(): ' + VESUtils.options.getModulePrefs(this.moduleID));
        return VESUtils.options.getModulePrefs(this.moduleID);
    },
    include: [
        'all'
    ],
    isMatchURL: function() {
        //console.log('debug.isMatchURL(): ' + VESUtils.isMatchURL(this.moduleID));
        return VESUtils.isMatchURL(this.moduleID);
    },
    go: function() {
        //if ((this.isMatchURL())) {  // force run
        if ((this.isEnabled()) && (this.isMatchURL())) {
            // do some basic logging.
            console.log('VES loaded: ' + Date());
            console.log('OS: ' + BrowserDetect.OS);
            console.log('browser: ' + BrowserDetect.browser + ' ' + BrowserDetect.version);
            console.log('loggedInUser: ' + VESUtils.loggedInUser());
            console.log('pageType: ' + VESUtils.pageType());
            console.log('subverse: ' + VESUtils.currentSubverse());
            // add a link to VES in the footer
            var voatFooter = document.querySelector('.footer div');
            var separator = document.createElement('span');
            separator.setAttribute('class', 'separator');
            var VESlink = document.createElement('a');
            VESlink.setAttribute('href', 'http://github.com/travis-g/Voat-Enhancement-Suite');
            VESlink.innerHTML = 'VES';
            voatFooter.appendChild(separator);
            voatFooter.appendChild(VESlink);
        }
    },
};

modules.hideChildComments = {
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
                modules.hideChildComments.toggleComments(this.getAttribute('action'));
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
                        modules.hideChildComments.toggleComments(this.getAttribute('action'), this);
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

modules.voatingNeverEnds = {
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
            if (typeof(modules.voatingNeverEnds.dupeHash) == 'undefined') modules.voatingNeverEnds.dupeHash = {};
            var entries = document.body.querySelectorAll('a.comments');
            for (var i = entries.length - 1; i > -1; i--) {
                modules.voatingNeverEnds.dupeHash[entries[i].href] = 1;
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
            var nextPrevLinks = modules.voatingNeverEnds.getNextPrevLinks();
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
                    window.addEventListener('scroll', VESUtils.debounce.bind(VESUtils, 'scroll.voatingNeverEnds', 300, modules.voatingNeverEnds.handleScroll), false);
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

        for (var i = 0, len = modules.voatingNeverEnds.pageMarkers.length; i<len; i++) {
            var thisXY = VESUtils.getXYpos(modules.voatingNeverEnds.pageMarkers[i]);
            if (thisXY.y < window.pageYOffset) {
                thisPageNum = modules.voatingNeverEnds.pageMarkers[i].getAttribute('id').replace('page-','');
            } else {
                break;
            }
        }
        var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubverse();
        console.log("thisPageType: " + thisPageType);
        VESStorage.setItem('VESmodules.voatingNeverEnds.lastPage.'+thisPageType, modules.voatingNeverEnds.pageURLs[thisPageNum]);
        var urlParams = VESUtils.getURLParams();
        if (thisPageNum != urlParams.VNEpage) {
            if (thisPageNum > 1) {
                urlParams.VNEpage = thisPageNum;
                modules.voatingNeverEnds.pastFirstPage = true;
            } else {
                urlParams.VNEpage = null;
            }
            if (modules.voatingNeverEnds.pastFirstPage) {
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
        if (modules.voatingNeverEnds.fromBackButton !== true) {
            for (var i=0, len=modules.voatingNeverEnds.allLinks.length; i<len; i++) {
                if (VESUtils.elementInViewport(modules.voatingNeverEnds.allLinks[i])) {
                    var thisClassString = modules.voatingNeverEnds.allLinks[i].getAttribute('class');
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
        if ((VESUtils.elementInViewport(modules.voatingNeverEnds.loadingIndicator)) && (modules.voatingNeverEnds.fromBackButton !== true)) {
            if (modules.voatingNeverEnds.isPaused !== true) {
                modules.voatingNeverEnds.loadNewPage();
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
            if( modules.voatingNeverEnds.dupeHash[thisCommentLink] ) {
                // console.log('found a dupe: ' + newLink.querySelector('a.title').innerHTML);
              // let's not remove it altogether, but instead dim it...
              // newLink.parentElement.removeChild(newLink);
              addClass(newLink, 'VNEdupe');
            } else {
                modules.voatingNeverEnds.dupeHash[thisCommentLink] = 1;
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
            modules.voatingNeverEnds.loadNewPage();
        }, false);
        insertAfter(this.siteTable, this.loadingIndicator);
    },
    loadNewPage: function(fromBackButton, reload) {
        var me = modules.voatingNeverEnds;
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
        modules.voatingNeverEnds.isLoading = false;
        var newHTML = createElementWithID('div','VNEFail');
        if (noresults) {
            newHTML.innerHTML = 'Voat says there\'s nothing here.';
        } else {
            console.log('Voat didn\'t give a response, it may be under heavy load.');
        }
        modules.voatingNeverEnds.siteTable.appendChild(newHTML);
    },
};

modules.singleClick = {
    moduleID: 'singleClick',
    moduleName: 'Single Click',
    description: 'Adds an [l+c] link that opens a link and the comments page in new tabs for you in one click.',
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
            //VESUtils.watchForElement('sitetable', modules.singleClick.applyLinks);
            document.body.addEventListener('DOMNodeInserted', function(event) {
                if ((event.target.tagName == 'DIV') && (event.target.getAttribute('class') == 'sitetable')) {
                    modules.singleClick.applyLinks();
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
                            if (modules.singleClick.options.openOrder.value == 'commentsfirst') {
                                if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
                                    // console.log('open comments');
                                    window.open(this.getAttribute('thisComments'));
                                }
                                window.open(this.getAttribute('thisLink'));
                            } else { // modules.singleClick.options.openOrder.value == 'linkfirst'
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
    },
};
modules.searchHelper = {
    moduleID: 'searchHelper',
    moduleName: 'Search Helper',
    category: 'Posts',
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
    description: 'Provide help with the use of search.',
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
modules.filterVoat = {
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
            console.log('running beforeLoad of filterVoat');
            VESUtils.addCSS('');
        }
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            VESUtils.addCSS('.VESFiltered { border: 1px solid red !important; }');
            console.log('filterVoat is scanning for content.');
            this.scanEntries();
            VESUtils.watchForElement('sitetable', modules.filterVoat.scanEntries);
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
        var filterSubs = (modules.filterVoat.options.filterSubversesFrom.value === 'everywhere') ||
            (modules.filterVoat.options.filterSubversesFrom.value === 'everywhere-except-subverse' && !VESUtils.currentSubverse()) ||
            (VESUtils.currentSubverse('all')) /* TODO sets, Voat's domain... */,
            onSavedPage = modules.filterVoat.excludeSaved.test && modules.filterVoat.excludeSaved.test(location.href);

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

                if (!filtered) filtered = modules.filterVoat.executeCustomFilters(entries[i]);

                currSub = (VESUtils.currentSubverse()) ? VESUtils.currentSubverse().toLowerCase(): null;
                if (!filtered) filtered = modules.filterVoat.filterTitle(postTitle, postSubverse);
                if (!filtered) filtered = modules.filterVoat.filterDomain(postDomain, postSubverse || currSub);
                if ((!filtered) && (filterSubs) && (postSubverse)) {
                    filtered = modules.filterVoat.filterSubverse(postSubverse);
                }
                if ((!filtered) && (postFlair)) {
                    filtered = modules.filterVoat.filterFlair(postFlair.textContent, postSubverse);
                }
                if (filtered) {
                    entries[i].classList.add('VESFiltered');
                    console.log('filterVoat hid an entry.');
                    numFiltered++;
                }
            }
            // TODO does NSFW content even make it to the client?
            if (entries[i].classList.contains('over18')) {
                if (modules.filterVoat.allowNSFW(postSubverse, currSub)) {
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
        var module = modules.filterVoat;
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
                if (modules.filterVoat.options.regexpFilters.value && modules.filterVoat.regexRegex.test(searchString)) {
                    var regexp = modules.filterVoat.regexRegex.exec(searchString);
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
        var filters = modules.filterVoat.filters(filterType);
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
        var filteredSubverses = modules.filterVoat.options.subverses.value || [];
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
        modules.filterVoat.options.subverses.value = filteredSubverses;
        // save changes
        VESUtils.options.saveModuleOptions('filterVoat');
    },
    executeCustomFilters: function(thing) {
        // TODO for this.options.customFilters
        // var advancedFilterOptions = modules.filterVoat.options['customFilters'];
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

(function(u) {  // define all the variables up here
    var $, $$, cmd, Conf, Config, CustomCSS, doc, escape, me,
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
    cmd = console;
    me = {
        v: '0.1.0',
        namespace: 'ves.',
        name: 'ves'
    };

    Conf = {};

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

    $ = function(selector, root) {
        if (root === null) {
            root = doc.body;
        }
        return root.querySelector(selector);
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

    $.checkbox = {
        checked: function() {
            $.set(this.name, this.checked);
            Conf[this.name] = this.checked;
            return Conf[this.name];
        },
        value: function() {
            $.set(this.name, this.value.trim());
            Conf[this.name] = this.value;
            return Conf[this.name];
        }
    };

    for (var i in modules) {
        moduleID = i;
        modules[moduleID].go();
    }

    // inject all VES modules' CSS
    injectCSS(VESUtils.css);
})();
