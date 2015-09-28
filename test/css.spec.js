/* eslint-env karma,jasmine */
/* global $static */
describe("css test suite", function() {

    var url = "//cdn.jsdelivr.net/angularjs/1.4.2/angular-csp.css";
    var url2 = "/invalid.css";

    beforeEach(function() {
        $static._$$reset();
    });

    it("shoud detect .css extensions as css", function() {
        expect($static.isCSS(url)).toBe(true);
    });

    it("shoud not detect non-css extensions as css", function() {
        expect($static.isCSS("test.jpg")).toBe(false);
        expect($static.isCSS("test.css.jpg")).toBe(false);
    });

    it("should return a promise from get()", function() {
        expect($static.get(url) instanceof Promise).toBe(true);
    });

    it("should store the promise from get()", function(done) {

        var e = function() {
            expect(Object.keys($static.stylesheets).length).toBe(1);
            expect($static.stylesheets[url] instanceof Promise).toBe(true);
            done();
        };

        $static.css(url).then(e, e);

    });

    it("should not duplicate stylesheets", function(done) {

        var e = function() {
            expect(Object.keys($static.stylesheets).length).toBe(1);
            expect($static.stylesheets[url] instanceof Promise).toBe(true);
            done();
        };

        $static.css([url, url]).then(e, e);

    });

    it("should store each stylesheet promise", function(done) {

        var e = function() {
            expect(Object.keys($static.stylesheets).length).toBe(2);
            expect($static.stylesheets[url] instanceof Promise).toBe(true);
            expect($static.stylesheets[url2] instanceof Promise).toBe(true);
            done();
        };

        $static.css([url, url2]).then(e, e);

    });

    it("should cache stylesheets in localStorage", function(done) {

        var e = function() {
            var css = window.localStorage.getItem(url);
            expect(typeof css).toBe("string");
            expect((css || "").length > 50).toBe(true);
            expect((css || "").indexOf("ng-cloak") > -1).toBe(true);
            done();
        };

        $static.cache([url]).then(e, e);

    });

    it("should resolve true with valid stylesheet(s)", function(done) {
        $static
            .css([url])
            .then(function() {
                expect(true).toBe(true);
                done();
            }, function() {
                expect(false).toBe(true);
                done();
            });
    });

});
