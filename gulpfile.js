var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var replace = require("gulp-replace");

gulp.task('sass', function () {
  gulp.src('./styles/*.scss')
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('minify', ['sass'], function () {

  var fs = require("fs");
  var themeData=fs.readFileSync("./dist/theme.css", "utf8");

  var minifyPipe =
    gulp.src('./fubracookiebar.js')
    .pipe(replace('<%theme-css%>', themeData.trim()))
    .pipe(uglify())
    .pipe(rename('fubracookiebar.min.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['minify']);
gulp.task('default', ['build']);
