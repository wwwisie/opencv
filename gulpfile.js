var gulp = require("gulp");
    sass = require("gulp-sass");
    sass = require("gulp-sass"),
    postcss = require("gulp-postcss"),
    autoprefixer = require("autoprefixer"),
    cssnano = require("cssnano"),
    sourcemaps = require("gulp-sourcemaps");
    browserSync = require("browser-sync").create();

// Define tasks after requiring dependencies

var paths = {
  styles: {
    // By using styles/**/*.scss we're telling gulp to check all folders for any sass file
    src: "scss/**/*.scss",
    // Compiled files will end up in whichever folder it's found in (partials are not compiled)
    dest: "css"
  }


   ,html: {
    src: '*.html',
   }
};

function style() {
  return (
    gulp
    .src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .on("error", sass.logError)
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest))
    // Add browsersync stream pipe after compilation
    .pipe(browserSync.stream())
  );
}
exports.style = style;

function reload() {
    browserSync.reload();
}

function watch() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch(paths.styles.src, style);
    gulp.watch("*").on('change', browserSync.reload);
    // We should tell gulp which files to watch to trigger the reload
    // This can be html or whatever you're using to develop your website
    // Note -- you can obviously add the path to the Paths object
}
exports.watch = watch