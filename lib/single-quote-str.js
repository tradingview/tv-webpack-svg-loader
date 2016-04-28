'use strict';

function escapeStr(str){
	return str.replace(/'|\r|\n|\t|\\|\u2028|\u2029/g, function(c){
		switch (c){
			case "'":
				return "\\'";
			case '\r':
				return '\\r';
			case '\n':
				return '\\n';
			case '\t':
				return '\\t';
			case '\\':
				return '\\\\';
			case '\u2028':
				return '\\u2028';
			case '\u2029':
				return '\\u2029';
		}
	});
}

module.exports = function singleQuoteStr(str) {
	return "'" + escapeStr(str) + "'";
};