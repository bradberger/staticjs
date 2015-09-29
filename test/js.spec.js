/* eslint-env karma,jasmine */
/* global $static */
describe("javascript test suite", function() {

    window.localStorage.clear();

    var url = "https://cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js";
    var url2 = "/invalid.js";

    beforeEach(function() {
        $static._$$reset();
    });

    it("shoud detect .js extensions as js", function() {
        expect($static.isJS(url)).toBe(true);
    });

    it("shoud not detect non-js extensions as js", function() {
        expect($static.isJS("test.jpg")).toBe(false);
        expect($static.isJS("test.js.jpg")).toBe(false);
    });

    it("should return a promise from get()", function() {
        expect($static.get(url) instanceof Promise).toBe(true);
    });

    it("should store the promise from get()", function(done) {

        var e = function() {
            expect(Object.keys($static.scripts).length).toBe(1);
            expect($static.scripts[url] instanceof Promise).toBe(true);
            done();
        };

        $static.script([url]).then(e, e);

    });

    it("should not duplicate scripts", function(done) {

        var e = function() {
            expect(Object.keys($static.scripts).length).toBe(1);
            expect($static.scripts[url] instanceof Promise).toBe(true);
            done();
        };

        $static.script([url, url]).then(e, e);

    });

    it("should store each script promise", function(done) {

        var e = function() {
            expect(Object.keys($static.scripts).length).toBe(2);
            expect($static.scripts[url] instanceof Promise).toBe(true);
            expect($static.scripts[url2] instanceof Promise).toBe(true);
            done();
        };

        $static.script([url, url2]).then(e, e);

    });

    it("should cache scripts in localStorage", function(done) {

        $static.cache([url]).then(function() {
            var script = window.localStorage.getItem(url);
            expect(typeof script).toBe("string");
            expect(!!(script || "").length).toBe(true);
            done();
        }, function() {
            expect(false).toBe(true);
            done();
        });

    });

    it("should resolve true with valid script(s)", function(done) {
        $static
            .script([url])
            .then(function() {
                expect(true).toBe(true);
                done();
            }, function() {
                expect(false).toBe(true);
                done();
            });
    });

    it("should clear scripts by url", function(done) {
        $static
            .script([url])
            .then(function() {
                expect(Object.keys($static.scripts).length).toBe(1);
                $static.clear([url]);
                expect(Object.keys($static.scripts).length).toBe(0);
                done();
            });
    });

    it("should reset variables", function() {
        $static
            .script([url])
            .then(function() {
                expect(Object.keys($static.scripts).length).toBe(1);
                $static._$$reset();
                expect(Object.keys($static.scripts).length).toBe(1);
            });
    });

});
