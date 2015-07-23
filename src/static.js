(function(window) {

    var BUNDLE_INTERVAL_DURATION = 100;
    var emptyFunc = function() { return null; };
    var storage = window.localStorage || {
        getItem: emptyFunc,
        setItem: emptyFunc,
        removeItem: emptyFunc
    };

    var isJavaScript = function(url) {
        return url.toString().toLowerCase().endsWith(".js");
    };

    var isCss = function(url) {
        return url.toString().toLowerCase().endsWith(".css");
    };

    var isImage = function(url) {
        var src = url.toLowerCase();
        return src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".webp");
    };

    /**
     *
     * @constructor
     */
    var Static = function() {
        this.bundles = [];
        this.scripts = {};
        this.stylesheets = {};
        this.images = {};
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
     * @param {?boolean} sync
     * @returns {*}
     */
    Static.prototype.load = function(resources, bundle, sync) {

        var self = this;

        // Handle loading synchronously
        if(sync) {
            return this.sync(resources, bundle);
        }

        // Cached bundle.
        if (bundle && this.bundles[bundle]) {
            return this.bundles[bundle];
        }

        if ("string" === typeof resources) {
            resources = [resources];
        }

        return this[bundle] = this.bundles[bundle] = Promise.all(resources.map(function(url) {

            if (isJavaScript(url)) {
                return self.script(url);
            }

            if (isCss(url)) {
                return self.css(url);
            }

            return self.image(url);

        }));

    };

    Static.prototype.sync = function(resources, bundle) {

        var self = this;

        if(bundle && this.bundles[bundle]) {
            return this.bundles[bundle];
        }

        var promise = new Promise(function(resolve, reject) {

            if ("string" === typeof resources) {
                resources = [resources];
            }

            if (! Array.isArray(resources) || ! resources.length) {
                reject("No resources supplied");
            }

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

        this.stylesheets[href] = this.stylesheets[href] || new Promise(function (resolve, reject) {

            var ss = window.document.createElement("link");
            var ref = window.document.getElementsByTagName("script")[0];
            var sheets = window.document.styleSheets;

            ss.rel = "stylesheet";
            ss.href = href;
            ss.media = "only x";
            ss.onerror = function(err) {
                reject(err);
            };

            ss.onload = function() {
                resolve();
            };

            ref.parentNode.insertBefore( ss, ref );
            ss.onloadcssdefined = function( cb ){
                var defined;
                for( var i = 0; i < sheets.length; i++ ){
                    if( sheets[ i ].href && sheets[ i ].href === ss.href ){
                        defined = true;
                    }
                }
                if( defined ){
                    cb();
                } else {
                    setTimeout(function() {
                        ss.onloadcssdefined( cb );
                    });
                }
            };

            ss.onloadcssdefined(function() {
                ss.media = media || "all";
            });

        });

        return this.stylesheets[href];

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

        this.scripts[src] = this.scripts[src] || new Promise(function (resolve, reject) {

            var t = document.getElementsByTagName("script")[0];
            var s = document.createElement("script");

            s.type = "text/javascript";
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = s.onabort = reject;
            t.parentNode.insertBefore(s, t);

        });

        return this.scripts[src];

    };

    /**
     *
     * @param {array|string} url
     * @returns {Promise}
     */
    Static.prototype.script = function(url) {
        var self = this;
        return Array.isArray(url) ? Promise.all(url.map(function(item) {
            return self.loadScript(item);
        })) : this.loadScript(url);
    };

    /**
     *
     * @param src
     * @returns {Promise}
     */
    Static.prototype.loadImage = function(src) {

        this.images[src] = this.images[src] || new Promise(function (resolve, reject) {

            var img = new Image();
            img.src = src;
            img.onerror = reject;
            img.onload = function() {
                resolve(img);
            };

        });

        return this.images[src];

    };

    /**
     *
     * @param {array|string} src
     * @returns {Promise}
     */
    Static.prototype.image = function(src) {

        var self = this;
        return Array.isArray(src) ? Promise.all(src.map(function(item) {
            return self.loadImage(item);
        })) : this.loadImage(src);

    };

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
                storage.setItem(url, req.responseText);
                resolve(req.responseText);
            };

            req.send();

        });

    };

    Static.prototype.getScript = function(url, ele) {

        this.get(url).then(function(data) {

            var s = document.createElement("script");
            s.type = "text/javascript";
            s.text = data;

            (ele || document.head).appendChild(s);

        });

    };

    Static.prototype.getStylesheet = function(url, ele) {

        this.get(url).then(function(data) {

            var s = document.createElement("style");
            s.type = "text/css";
            s.text = data;

            (ele || document.head).appendChild(s);

        });

    };

    Static.prototype.getImage = function(url, outputFormat) {

        return new Promise(function(resolve, reject) {

            var contents = storage.getItem(url);
            if(contents) {
                resolve(contents);
                return;
            }

            var format = outputFormat || "image/png";
            var img = new Image();

            img.onerror = reject;
            img.onload = function() {

                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d"), dataURL;

                canvas.height = this.height;
                canvas.width = this.width;

                ctx.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL(format);

                resolve(dataURL);

                storage.setItem(url, dataURL);

            };

            img.src = url;

        });

    };

    /**
     * Same as load() except it caches the files in localStorage.
     *
     * @param url
     * @param bundle
     * @returns {*}
     */
    Static.prototype.cache = function(url, bundle) {

        var self = this;

        if("string" === typeof url) {
            url = [url];
        }

        var promise = Promise.all(url.map(function(src) {

            if (isJavaScript(src)) {
                return self.getScript(url);
            }

            if (isCss(src)) {
                return self.getStylesheet(url);
            }

            if (isImage(url)) {
                return self.getImage(url);
            }

        }));

        if ("string" === typeof bundle) {
            this[bundle] = this.bundles[bundle] = promise;
        }

        return promise;

    };

    Static.prototype.clear = function(resources) {

        if("string" === typeof resources) {
            resources = [resources];
        }

        resources.forEach(function(key) {
            storage.removeItem(key);
        });

    };

    window.$static = new Static();

})(window);
