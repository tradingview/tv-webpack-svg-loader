'use strict';

var svgStr = require('./lib/svgstr');
var signleQuoteStr = require('./lib/single-quote-str');

module.exports = function svgloader(content) {
	this.cacheable();
	var str = svgStr(content);
	return "module.exports = " + signleQuoteStr(str) + ';';
};
