[![Build Status](https://semaphoreci.com/api/v1/projects/1abfb0d9-1eb1-4b43-bac0-4ca3a04f5048/549732/badge.svg)](https://semaphoreci.com/brad/staticjs)
[![Code Climate](https://codeclimate.com/github/bradberger/staticjs/badges/gpa.svg)](https://codeclimate.com/github/bradberger/staticjs)
[![Test Coverage](https://codeclimate.com/github/bradberger/staticjs/badges/coverage.svg)](https://codeclimate.com/github/bradberger/staticjs/coverage)

`static.js` is a full-featured, lightweight resource loading library for
JavaScript.  supports loading of JavaScript, CSS, and image files. It uses
modern JS features to have a small footprint and excellent performance.

Current size is `~1.28 kB` gzipped, and `~3.9 kB` with all polyfills.

## Browser support

The library uses JavaScript promises, so you'll need to
use the `loader.compat.js` script if the target browser(s)
don't already [support promises](http://caniuse.com/#search=promises).

Other more recent JavaScript methods are used, too. Again, you'll
need to use the `loader.compat.js` version if the target browsers
do not support those features.

- `Array.isArray` [Browser support](http://kangax.github.io/compat-table/es5/#Array.isArray)
- `Array.prototype.forEach` [Browser support](http://kangax.github.io/compat-table/es5/#Array.prototype.forEach)
- `localStorage` [Browser support](http://caniuse.com/#search=localstorage)
- `Array.prototype.map` [Browser support](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Browser_compatibility)
- `window.requestAnimationFrame` [Browser support](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

## Usage

### Bundles

Bundles are useful to load multiple resources at once, and then do something
when their loaded.  can use them for CSS, JavaScript, and images. Using it for
all three types of files is great prevent an unstyled flash of anything.

```javascript

// Define a bundle.
$static.load("//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js", "jquery");

// Promise when a anonymous bundle is loaded.
$static.load("//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css").then(function() {
    console.info("Bootstrap CSS loaded!");
});

// Promise when a named bundle is loaded.
$static.ready("jquery").then(function() {
    $static.load([
        "//cdn.jsdelivr.net/bootstrap/3.3.5/js/bootstrap.min.js",
        "//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css",
        "//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js"
    ]).then(function() {
        console.info("Bootstrap loaded!");
    });
});

// Callback when a named bundle is loaded.
$static.ready("jquery", function() {
    console.info("jQuery done again!");
});

```

#### Setting a callback before defining a bundle.

You can even set a callback before the bundle is defined.
So the following actually works.

```javascript

$static.ready("jquery").then(function() {
    console.log("jQuery is loaded!");
});

$static.load("//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js", "jQuery");

```

### Loading as Inline Elements

// Get the resources and inject the contents
// as innerHTML inside their own element.
$static.get("//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js")
    .then(function() {
        console.info("jquery.get.done");
    });

// Cache the resources in localStorage, and inject
// the content s as innerHTML inside their own element.
$static.cache("//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js")
    .then(function() {
        console.info("jquery.cached");
    });


### Loading Synchronously

Sometimes, it makes sense to load things synchronously.
In that case, you can use the `sync()` method.

```javascript

// Load the resources synchronously.
$static.sync([
    "//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/js/bootstrap.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css"
]);

// Load the resources synchronously as a bundle.
$static.sync([
    "//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/js/bootstrap.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css"
], "bootstrap");

// Alternate syntax for synchronously loading resources.
$static.load([
    "//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/js/bootstrap.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css"
], "bootstrap", true);

// Clearing cached resources from localStorage
$static.clear([
    "//cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/js/bootstrap.min.js",
    "//cdn.jsdelivr.net/bootstrap/3.3.5/css/bootstrap.min.css"
]);

// Resetting everything - clearing cache and settings.
$static.reset();
```

### Loading a Resource Multiple Times

The promises for each resource are reused, so you can safely attempt
loading any given resource multiple times, and it will result in
only a single HTTP request if it's already loaded or in the process
of being loaded.

The above is even true if a single file is in multiple different
bundles, since individual files are cached on the based on the uri,
not the bundle name.

### Known Limitations

#### Content-Types

When using the `sync()`, `get()`, `cache()` and `load()` methods,
the each resource needs to have a `.js` or `.css` extension, otherwise
it will be treated as an image.

This could be fixed by some fancier AJAX techniques like detecting
the content-type headers once loaded, but that's not implemented yet.

#### Loading Images

Loading images (which are stored via localStorage, too!) can be done
like this:

```javascript
<div class="mobile-img" data-src="/my/image/1.png"></div>
<div class="mobile-img" data-src="/my/image/2.png"></div>
$static.loadImagesBySelector(".mobile-img");
```

That method also supports Client Hinting, so if the target server also
supports it, then enable [client hinting](https://developers.google.com/web/updates/2015/09/automating-resource-selection-with-client-hints). Keep in mind that if CORS rules
apply, so third-party images without the proper headers will not load. The
CORS setup on those servers must also support the client-hinting headers, too.

You can also set the "save-data" hint option, too.

```html
<body>
    <div class="mobile-img" data-src="/my/image/1.png"></div>
    <div class="mobile-img" data-src="/my/image/2.png"></div>
    <script>
    $static.enableSaveData();
    $static.enableClientHints();
    $static.loadImagesBySelector(".mobile-img");
    </script>

```

#### Caching Images

Images are converted to base64 before being cached in localStorage. Because
of browser limitations, though, this will fail if the image does not have
the proper `Access-Control-Allow-Origin` set. So if you're using images from
external sources, and they do not have `Access-Control-Allow-Origin: *` or
similar, then caching will fail, and the promise will be rejected.

### Development

The build system is GulpJS, so just run `gulp watch` during development.

### Contributing

Help is very much wanted!

### License

`static.js` is licensed under MPL-2.0.

### To Do

- Full test suite
- Better documentation
- Media type support for CSS
- Rewrite relative url's inside JS/CSS loaded with `cache()`.
