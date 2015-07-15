// ==UserScript==
// @name        <%= meta.name %>
// @version     <%= meta.version %>
// @description <%= description %>
// @namespace   <%= namespace %>
// @author      <%= author %>
// @license     <%= license %>; <%= meta.repo %>blob/master/LICENSE
<%=
	meta.matches.map(function(match) {
		return '// @match       ' + match;
	}).join('\n')
%>
<%=
	meta.grants.map(function(grant) {
		return '// @grant       GM_' + grant;
	}).join('\n')
%>
// @run-at      document-start
<%=
	meta.requires.map(function(require) {
		return '// @require     ' + require;
	}).join('\n')
%>
// @updateURL   <%= meta.files.metablock %>
// @downloadURL <%= meta.files.userscript %>
// ==/UserScript==
