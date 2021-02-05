"use strict";

const {src, dest} = require("gulp");
const gulp = require("gulp");
const nodePath = require('path');
const autoprefixer = require("gulp-autoprefixer");
const cssbeautify = require("gulp-cssbeautify");
const removeComments = require('gulp-strip-css-comments');
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const less = require("gulp-less");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const plumber = require("gulp-plumber");
const panini = require("panini");
const imagemin = require("gulp-imagemin");
const del = require("del");
const notify = require("gulp-notify");
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const browserSync = require("browser-sync").create();
const smartGrid = require('smart-grid');
const sourcemaps = require('gulp-sourcemaps');
const purgecss = require('gulp-purgecss');
const gcmq = require('gulp-group-css-media-queries');
const webp = require('gulp-webp');
const ttf2woff2 = require('gulp-ttf2woff2');
const critical = require('critical');
const htmlmin = require('gulp-htmlmin');
const strip = require('gulp-strip-comments');
const imageminWebp = require('imagemin-webp');

/* Webpack */
const VueLoaderPlugin = require('vue-loader/lib/plugin');

/* Paths */
const srcPath = 'src/';
const distPath = 'dist/';
const smartPath = './smartgrid.js';
const cssPreprocessor = 'less';

const path = {
    build: {
        html:       distPath,
        js:         distPath + "assets/js/",
        css:        distPath + "assets/css/",
        cssChunc:   distPath + "assets/css/chunc",
        images:     distPath + "assets/images/",
        fonts:      distPath + "assets/fonts/"
    },
    src: {
        html:   srcPath + "*.html",
        js:     srcPath + "assets/js/*.js",
        css:    srcPath + "assets/" + cssPreprocessor + "/*." + cssPreprocessor,
        images: srcPath + "assets/images/**/*.{jpg,jpeg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    watch: {
        html:   srcPath + "**/*.html",
        js:     srcPath + "assets/js/**/*.js",
        css:    srcPath + "assets/" + cssPreprocessor + "/**/*." + cssPreprocessor,
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    clean: "./" + distPath
}



/* Tasks */

function serve() {
    browserSync.init({
        server: {
            baseDir: "./" + distPath
        }
    });
}

function html(cb) {
    panini.refresh();
    return src(path.src.html, {base: srcPath})
        .pipe(plumber())
        .pipe(panini({
            root:       srcPath,
            layouts:    srcPath + 'layouts/',
            partials:   srcPath + 'partials/',
            helpers:    srcPath + 'helpers/',
            data:       srcPath + 'data/'
        }))
        .pipe(strip())
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function css(cb) {
    return src(path.src.css, {base: srcPath + `assets/${cssPreprocessor}/`})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "SCSS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer({
            cascade: true
        }))
        .pipe(cssbeautify())
        .pipe(gcmq())
        .pipe(purgecss({
            content: ['src/**/*.html']
        }))
        .pipe(sourcemaps.write())
        .pipe(dest(path.build.css))
        .pipe(dest(path.build.cssChunc))
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(removeComments())
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function cssWatch(cb) {
    return src(path.src.css, {base: srcPath + `assets/${cssPreprocessor}/`})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "SCSS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(less())
        // .pipe(rename({
        //     suffix: ".min",
        //     extname: ".css"
        // }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function js(cb) {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "JS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(webpackStream(require('./webpack.config.js'), webpack))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function jsWatch(cb) {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(plumber({
            errorHandler : function(err) {
                notify.onError({
                    title:    "JS Error",
                    message:  "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        }))
        .pipe(webpackStream({
          mode: "development",
          output: {
            filename: 'app.js',
          }
        }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function images(cb) {
    return src(path.src.images)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 80, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false },
                ]
            })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function fonts(cb) {
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.reload({stream: true}));

    cb();
}

function clean(cb) {
    return del(path.clean);

    cb();
}

function grid(done) {
    delete require.cache[nodePath.resolve(smartPath)];
    const options = require(smartPath);
    smartGrid('./src/assets/less/vendor', options);
    done();
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], cssWatch);
    gulp.watch([path.watch.js], jsWatch);
    gulp.watch([path.watch.images], images);
    gulp.watch([path.watch.fonts], fonts);
    gulp.watch(smartPath, grid);
}

let crPages = ['index', 'contact'];
let crList = {
    '.btn': ['display', 'font-size', 'height', 'line-height', 'padding', 'text-align', 'border'],
}

function criticalCSS(done){
    crPages.forEach(async page => {
        await critical.generate({
            base: './dist/',
            src: `${page}.html`,
            css: [ 'assets/css/style.css' ],
            target: {
                css: `assets/css/${page}-critical.css`,
                //uncritical: `css/${page}-async.css`
            },
            width: 1280,
            height: 480,
            include: [
                '.footer'
            ],
            ignore: {
                rule: [
                    /hljs-/
                ],
                decl(node, value){
                    let { selector } = node.parent;

                    if(!(selector in crList)){
                        return false;
                    }

                    return !crList[selector].includes(node.prop);
                }
            }
        });
    });

    done();
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), criticalCSS);
const watch = gulp.parallel(build, watchFiles, serve);


/* Exports Tasks */
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
exports.grid = grid;
exports.critical = criticalCSS;
