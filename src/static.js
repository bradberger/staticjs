(function() {

    /**
     * A function which does nothing.
     * @return {void} Returns nothing.
     */
    var noop = function() { };

    /**
     * [storage description]
     * @type {[type]}
     */
    var storage = "localStorage" in window ? window.localStorage : {
        getItem: noop,
        setItem: noop,
        removeItem: noop,
        clear: noop
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    var Static = function() {

        /**
         * [bundles description]
         * @type {Object}
         */
        this.bundles = {};

        /**
         * [scripts description]
         * @type {Object}
         */
        this.scripts = {};

        /**
         * [stylesheets description]
         * @type {Object}
         */
        this.stylesheets = {};

        /**
         * [images description]
         * @type {Object}
         */
        this.images = {};

        /**
         * [clientHints description]
         * @type {Boolean}
         */
        this.clientHints = false;

        /**
         * [saveData description]
         * @type {Boolean}
         */
        this.saveData = false;

    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Static.prototype.enableClientHints = function() {
        this.clientHints = true;
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Static.prototype.disableClientHints = function() {
        this.clientHints = false;
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Static.prototype.enableSaveData = function() {
        this.saveData = true;
    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Static.prototype.disableSaveData = function() {
        this.saveData = false;
    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    Static.prototype.isJS = function(url) {
        return !!url.toString().match(/.*\.js+$/i);
    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    Static.prototype.isCSS = function(url) {
        return !!url.toString().match(/.*\.css+$/i);
    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    Static.prototype.isImage = function(url) {
        return !!url.toString().match(/.*\.(jpe?g|png|webp|gif)+$/i);
    };

    /**
     *
     * @param {string} bundle Name of the bundle.
     * @returns {Promise}
     */
    Static.prototype.ready = function(bundle) {

        var self = this;

        // If ready() is called before the bundle is defined.
        return new Promise(function (resolve) {

            // Set a timeout to check for the existence of the bundle.
            // This uses requestAnimationFrame for quickest response,
            // and better cpu management.
            var checkForBundle = function() {

                if (self.bundles[bundle]) {
                    cancelAnimationFrame(checkForBundle);
                    self.bundles[bundle].then(resolve);
                    return;
                }

                requestAnimationFrame(checkForBundle);

            };

            checkForBundle();

        });

    };

    /**
     *
     * @param resources
     * @param {?string} bundle
     * @returns {*}
     */
    Static.prototype.load = function(resources, bundle) {

        var self = this;

        // Cached bundle.
        if ("string" === typeof bundle && this.bundles[bundle]) {
            return this.bundles[bundle];
        }

        var promise = Promise.all(resources.map(function(url) {

            if (self.isJS(url)) {
                return self.script([url]);
            }

            if (self.isCSS(url)) {
                return self.css(url);
            }

            return self.image(url);

        }));

        if ("string" === typeof bundle) {
            this.bundles[bundle] = promise;
        }

        return promise;

    };

    /**
     * [function description]
     * @param  {array} resources [description]
     * @param  {string} bundle    [description]
     * @return {Promise}           [description]
     */
    Static.prototype.sync = function(resources, bundle) {

        var self = this;

        if(bundle && this.bundles[bundle]) {
            return this.bundles[bundle];
        }

        var promise = new Promise(function(resolve, reject) {

            var promise = self.load(resources.shift());
            resources.forEach(function(url) {
                promise.then(function() {
                    return self.load(url);
                }, reject);
            });

            promise.then(resolve);

        });

        // Save the bundle, if supplied.
        if (bundle) {
            this.bundles[bundle] = promise;
        }

        return promise;

    };

    /**
     *
     * @param href
     * @param media
     * @returns {Promise}
     */
    Static.prototype.loadCSS = function(href, media) {

        return this.stylesheets[href] = this.stylesheets[href] || new Promise(function (resolve, reject) {

            var ss = window.document.createElement("link");
            var ref = window.document.getElementsByTagName("script")[0];
            var sheets = window.document.styleSheets;

            ss.rel = "stylesheet";
            ss.href = href;
            ss.media = "only x";
            ss.onerror = reject;
            ss.onload = resolve;

            ref.parentNode.insertBefore(ss, ref);
            ss.onloadcssdefined = function(cb){
                var defined;
                for (var i = 0; i < sheets.length; i++){
                    if( sheets[i].href && sheets[i].href === ss.href ){
                        defined = true;
                    }
                }
                if(defined){
                    cb();
                } else {
                    setTimeout(function() {
                        ss.onloadcssdefined(cb);
                    });
                }
            };

            ss.onloadcssdefined(function() {
                ss.media = media || "all";
            });

        });

    };

    /**
     *
     * @param {array|string} url
     * @returns {Promise}
     */
    Static.prototype.css = function(url) {

        var self = this;
        return Array.isArray(url) ? Promise.all(url.map(function(item) {
            return self.loadCSS(item);
        })) : self.loadCSS(url);

    };

    /**
     *
     * @param {string} src
     * @returns {Promise}
     */
    Static.prototype.loadScript = function(src) {
        return this.scripts[src] = this.scripts[src] || new Promise(function (resolve, reject) {
            var t = document.getElementsByTagName("script")[0];
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = s.onabort = reject;
            t.parentNode.insertBefore(s, t);
        });
    };

    /**
     *
     * @param {array|string} url
     * @returns {Promise}
     */
    Static.prototype.script = function(url) {
        var self = this;
        return Promise.all(url.map(function(item) {
            return self.loadScript(item);
        }));
    };

    /**
     * [function description]
     * @param  {[type]} src     [description]
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    Static.prototype.loadImage = function(src, element) {

        this.images[src] = this.images[src] || new Promise(function (resolve, reject) {

            var img = new Image();
            img.src = src;
            img.onerror = reject;
            img.onload = function() {
                // If passing an element, replace the element
                // with the new image.
                if (element instanceof HTMLElement) {
                    element.appendChild(img);
                }
                resolve(img);
            };

        });

        return this.images[src];

    };

    /**
     *
     * @param {array} src
     * @returns {Promise}
     */
    Static.prototype.image = function(src) {

        var self = this;
        return Promise.all(src.map(function(item) {
            return self.loadImage(item);
        }));

    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    Static.prototype.get = function(url) {

        return new Promise(function(resolve, reject) {

            var contents = storage.getItem(url);
            if(contents) {
                resolve(contents);
                return;
            }

            var req = new XMLHttpRequest();
            req.onerror = reject;
            req.open("GET", url, true);
            req.onload = function() {
                try {
                    storage.setItem(url, req.responseText);
                    resolve(req.responseText);
                } catch(e) {
                    reject(e);
                }
            };
            req.send();

        });

    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    Static.prototype.getScript = function(url, ele) {
        this.get(url).then(function(data) {
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.text = data;
            (ele || document.head).appendChild(s);
        });
    };

    /**
     * [function description]
     * @param  {[type]} url [description]
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    Static.prototype.getStylesheet = function(url, ele) {

        this.get(url).then(function(data) {

            var s = document.createElement("style");
            s.type = "text/css";
            s.text = data;

            (ele || document.head).appendChild(s);

        });

    };

    /**
     * [function description]
     * @param  {[type]} url    [description]
     * @param  {[type]} parent [description]
     * @return {Promise}        [description]
     */
    Static.prototype.getImage = function(url, parent) {

        var self = this;
        var type = typeof parent;
        if ("undefined" !== type) {
            if ("string" == type) {
                parent = document.querySelector(parent);
            }
            if (! parent instanceof HTMLElement) {
                parent = null;
            }
        }

        var promise = new Promise(function(resolve, reject) {

            // var contents = storage.getItem(url);
            // if(contents) {
            //     resolve(contents);
            //     return;
            // }

            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onerror = reject;

            if (self.clientHints) {

                // Check for connection speed.
                var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection) {
                    req.setRequestHeader("Downlink", connection.downlinkMax);
                }

                // Set Save-Data
                req.setRequestHeader("Save-Data", self.saveData ? 1 : 0);

                // Set DPR
                req.setRequestHeader("DPR", window.devicePixelRatio || 1);

                // Set Viewport-Width
                req.setRequestHeader("Viewport-Width", document.documentElement.clientWidth	|| window.innerWidth);

                // Set width of parent element.
                if(parent) {
                    req.setRequestHeader("Width", parent.offsetWidth);
                }

            }

            req.onload = function() {
                var arr = new Uint8Array(this.response);
                var raw = String.fromCharCode.apply(null,arr);
                var b64=btoa(raw);
                var dataURL = "data:" + this.getResponseHeader("Content-Type") + ";base64,"+b64;
                resolve(dataURL);
            };

            req.send();

        });

        if (parent) {
            promise.then(function(data) {
                var img = new Image();
                img.src = data;
                parent.appendChild(img);
            });
        }

        return promise;

    };

    /**
     * [function description]
     * @param  {Array} url    [description]
     * @param  {string} bundle [description]
     * @return {Promise}        [description]
     */
    Static.prototype.cache = function(url, bundle) {

        var self = this;
        var promise = Promise.all(url.map(function(src) {

            if (self.isJS(src)) {
                return self.getScript(url);
            }

            if (self.isCSS(src)) {
                return self.getStylesheet(url);
            }

            if (self.isImage(url)) {
                return self.getImage(url);
            }

        }));

        if ("string" === typeof bundle) {
            this[bundle] = this.bundles[bundle] = promise;
        }

        return promise;

    };

    /**
     * [function description]
     * @param  {[type]} selector [description]
     * @return {[type]}          [description]
     */
    Static.prototype.loadImagesBySelector = function(selector) {
        var cachedList = document.querySelectorAll(selector || ".mobile-img");
        for (var i = 0, _i = cachedList.length; i < _i; ++i) {
            var item = cachedList[i];
            var url = item.getAttribute("data-src");
            if (url) {
                this.getImage(url, item);
            }
        }
    };

    /**
     * [function description]
     * @param  {Array} resources [description]
     * @return {[type]}           [description]
     */
    Static.prototype.clear = function(resources) {

        var self = this;
        resources.forEach(function(key) {
            storage.removeItem(key);
            if (self.scripts[key]) {
                delete self.scripts[key];
            }
            if (self.stylesheets[key]) {
                delete self.stylesheets[key];
            }
            if (self.images[key]) {
                delete self.images[key];
            }
        });

    };

    /**
     * [function description]
     * @return {[type]} [description]
     */
    Static.prototype._$$reset = function() {

        this.bundles = {};
        this.scripts = {};
        this.stylesheets = {};
        this.images = {};
        this.clientHints = false;
        this.saveData = false;

    };

    window.$static = new Static();

})();
