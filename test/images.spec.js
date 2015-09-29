/* eslint-env karma,jasmine */
/* global $static */
describe("image test suite", function() {

    window.localStorage.clear();

    var url = "https://www.wikimedia.org/static/images/project-logos/wikisource.png";
    var url2 = "/invalid.png";

    beforeEach(function() {
        $static._$$reset();
    });

    it("shoud detect images extensions as images", function() {
        expect($static.isImage(url)).toBe(true);
    });

    it("shoud not detect non-image extensions as css", function() {
        expect($static.isImage("test.css")).toBe(false);
        expect($static.isImage("test.jpg.css")).toBe(false);
    });

    it("should return a promise from get()", function() {
        expect($static.get([url]) instanceof Promise).toBe(true);
    });

    it("should store the promise from get()", function(done) {

        var e = function() {
            expect(Object.keys($static.images).length).toBe(1);
            expect($static.images[url] instanceof Promise).toBe(true);
            done();
        };

        $static.image([url]).then(e, e);

    });

    it("should not duplicate images", function(done) {

        var e = function() {
            expect(Object.keys($static.images).length).toBe(1);
            expect($static.images[url] instanceof Promise).toBe(true);
            done();
        };

        $static.image([url, url]).then(e, e);

    });

    it("should store each image promise", function(done) {

        var e = function() {
            expect(Object.keys($static.images).length).toBe(2);
            expect($static.images[url] instanceof Promise).toBe(true);
            expect($static.images[url2] instanceof Promise).toBe(true);
            done();
        };

        $static.image([url, url2]).then(e, e);

    });

    it("should cache images in localStorage", function(done) {

        var e = function() {
            var img = window.localStorage.getItem(url);
            expect(typeof img).toBe("string");
            expect((img || "").length > 50).toBe(true);
            done();
        };

        $static.cache([url]).then(e, e);

    });

    it("should resolve true with valid images(s)", function(done) {
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

    it("should disable client hints by default", function() {
        expect($static.clientHints).toBe(false);
    });

    it("should enable client hints", function() {
        $static.enableClientHints();
        expect($static.clientHints).toBe(true);
    });

    it("should disable client hints", function() {
        $static.enableClientHints();
        $static.disableClientHints();
        expect($static.clientHints).toBe(false);
    });

    it("should disable saveData by default", function() {
        expect($static.saveData).toBe(false);
    });

    it("should enable saveData", function() {
        $static.enableSaveData();
        expect($static.saveData).toBe(true);
    });

    it("should disable saveData", function() {
        $static.enableSaveData();
        $static.disableSaveData();
        expect($static.saveData).toBe(false);
    });

});
