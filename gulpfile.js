var gulp = require('gulp');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var jade = require('gulp-jade');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var browserSync = require('browser-sync');

gulp.task('css', function() {
  gulp.src('source/sass/sass.scss')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(rename('style.css'))
    .pipe(gulp.dest('public/css'))
    .pipe(browserSync.reload({stream:true}))
});

gulp.task('html', function() {
  gulp.src('source/jade/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('public/views'))
    .pipe(browserSync.reload({stream:true}))
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

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: "./"
    }
  });
});

gulp.task('default', ['css', 'html', 'js']);

gulp.task('start', ['browser-sync', 'watch']);

