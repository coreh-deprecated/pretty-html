/**
 * Module dependencies
 */

var slice = [].slice;

/**
 * Export `Pretty`
 */

module.exports = Pretty;

/**
 * Initialize `Pretty`
 *
 * @param {Object} dom
 */

function Pretty(dom, range) {
  if (!(this instanceof Pretty)) return new Pretty(dom, range);
  this.dom = dom;
  this.range = range;
}

/**
 * Get an HTML representation
 *
 * @return {String} html
 * @api public
 */

Pretty.prototype.html = function() {
  var self = this;
  var lines = [];
  var prefix = '<div class="pretty-html"><div class="line">';
  var suffix = '</div></div>';
  var line;

  this.walk(this.dom, function(node, depth) {
    line = '<span class="depth depth-' + depth + '">';
    line += repeat('&nbsp;&nbsp;', depth);
    line += '</span>';

    line += htmlbeforenode(node, self.range);

    if (3 == node.nodeType) {
      line += '<span class="text">' + htmltext(node, self.range) + '</span class="text">';
    } else if (1 == node.nodeType) {
      line += '<span class="element">';
      line += node.nodeName.toLowerCase();

      var attrs = attributes(node.attributes);
      var arr = [];
      if (!empty(attrs)) {
        for (var k in attrs) arr.push(k + " = '" + attrs[k] + "'");
        line += ' | ' + arr.join(', ') + '';
      }

      line += '</span>';

      line += htmlafternode(node, self.range);
    }

    lines.push(line);
  });

  return prefix + lines.join('</div><div class="line">') + suffix;
};

/**
 * Get a console representation
 *
 * @return {String} html
 * @api public
 */

Pretty.prototype.text = function() {
  var lines = [];
  var line;

  this.walk(this.dom, function(node, depth) {
    line = repeat('  ', depth);
    if (3 == node.nodeType) {
      line += "'" + spaces(node.nodeValue) + "'";
    } else if (1 == node.nodeType) {
      line += '[ ' + node.nodeName.toLowerCase();

      var attrs = attributes(node.attributes);
      var arr = [];
      if (!empty(attrs)) {
        for (var k in attrs) arr.push(k + " = '" + attrs[k] + "'");
        line += ' | ' + arr.join(', ') + '';
      }
      line += ' ]';
    }

    lines.push(line);
  })

  return lines.join('\n');
};

/**
 * Walk the DOM tree
 */

Pretty.prototype.walk = function(node, fn, depth) {
  depth = depth || 0;
  fn(node, depth);

  var children = node.childNodes;
  for (var i = 0, len = children.length; i < len; i++) {
    this.walk(children[i], fn, depth + 1);
  }
};

/**
 * Parse attributes
 *
 * @param {Object|NamedNodeMap} attrs
 * @return {Object}
 */

function attributes(attrs) {
  if (undefined == attrs.item && undefined == attrs.length) return attrs;
  attrs = slice.call(attrs);
  var out = {};

  for (var i = 0, len = attrs.length; i < len; i++) {
    out[attrs[i].name] = attrs[i].value;
  }

  return out;
}

/**
 * Repeat a string `n` times
 *
 * @param {String} str
 * @param {Number} n
 * @return {String}
 */

function repeat(str, n) {
  return new Array(+n + 1).join(str);
}

/**
 * Check if the object is empty
 *
 * @param {Object} obj
 * @return {Boolean}
 */

function empty(obj) {
  for(var key in obj) {
    if(obj.hasOwnProperty(key)) return false;
  }
  return true;
}

/**
 * Convert text into visible spaces
 *
 * @param {String} str
 * @return {String} str
 * @api private
 */

function spaces(str) {
  return str
    .replace(/ /g, '·')
    .replace(/\r/g, '¬')
    .replace(/\t/g, '‣')
    .replace(/\n/g, '¬')
}

/**
 * Convert text into (styleable) visible spaces
 *
 * @param {String} str
 * @return {String} str
 * @api private
 */

function htmltext(textNode, range) {
  var str = textNode.nodeValue;
  str = str.replace(/ /g, '·')
  if (range) {
    if (range.startContainer == textNode) {
      if (range.endContainer == textNode) {
        if (range.endOffset > range.startOffset) {
          str = str.slice(0, range.startOffset) + '<span class="range start"></span>' + str.slice(range.startOffset, range.endOffset) + '<span class="range end"></span>' + str.slice(range.endOffset);
        } else {
          str = str.slice(0, range.startOffset) + '<span class="range"></span>' + str.slice(range.endOffset);
        }
      } else {
        str = str.slice(0, range.startOffset) + '<span class="range start"></span>' + str.slice(range.startOffset);
      }
    } else {
      if (range.endContainer == textNode) {
        str = str.slice(0, range.endOffset) + '<span class="range end"></span>' + str.slice(range.endOffset);
      } else {
        str = str;
      }
    }
  }
  return str
    .replace(/·/g, '<span class="whitespace space">·</span>')
    .replace(/\r/g, '<span class="whitespace newline">¬</span>')
    .replace(/\t/g, '<span class="whitespace tab">‣</span>')
    .replace(/\n/g, '<span class="whitespace newline">¬</span>')
}

function htmlbeforenode(node, range) {
  var offset;
  function calculateOffset() {
    if (typeof offset !== 'undefined') {
      return;
    }
    offset = 0;
    var tmp = node;
    while (tmp.previousSibling) {
      tmp = tmp.previousSibling;
      offset++;
    }
  }

  var str = '';
  if (range) {
    var start = false, end = false;

    if (range.startContainer == node.parentNode) {
      calculateOffset();
      if (offset == range.startOffset) {
        start = true;
      }
    }

    if (range.endContainer == node.parentNode) {
      calculateOffset();
      if (offset == range.endOffset && range.collapsed) {
        end = true;
      }
    }

    if (start) {
      if (end) {
        str += '<span class="range"></span>';
      } else {
        str += '<span class="range start"></span>';
      }
    } else {
      if (end) {
        str += '<span class="range end"></span>';
      }
    }
  }
  return str;
}

function htmlafternode(node, range) {
  var offset;
  function calculateOffset() {
    if (typeof offset !== 'undefined') {
      return;
    }
    offset = 0;
    var tmp = node;
    while (tmp.previousSibling) {
      tmp = tmp.previousSibling;
      offset++;
    }
  }

  var str = '';
  if (range) {
    var start = false, end = false;

    if (range.startContainer == node.parentNode) {
      calculateOffset();
      if (offset + 1 == range.startOffset && !node.nextSibling) {
        start = true;
      }
    }

    if (range.endContainer == node.parentNode) {
      calculateOffset();
      if (offset + 1 == range.endOffset && (!node.nextSibling || !range.collapsed)) {
        end = true;
      }
    }

    if (start) {
      if (end) {
        str += '<span class="range"></span>';
      } else {
        str += '<span class="range start"></span>';
      }
    } else {
      if (end) {
        str += '<span class="range end"></span>';
      }
    }
  }
  return str;
}