// ==UserScript==
// @name        Voat Enhancement Suite
// @version     0.03
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

var VESversion = 0.03;


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
function createElement(type, id, classname, textContent) {
    obj = document.createElement(type);
    if (id !== null) {
        obj.setAttribute('id',id);
    }
    if ((typeof classname !== 'undefined') && classname && (classname !== '')) {
        obj.setAttribute('class',classname);
    }
    if (textContent) {
        if (classname && classname.split(' ').indexOf('noCtrlF') !== -1) {
            obj.setAttribute('data-text', textContent);
        } else {
            obj.textContent = textContent;
        }
    }
    return obj;
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

var modules = {};

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
        // check the headerOffset - if we've pinned the subreddit bar, we need to add some pixels so the "visible" stuff is lower down the page.
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

var VESConsole = {
    resetModulePrefs: function() {
        //console.log("resetModulePrefs(): resetting module prefs");
        prefs = {
            'debug': true,
            'hideChildComments': true,
            'voatingNeverEnds': false,
            'singleClick': true,
            'searchHelper': true,
        };
        this.setModulePrefs(prefs);
        return prefs;
    },
    getAllModulePrefs: function(force) {
        // don't repeat if it's been done already
        if ((!force) && (typeof(this.getAllModulePrefsCached) != 'undefined')) return this.getAllModulePrefsCached;
        //console.log('entering getAllModulePrefs()...')
        if (localStorage.getItem('VES.modulePrefs') !== null) {
            var storedPrefs = JSON.parse(localStorage.getItem('VES.modulePrefs'));
        } else {
            //console.log('getAllModulePrefs: resetting stored prefs');
            // first time VES has been run
            storedPrefs = this.resetModulePrefs();
        }
        if (storedPrefs === null) {
            storedPrefs = {};
        }
        // create a JSON object to return all prefs
        //console.log('getAllModulePrefs: creating prefs object');
        var prefs = {};
        for (var i in modules) {
            if (storedPrefs[i]) {
                prefs[i] = storedPrefs[i];
            } else if (storedPrefs[i] === null) {
                // new module! ...or no preferences.
                prefs[i] = true;
            } else {
                prefs[i] = false;
            }
        }
        if ((typeof(prefs) != 'undefined') && (prefs != 'undefined') && (prefs)) {
            return prefs;
        }
    },
    getModulePrefs: function(moduleID) {
        //console.log('entered getModulePrefs for ' + moduleID)
        if (moduleID) {
            //console.log('running getModulePrefs for ' + moduleID);
            var prefs = this.getAllModulePrefs();
            //console.log('getModulePrefs: returning prefs for ' + moduleID);
            return prefs[moduleID];
        } else {
            alert('no module name specified for getModulePrefs');
        }
    },
    setModulePrefs: function(prefs) {
        //console.log("setting VES.modulePrefs...")
        if (prefs !== null) {
            localStorage.setItem('VES.modulePrefs', JSON.stringify(prefs));
            //this.drawModulesPanel(); // create settings panel for modules
            return prefs;
        } else {
            alert('error - no prefs specified');
        }
    },
    // create console
    create: function() {

    },
};

modules.debug = {
    moduleID: 'debug',
    moduleName: 'VES Debugger',
    description: 'VES analytics for debugging.',
    options: {

    },
    isEnabled: function() {
        //console.log('debug.isEnabled(): ' + VESConsole.getModulePrefs(this.moduleID));
        return VESConsole.getModulePrefs(this.moduleID);
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
            console.log('isVoat: ' + VESUtils.isVoat());
            console.log('loggedInUser: ' + VESUtils.loggedInUser());
            console.log('pageType: ' + VESUtils.pageType());
            console.log('subverse: ' + VESUtils.currentSubverse());
            console.log('isDarkMode: ' + VESUtils.isDarkMode());
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
        return VESConsole.getModulePrefs(this.moduleID);
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
        return VESConsole.getModulePrefs(this.moduleID);
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
                                    var endOfReddit = createElementWithID('div','endOfReddit');
                                    endOfReddit.innerHTML = 'You\'ve reached the last page available.  There are no more pages to load.';
                                    me.siteTable.appendChild(endOfReddit);
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
                                var thisPageType = VESUtils.pageType()+'.'+VESUtils.currentSubreddit();
                                var lastTopScrolledID = VESStorage.getItem('VESmodules.voatingNeverEnds.lastVisibleIndex.'+thisPageType);
                                var lastTopScrolledEle = document.body.querySelector('.'+lastTopScrolledID);
                                if (!lastTopScrolledEle) {
                                   lastTopScrolledEle = newHTML.querySelector('#siteTable div.thing');
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
        modules.neverEndingReddit.isLoading = false;
        var newHTML = createElementWithID('div','VNEFail');
        if (noresults) {
            newHTML.innerHTML = 'Voat says there\'s nothing here.';
        } else {
            console.log('Voat didn\'t give a response, it may be under heavy load.');
        }
        modules.neverEndingReddit.siteTable.appendChild(newHTML);
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
        return VESConsole.getModulePrefs(this.moduleID);
    },
    inlude: [
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
            description: 'Search the current subverse by default when using the search box, instead of all of reddit.'
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
        return VESConsole.getModulePrefs(this.moduleID);
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

(function(u) {
    // while there's no options dialog
    VESConsole.resetModulePrefs();
    // load all the VES modules
    for (var i in modules) {
        moduleID = i;
        modules[moduleID].go();
    }
    // inject all VES modules' CSS
    injectCSS(VESUtils.css);

})();
