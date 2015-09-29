/* eslint-env karma,jasmine */
/* global $static */
describe("bundles test suite", function() {


    var script = "https://cdn.jsdelivr.net/jquery/3.0.0-alpha1/jquery.min.js";

    beforeEach(function() {
        $static._$$reset();
    });

    it("should store bundles by name", function(done) {

        $static.load([script], "jquery").then(function() {
            expect(Object.keys($static.bundles).length).toBe(1);
            expect($static.bundles.jquery instanceof Promise).toBe(true);
            done();
        });

    });

    it("should store multiple bundles by name", function(done) {

        $static.load([script], "jquery");
        $static.load([script], "jquery2").then(function() {
            expect(Object.keys($static.bundles).length).toBe(2);
            expect($static.bundles.jquery instanceof Promise).toBe(true);
            expect($static.bundles.jquery2 instanceof Promise).toBe(true);
            done();
        });

    });

    it("should not storage bundles if name not a string (array)", function(done) {
        $static.load([script], []).then(function() {
            expect(Object.keys($static.bundles).length).toBe(0);
            done();
        });
    });

});
