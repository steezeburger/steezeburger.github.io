var gulp = require('gulp');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('css', function() {
  gulp.src('source/sass/sass.scss')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(rename('style.css'))
    .pipe(gulp.dest('public/css'))
});

gulp.task('html', function() {
  gulp.src('source/jade/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('public/views'))
});

gulp.task('js', function() {
  gulp.src([
    'bower_components/jquery/dist/jquery.js',
    'bower_components/modernizr/modernizr.js',
    'bower_components/fullpage/jquery.fullpage.js'
  ])
//    .pipe(uglify())
      .pipe(rename('output.min.js'))
    .pipe(gulp.dest('public/js'))
});

gulp.task('watch', function() {
  gulp.watch('source/sass/*.scss', ['css']);
  gulp.watch('source/jade/*.jade', ['html']);
});

gulp.task('default', ['css', 'html', 'js']);
