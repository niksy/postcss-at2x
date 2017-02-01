'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

require('string.prototype.includes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultResolutions = ['(min--moz-device-pixel-ratio: 1.5)', '(-o-min-device-pixel-ratio: 3/2)', '(-webkit-min-device-pixel-ratio: 1.5)', '(min-device-pixel-ratio: 1.5)', '(min-resolution: 144dpi)', '(min-resolution: 1.5dppx)'];

exports.default = _postcss2.default.plugin('postcss-at2x', at2x);


function at2x() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$identifier = _ref.identifier,
      identifier = _ref$identifier === undefined ? '@2x' : _ref$identifier;

  return function (root) {
    // Create an empty rule so that all the new rules can be appended to this
    // and then append it at the end.
    var ruleContainer = _postcss2.default.root();

    root.walkRules(function (rule) {
      var mediaParent = rule.parent;

      // Check for any `background-size` declarations and keep a reference to it
      // These need to be added again to prevent it being overridden by usage of
      // the `background` shorthand
      var backgroundSize = void 0;
      rule.walkDecls('background-size', function (decl) {
        return backgroundSize = decl;
      });

      rule.walkDecls(/^background/, function (decl) {
        if (!backgroundWithHiResURL(decl.value)) {
          return;
        }

        // Construct a duplicate rule but with the image urls
        // replaced with retina versions
        var retinaRule = _postcss2.default.rule({ selector: decl.parent.selector });
        retinaRule.append(decl.clone({
          value: createRetinaUrl(decl.value, identifier)
        }));

        // Remove keyword from original declaration here as createRetinaUrl
        // needs it for regex search
        decl.value = removeKeyword(decl.value);

        if (backgroundSize) {
          retinaRule.append(_postcss2.default.decl(backgroundSize));
        }

        // Create the rules and append them to the container
        var params = mediaParent.name === 'media' ? combineMediaQuery(mediaParent.params.split(/,\s*/), defaultResolutions) : defaultResolutions.join(', ');
        var mediaAtRule = _postcss2.default.atRule({ name: 'media', params: params });

        mediaAtRule.append(retinaRule);
        ruleContainer.append(mediaAtRule);
      });
    });

    root.append(ruleContainer);
  };
}

/**
 * Add all the resolutions to each media query to scope them
 */
function combineMediaQuery(queries, resolutions) {
  return queries.reduce(function (finalQuery, query) {
    resolutions.forEach(function (resolution) {
      return finalQuery.push(query + ' and ' + resolution);
    });
    return finalQuery;
  }, []).join(', ');
}

// Matches `url()` content as long as it is followed by `at-2x`
var urlPathRegex = /url\(([^\r\n]+)\)(?:[^\r\n]+)?at-2x/gm;

function createRetinaUrl(bgValue, identifier) {
  var match = void 0;
  // Loop over all occurances of `url()` and match the path
  while ((match = urlPathRegex.exec(bgValue)) !== null) {
    var _match = match,
        _match2 = _slicedToArray(_match, 2),
        imgUrl = _match2[1];

    var extension = _path2.default.extname(imgUrl);

    if (extension === '.svg') {
      break;
    }

    // File name without extension
    var filename = _path2.default.basename(_path2.default.basename(imgUrl), extension);

    // Replace with retina filename
    bgValue = bgValue.replace(filename + extension, filename + identifier + extension);
  }

  return removeKeyword(bgValue);
}

function removeKeyword(str) {
  return str.replace(/\sat-2x/g, '');
}

function backgroundWithHiResURL(bgValue) {
  return bgValue.includes('url(') && bgValue.includes('at-2x');
}