// config
var clientSrc = './src/app';
var clientBase = clientSrc;
var clientDist = './dist/public';
var config = {
  browserify: {
    dest:       clientDist,
    outputName:   'main.js',
    entries:      [
      './src/app/app.ts'
      // './typings/index.d.ts'
    ],
    debug:        false,
    cache:        {},
    packageCache: {}
  },
  sass: {
    srcRoot:      './src/app/sass',
    src:          './src/app/sass/index.scss',
    watch:        './src/app/**/*.scss',
    dest:         './dist/public/css',
    settings:     {
      errLogToConsole: true,
      sourcemap:       true,
      sourcemapPath:   './src/app/sass',
      importer:        require('node-sass-import')
    },
    autoprefixer: {
      settings: {
        browsers: ['last 2 version']
      }
    }
  },
  assets: {
    base: './src/app/assets/',
    src: './src/app/assets/**/*',
    dest: './dist/public'
  },
  html: {
    base: clientBase,
    src: [clientSrc + '/modules/**/*.html'],
    dest: clientDist
  },
  source:     {
    server: './src/server/**/*.ts',
    client: [
      './src/app/**/*.ts',
      './src/app/**/*.js'
    ],
    views:  './src/views/**/*.ejs'
  },
  dist:       {
    server: './dist',
    client: clientDist,
    views:  './dist/views'
  }
  ,
  tsProject:  {
    server: './src/server/tsconfig.json'
  },
  browserSync: {
    reloadDelay:     9999999,
    reloadDebounce:  9999999,
    reloadOnRestart: false,
    tunnel:          false,
    open:            false,
    // informs browser-sync to proxy our expressjs app which would run at the following location
    proxy: 'http://localhost:4000',

    // informs browser-sync to use the following port for the proxied app
    // notice that the default port is 3000, which would clash with our expressjs
    port: 4001,

    // open the proxied app in chrome
    browser: ['google chrome']
  }
};

// required
var path = require('path');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var del = require('del');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var reload = browserSync.reload;
var browserify = require('browserify');
var watchify = require('watchify');
var tsify = require('tsify');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var htmlmin = require('gulp-htmlmin');
var htmlhint = require("gulp-htmlhint");

var BROWSER_SYNC_RELOAD_DELAY = 500;

// ////////////////////////////////////////////////
// Log Errors
// // /////////////////////////////////////////////

var notify = require("gulp-notify");

function errorLog() {

  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
                   title:   "Compile Error",
                   message: "<%= error %>"
                 }).apply(this, args);

  // Keep gulp from hanging on this task
  if (this.end) {
    this.emit('end');
  }
}

var bundleLogger = {
  start: function (filepath) {
    startTime = process.hrtime();
    gutil.log('Bundling', gutil.colors.green(filepath) + '...');
  },

  watch: function (bundleName) {
    gutil.log('Watching files required by', gutil.colors.yellow(bundleName));
  },

  end: function (filepath) {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    gutil.log('Bundled', gutil.colors.green(filepath), 'in', gutil.colors.magenta(prettyTime));
  }
};

//SERVER
gulp.task('clean', function () {
  return del('dist')
});

gulp.task('build:server', function () {
  return gulp.src(config.source.server, {"ignore": ['./src/public']})
      .pipe(sourcemaps.init())
      .pipe(ts(ts.createProject(config.tsProject.server)))
      .js
      .on('error', errorLog)
      // .pipe(concat('server.js'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.dist.server))
      .pipe(reload({stream: true}));
});

//CLIENT

//var templateCache = require('gulp-angular-templatecache');
var templateCache = require('gulp-ngtemplates');

gulp.task('build:html', function () {
  return gulp.src(config.html.src)
      .pipe(sourcemaps.init())
      .pipe(htmlhint({'doctype-first':false, 'attr-lowercase': false}))
      .pipe(htmlhint.reporter())
      .pipe(htmlmin({
                      collapseWhitespace:        true,
                      removeComments:            true,
                      removeTagWhitespace:       true,
                      removeRedundantAttributes: true
                    }))
      .pipe(templateCache())
      .pipe(concat('templates.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.html.dest));
});

gulp.task('build:views', function () {

  return gulp.src(config.source.views)
      .pipe(gulp.dest(config.dist.views))
      .pipe(reload({stream: true}));
});

gulp.task('build:sass', function () {
  var conf = config.sass;
  return gulp.src(conf.src, {base: conf.srcRoot})
      .pipe(sourcemaps.init())
      .pipe(sass(conf.settings).on('error', sass.logError))
      .pipe(sourcemaps.write({includeContent: false, sourceRoot: conf.sourcemapPath}))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(autoprefixer(conf.autoprefixer.settings))
      .pipe(sourcemaps.write('./', {includeContent: false}))
      .pipe(gulp.dest(conf.dest))
});

gulp.task('build:assets', function () {
  //Let's copy our head dependencies into a dest/client/libs
  return gulp.src(config.assets.src, {base:config.assets.base})
      .pipe(gulp.dest(config.assets.dest));
});


function browserifyTask(devMode) {
  var bconfig = config.browserify;
  bundleLogger.start('main.js');
  if (devMode) {
    bconfig.debug = true;
  }
  var b = browserify(bconfig)
      .on('update', bundle)// on any dep update, runs the bundle, only in dev mode
      .on('log', gutil.log)
      .on('error', errorLog)
      .plugin(tsify);

  if (devMode) {
    // b = watchify(b);
    bundleLogger.watch('main.js');
  }


  function bundle() {
    return b
        .bundle()
        .pipe(source(bconfig.outputName))
        .pipe(buffer())
        .pipe(gulpif(devMode, sourcemaps.init())) // loads map from browserify file
        .pipe(gulpif(!devMode, uglify()))
        .pipe(gulpif(devMode, sourcemaps.write()))
        .pipe(gulp.dest(bconfig.dest));
  }

  return bundle();
}

gulp.task('build:public', function () {
  return browserifyTask(true);
});

gulp.task('build:public-prod', function () {
  return browserifyTask(true);
});

// build all
gulp.task('build', function (callback) {
  runSequence('clean', 'build:server', 'build:sass', 'build:assets', 'build:html', 'build:views', 'build:public', callback);
});

gulp.task('build-prod', function (callback) {
  runSequence('clean', 'build:server', 'build:sass', 'build:assets', 'build:html', 'build:views', 'build:public-prod', callback);
});

//serve

gulp.task('serve', ['nodemon'], function () {

  browserSync(config.browserSync);
});

gulp.task('nodemon', function (cb) {
  var called = false;
  return nodemon({

                   // nodemon our expressjs server
                   script: 'dist/server.js',

                   // watch core server file(s) that require server restart on change
                   watch: ['dist/server.js']
                 })
      .on('start', function onStart() {
        // ensure start only got called once
        if (!called) {
          cb();
        }
        called = true;
      })
      .on('restart', function onRestart() {
        // reload connected browsers after a slight delay
        setTimeout(function reload() {
          browserSync.reload({
                               stream: false
                             });
        }, BROWSER_SYNC_RELOAD_DELAY);
      });
});

//start server


// ////////////////////////////////////////////////
// Watch Tasks
// // /////////////////////////////////////////////

gulp.task('watch', function () {
  gulp.watch(config.source.server, ['build:server']);
  gulp.watch(config.source.client, ['build:public']);
  gulp.watch(config.sass.watch, ['build:sass']);
  gulp.watch(config.html.src, ['build:html']);
});

gulp.task('build.watch.serve', function (callback) {
  runSequence('build', 'watch', 'serve', callback);
});

gulp.task('default', ['build.watch.serve']);