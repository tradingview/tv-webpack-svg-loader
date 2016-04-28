function escape(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

var attrOrder = ['xmlns', 'viewBox', 'width', 'height', /^fill/, /^stroke/, /^[cr]?[xy]$/, '*', 'id', 'class', 'style'];

function _getOrder(str) {
	var defaultOrder = Infinity;
	for (var i = 0; i < attrOrder.length; i++) {
		var pattern = attrOrder[i];
		if (pattern === '*') {
			defaultOrder = i;
			continue;
		}
		if (pattern instanceof RegExp) {
			if (pattern.test(str)) {
				return i;
			}
		} else {
			if (pattern === str) {
				return i;
			}
		}
	}
	return defaultOrder;
}

function attrSorter(a, b) {
	var aLocal = a.local || a.prefix;
	var bLocal = b.local || b.prefix;
	// Try predefined order
	var aOrder = _getOrder(aLocal);
	var bOrder = _getOrder(bLocal);
	if (aOrder !== bOrder) {
		return aOrder - bOrder;
	}
	// Sort alphanumeric
	if (aLocal < bLocal) {
		return -1;
	} else if (aLocal > bLocal) {
		return 1;
	}
	// Okay, names are the same. Try prefix
	if (a.prefix < b.prefix) {
		return -1;
	} else if (a.prefix > b.prefix) {
		return 1;
	}
	return 0;
}

module.exports = function SvgStr(inStr) {
	var sax = require('sax').parser(true, {
		xmlns: true,
		trim: true,
		normalize: true
	});

	var retVal = '';
	var isSvg = false;
	var _unclosedTag = false;
	var finished = false;


	function write(str) {
		if (_unclosedTag) {
			str = '>' + str;
			_unclosedTag = false;
		}

		if (!finished) {
			retVal += str;
		}
	}

	sax.onerror = function(e) {
		if (!finished) {
			// Re-emit errors
			throw e;
		}

		// We don't care about errors happened after we've finished
	};

	sax.ontext = function(text) {
		write(escape(text));
	};

	sax.processinginstruction = function(e) {
		if (e.name === 'xml') {
			// XML declaration is ignored
			return;
		}
		write('<?' + e.name + ' ' + e.body + '?>');
	};

	// 'doctype' is intentionally ignored

	// 'sgmldeclaration' is ignored

	sax.onopentag = function(e) {
		if (!isSvg) {
			if (e.local !== 'svg') {
				throw new Error('Not an SVG format');
			} else {
				isSvg = true;
			}
		}

		var str = '<' + (e.prefix ? (e.prefix + ':') : '') + e.local;
		var attrs = Object.keys(e.attributes).map(function(key) {return e.attributes[key];}).sort(attrSorter);

		for (var i=0; i<attrs.length; i++) {
			var attr = attrs[i];
			var local = attr.local;
			var prefix = attr.prefix;
			if (prefix && !local) {
				local = prefix;
				prefix = '';
			}
			str += ' ' + (prefix ? (prefix + ':') : '') + local + '="' + escape(attr.value) + '"';
		}

		write(str);
		_unclosedTag = true;
	};

	sax.onclosetag = function(tagname) {
		if (_unclosedTag) {
			_unclosedTag = false;
			write('/>');
			return;
		}
		write('</' + tagname + '>');
	};

	sax.onopencdata = function() {
		write('<![CDATA[');
	};

	sax.oncdata = function(text) {
		write(text);
	};

	sax.onclosecdata = function() {
		write(']]>');
	};

	sax.onend = function() {
		finished = true;
		write(''); // flush unclosed tag
	};

	sax.write(inStr).close();

	return retVal;
};
