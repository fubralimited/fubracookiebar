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
      dismiss: 'Got it',
      learnMore: 'Read More',
      moreText: '<br/><p><strong>In common with most websites, we use cookies to personalise the content and adverts that you see, to provide social media features and to help analyse our traffic.</p><p>We also share basic information about your use of our site with our social media, advertising and analytics partners, such as Facebook, Twitter, and Google.</strong></p><hr/><p class="small">If you would prefer to disallow certain cookies, most web browsers will give you the ability to adjust your cookie preferences. Alternatively, you could enable private browsing (also known as incognito mode), which means that cookies are only set for your current session and will be deleted when you close the browser.</p>',
      expiryDays: 365,
      markup: [
        '<div class="fookie-wrapper {{containerClasses}}">',
        '<div class="fookie-container fookie-container--open">',
        '<a href="#null" data-cc-event="click:dismiss" target="_blank" class="fookie-btn fookie-btn_accept_all">{{options.dismiss}}</a>',
        '<p class="fookie-message">{{options.message}} <a class="fookie-more_info" href="#popup" class="popup-link">{{options.learnMore}}</a></p>',
        '</div>',
        '<div id="closed"></div>',
        '<div class="popup-wrapper" id="popup">',
      	'<div class="popup-container">',
        '{{options.moreText}}',
    		'<a class="popup-close" href="#closed">X</a>',
      	'</div>',
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
      var styleData = document.createTextNode('.fookie-wrapper{z-index:9001;position:relative;font-family:"Helvetica Neue Light", "HelveticaNeue-Light", "Helvetica Neue", Calibri, Helvetica, Arial}@media print{.fookie-wrapper{display:none;}}.fookie-container{position:fixed;left:0;right:0;bottom:0;overflow:hidden;padding:10px;background:#E2E2E2;border-top:1px solid #dadada;color:#333;font-size:16px;box-sizing:border-box}.fookie-container .fookie-btn{line-height:1em;padding:8px 10px;background-color:#488CD9;cursor:pointer;transition:font-size 200ms;text-align:center;font-size:0.6em;display:block;width:33%;margin-left:10px;float:right;max-width:100px}.fookie-container .fookie-message{margin:0;padding:0;line-height:1.5em;transition:font-size 200ms;font-size:0.6em;display:block}.fookie-container .fookie-btn,.fookie-container .fookie-btn:visited{color:#E2E2E2;background-color:#488CD9;transition:background 200ms ease-in-out,color 200ms ease-in-out,box-shadow 200ms ease-in-out;-webkit-transition:background 200ms ease-in-out,color 200ms ease-in-out,box-shadow 200ms ease-in-out;border-radius:3px;-webkit-border-radius:3px}.fookie-container .fookie-btn:hover,.fookie-container .fookie-btn:active{background-color:#2972c5;color:#E2E2E2}.fookie-container a,.fookie-container a:visited{text-decoration:none;color:#488CD9;transition:200ms color}.fookie-container a:hover,.fookie-container a:active{color:#2972c5}@media screen and (min-width: 500px){.fookie-container .fookie-btn{font-size:0.8em}.fookie-container .fookie-message{font-size:0.8em;margin-top:0.3em}}@media screen and (min-width: 768px){.fookie-container{padding:5px 30px 5px;}.fookie-container .fookie-btn{font-size:1em;padding:5px 10px}.fookie-container .fookie-message{font-size:1em;line-height:1em}}@media screen and (min-width: 992px){.fookie-container .fookie-message{font-size:1em}}@-webkit-keyframes slideUp{0%{-webkit-transform:translateY(66px);transform:translateY(66px)}100%{-webkit-transform:translateY(0);transform:translateY(0)}}@keyframes slideUp{0%{-webkit-transform:translateY(66px);-ms-transform:translateY(66px);transform:translateY(66px)}100%{-webkit-transform:translateY(0);-ms-transform:translateY(0);transform:translateY(0)}}.fookie-container,.fookie-message,.fookie-btn{animation-duration:0.8s;-webkit-animation-duration:0.8s;-moz-animation-duration:0.8s;-o-animation-duration:0.8s;-webkit-animation-name:slideUp;animation-name:slideUp}#popup{visibility:hidden;opacity:0;-webkit-transition:all 0.5s;-moz-transition:all 0.5s;transition:all 0.5s;position:fixed;top:0;left:0;right:0;bottom:0;margin:0}#popup:target{visibility:visible;opacity:1;background-color:rgba(0,0,0,0.8);z-index:99999999999;-webkit-transition:all 0.5s;-moz-transition:all 0.5s;transition:all 0.5s}.popup-container{position:relative;border:1px solid #dadada;margin:7% auto;padding:20px 30px;background-color:#E2E2E2;color:#333;line-height:20px;border-radius:0}.popup-container p{margin:1rem 0 !important;line-height:18px !important;font-size:16px !important}.popup-container p.small{line-height:18px !important;font-size:13px !important}@media (min-width: 768px){.popup-container{width:600px;border-radius:3px;}}a.popup-close{position:absolute;border-radius:3px;top:3px;right:3px;background-color:#488CD9;padding:5px 8px;font-size:20px;text-decoration:none;line-height:1;color:#E2E2E2}');
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
