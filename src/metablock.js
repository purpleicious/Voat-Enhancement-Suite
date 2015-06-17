// ==UserScript==
// @name        <%= meta.name %>
// @version     <%= meta.version %>
// @description <%= description %>
// @author      <%= author %>
// @namespace   <%= homepage %>
// @license     <%= license %>; <%= meta.repo %>blob/master/LICENSE
<%=
        meta.includes.map(function(include) {
                return '// @include     ' + include;
        }).join('\n')
%>
<%=
        meta.excludes.map(function(exclude) {
                return '// @exclude     ' + exclude;
        }).join('\n')
%>
<%=
        meta.grants.map(function(grant) {
                return '// @grant       GM_' + grant;
        }).join('\n')
%>
// @run-at      document-start
// @require     http://code.jquery.com/jquery-latest.js
// @noframes
// @updateURL   <%= meta.files.metablock %>
// @downloadURL <%= meta.files.userscript %>
// @icon
// ==/UserScript==
