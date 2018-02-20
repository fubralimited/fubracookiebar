(function () {
  // Stop from running again, if accidently included more than once.
  if (window.hasfubracookiesbar) return;
  window.hasfubracookiesbar = true;

  /*
   Constants
   */

  // Client variable which may be present containing options to override with
  var OPTIONS_VARIABLE = 'fubracookiebar_options';

  // Name of cookie to be set when dismissed
  var DISMISSED_COOKIE = 'fubracookiebar_dismissed';

  // No point going further if they've already dismissed.
  if (document.cookie.indexOf(DISMISSED_COOKIE) > -1) {
    return;
  }

  // IE8...
  if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  /*
   Helper methods
   */
  var Util = {
    isArray: function (obj) {
      var proto = Object.prototype.toString.call(obj);
      return proto == '[object Array]';
    },

    isObject: function (obj) {
      return Object.prototype.toString.call(obj) == '[object Object]';
    },

    each: function (arr, callback, /* optional: */context, force) {
      if (Util.isObject(arr) && !force) {
        for (var key in arr) {
          if (arr.hasOwnProperty(key)) {
            callback.call(context, arr[key], key, arr);
          }
        }
      } else {
        for (var i = 0, ii = arr.length; i < ii; i++) {
          callback.call(context, arr[i], i, arr);
        }
      }
    },

    merge: function (obj1, obj2) {
      if (!obj1) return;
      Util.each(obj2, function (val, key) {
        if (Util.isObject(val) && Util.isObject(obj1[key])) {
          Util.merge(obj1[key], val);
        } else {
          obj1[key] = val;
        }
      })
    },

    bind: function (func, context) {
      return function () {
        return func.apply(context, arguments);
      };
    },

    /*
     find a property based on a . separated path.
     i.e. queryObject({details: {name: 'Adam'}}, 'details.name') // -> 'Adam'
     returns null if not found
     */
    queryObject: function (object, query) {
      var queryPart;
      var i = 0;
      var head = object;
      query = query.split('.');
      while ( (queryPart = query[i++]) && head.hasOwnProperty(queryPart) && (head = head[queryPart]) )  {
        if (i === query.length) return head;
      }
      return null;
    },

    setCookie: function (name, value, expiryDays) {
      expiryDays = expiryDays || 365;

      var exdate = new Date();
      exdate.setDate(exdate.getDate() + expiryDays);

      var cookie = [ name + '=' + value, 'expires=' + exdate.toUTCString(), '/' ];

      document.cookie = cookie.join(';');
    },

    addEventListener: function (el, event, eventListener) {
      if (el.addEventListener) {
        el.addEventListener(event, eventListener);
      } else {
        el.attachEvent('on' + event, eventListener);
      }
    }
  };

  var DomBuilder = (function () {
    /*
     The attribute we store events in.
     */
    var eventAttribute = 'data-cc-event';
    var conditionAttribute = 'data-cc-if';

    /*
     Shim to make addEventListener work correctly with IE.
     */
    var addEventListener = function (el, event, eventListener) {
      // Add multiple event listeners at once if array is passed.
      if (Util.isArray(event)) {
        return Util.each(event, function (ev) {
          addEventListener(el, ev, eventListener);
        });
      }

      if (el.addEventListener) {
        el.addEventListener(event, eventListener);
      } else {
        el.attachEvent('on' + event, eventListener);
      }
    };

    /*
     Replace {{variable.name}} with it's property on the scope
     Also supports {{variable.name || another.name || 'string'}}
     */
    var insertReplacements = function (htmlStr, scope) {
      return htmlStr.replace(/\{\{(.*?)\}\}/g, function (_match, sub) {
        var tokens = sub.split('||');
        var value;
        while (token = tokens.shift()) {
          token = token.trim();

          // If string
          if (token[0] === '"') return token.slice(1, token.length - 1);

          // If query matches
          value =  Util.queryObject(scope, token);

          if (value) return value;
        }

        return '';
      });
    };

    /*
     Turn a string of html into DOM
     */
    var buildDom = function (htmlStr) {
      var container = document.createElement('div');
      container.innerHTML = htmlStr;
      return container.children[0];
    };

    var applyToElementsWithAttribute = function (dom, attribute, func) {
      var els = dom.parentNode.querySelectorAll('[' + attribute + ']');
      Util.each(els, function (element) {
        var attributeVal = element.getAttribute(attribute);
        func(element, attributeVal);
      }, window, true);
    };

    /*
     Parse event attributes in dom and set listeners to their matching scope methods
     */
    var applyEvents = function (dom, scope) {
      applyToElementsWithAttribute(dom, eventAttribute, function (element, attributeVal) {
        var parts = attributeVal.split(':');
        var listener = Util.queryObject(scope, parts[1]);
        addEventListener(element, parts[0], Util.bind(listener, scope));
      });
    };

    var applyConditionals = function (dom, scope) {
      applyToElementsWithAttribute(dom, conditionAttribute, function (element, attributeVal) {
        var value = Util.queryObject(scope, attributeVal);
        if (!value) {
          element.parentNode.removeChild(element);
        }
      });
    };

    return {
      build: function (htmlStr, scope) {
        if (Util.isArray(htmlStr)) htmlStr = htmlStr.join('');

        htmlStr = insertReplacements(htmlStr, scope);
        var dom = buildDom(htmlStr);
        applyEvents(dom, scope);
        applyConditionals(dom, scope);

        return dom;
      }
    };
  })();


  /*
   Plugin
   */
  var fubracookiebar = {
    options: {
      message: 'This site uses cookies, and we also share information about your use of our site with our social media, advertising and analytics partners. ',
      button: 'Got it',
      more: 'Read More',
      link: '/privacy-policy.html',
      expiryDays: 365,
      markup: [
        '<div class="fookie-wrapper {{containerClasses}}">',
        '<div class="fookie-container fookie-container--open">',
        '<a href="#null" data-cc-event="click:dismiss" target="_blank" class="fookie-btn fookie-btn_accept_all">{{options.button}}</a>',
        '<p class="fookie-message">{{options.message}} <a class="fookie-more_info" href="{{options.link}}" class="popup-link">{{options.more}}</a></p>',
        '</div>',
        '</div>'
      ]
    },



    init: function () {
      var options = window[OPTIONS_VARIABLE];
      if (options) this.setOptions(options);

      this.container = document.body;

      // Calls render when theme is loaded.
      this.loadTheme(this.render);
    },

    setOptionsOnTheFly: function (options) {
      this.setOptions(options);
      this.render();
    },

    setOptions: function (options) {
      Util.merge(this.options, options);
    },

    loadTheme: function (callback) {

      var styleEl = document.createElement("style");
      var styleData = document.createTextNode("<%theme-css%>");
      styleEl.appendChild(styleData);

      var loaded = false;
      styleEl.onload = Util.bind(function () {
        if (!loaded && callback) {
          callback.call(this);
          loaded = true;
        }
      }, this);

      document.getElementsByTagName("head")[0].appendChild(styleEl);
    },

    render: function () {
      // remove current element (if we've already rendered)
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        delete this.element;
      }

      this.element = DomBuilder.build(this.options.markup, this);
      if (!this.container.firstChild) {
        this.container.appendChild(this.element);
      } else {
        this.container.insertBefore(this.element, this.container.firstChild);
      }
    },

    dismiss: function (evt) {
      evt.preventDefault && evt.preventDefault();
      evt.returnValue = false;
      this.setDismissedCookie();
      this.container.removeChild(this.element);
    },

    setDismissedCookie: function () {
      Util.setCookie(DISMISSED_COOKIE, 'yes', this.options.expiryDays);
    }
  };

  var init;
  var initialized = false;
  (init = function () {
    if (!initialized && document.readyState == 'complete') {
      fubracookiebar.init();
      initialized = true;
    }
  })();

  Util.addEventListener(document, 'readystatechange', init);

})();
