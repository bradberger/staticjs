/*eslint-env node */

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");
var size = require("gulp-size");
var eslint = require("gulp-eslint");
var connect = require("gulp-connect");

gulp.task("build", function() {
    return gulp
        .src(__dirname + "/src/static.js")
        .pipe(uglify())
        .pipe(size({ gzip: true, prettySize: true, showFiles: true }))
        .pipe(gulp.dest("dist"))
        .pipe(connect.reload());
});

gulp.task("build:polyfill", function() {
    return gulp
        .src([
            __dirname + "/node_modules/es6-promise/dist/es6-promise.min.js",
            __dirname + "/src/polyfills.js",
            __dirname + "/src/static.js"
        ])
        .pipe(concat("static.compat.js"))
        .pipe(uglify())
        .pipe(size({ gzip: true, prettySize: true, showFiles: true }))
        .pipe(gulp.dest("dist"));
});

gulp.task("lint", function() {
    return gulp
        .src(__dirname + "/src/**/*.js")
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task("lint:fail", function() {
    return gulp
        .src(__dirname + "/src/**/*.js")
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task("watch", function() {
    gulp.watch(__dirname + "/src/**/*.js", ["build:all"]);
});

gulp.task("connect", function() {
    connect.server({
        root: "website",
        livereload: true,
        port: 3000
    });
});

gulp.task("build:all", ["build", "build:polyfill"]);

gulp.task("default", ["connect", "watch"]);
