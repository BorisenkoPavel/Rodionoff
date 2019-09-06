var syntax        = 'sass', // Syntax: sass or scss;
    gulpversion   = '4'; // Gulp version: 3 or 4

var gulp                    = require('gulp'),
    sass                    = require('gulp-sass'),
    browserSync             = require('browser-sync'),
    concat                  = require('gulp-concat'),
    terser                  = require('gulp-terser'),
    cleancss                = require('gulp-clean-css'),
    rename                  = require('gulp-rename'),
    autoprefixer            = require('gulp-autoprefixer'),
    notify                  = require('gulp-notify'),
    rsync                   = require('gulp-rsync'),
    plumber                 = require('gulp-plumber'),
    pug                     = require('gulp-pug')
    svgSprite               = require('gulp-svg-sprite'),
    svgmin                  = require('gulp-svgmin'),
    cheerio                 = require('gulp-cheerio'),
    replace                 = require('gulp-replace'),
    imagemin                = require('gulp-imagemin'),
    imageminJpegRecompress  = require('imagemin-jpeg-recompress'),
    pngquant                = require('imagemin-pngquant'),
    cache                   = require('gulp-cache'),
    cached                  = require('gulp-cached'),
    dependents              = require('gulp-dependents'),
    remember                = require('gulp-remember'),
    sourcemaps              = require('gulp-sourcemaps'),
    debug                   = require('gulp-debug'),
    gulpif                  = require('gulp-if'),
    emitty                  = require('emitty').setup('src/pug', 'pug'),
    imgPATH                 = {
                              "input": ["src/img/**/*.{png,jpg,gif,svg}",
                                  '!src/img/svg/*'],
                              "ouput": "build/img/"
                              };
    svgPath                 = {
                                "input": "src/img/svg/*.svg",
                                "output": "build/img/svg/"
															};
const del                   = require('del');

gulp.task('clean', function(){
  return del('build/**', {force:true});
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: 'build'
    },
    notify: false,
    // open: false,
    // online: false, // Work Offline Without Internet Connection
    // tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
  })
});

gulp.task('styles', function() {
  return gulp.src('src/scss/main.'+syntax+'')
  .pipe(sourcemaps.init())
  .pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
  .pipe(plumber())
  .pipe(rename({ suffix: '.min', prefix : '' }))
  .pipe(autoprefixer(['last 15 versions']))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('build/css'))
  .pipe(browserSync.stream())
});

gulp.task('styles:build', function() {
  return gulp.src('src/scss/**/*.'+syntax+'')
  .pipe(sourcemaps.init())
  .pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
  .pipe(plumber())
  .pipe(rename({ suffix: '.min', prefix : '' }))
  .pipe(autoprefixer(['last 15 versions']))
  .pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('build/css'))
  .pipe(browserSync.stream())
});

gulp.task('scripts', function() {
  return gulp.src([
    'node_modules/svg4everybody/dist/svg4everybody.min.js',
    'src/js/common.js', // Always at the end
    ])
  .pipe(cached('script'))
  .pipe(sourcemaps.init())
  .pipe(terser()) // Mifify js (opt.)
  .pipe(sourcemaps.write())
  .pipe(remember('script'))
  .pipe(concat('scripts.min.js'))
  .pipe(gulp.dest('build/js'))
  .pipe(browserSync.reload({ stream: true }))
});

gulp.task('code', function() {
  return gulp.src('build/*.html')
  .pipe(browserSync.reload({ stream: true }))
});

gulp.task('rsync', function() {
  return gulp.src('build/**')
  .pipe(rsync({
    root: 'build/',
    hostname: 'pugach_pb@ftp.pugach.nichost.ru',
    destination: '/testfolder',
    // include: ['*.htaccess'], // Includes files to deploy
    // exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
    recursive: true,
    archive: true,
    silent: false,
    compress: true,
    chmod: "ugo=rwX"
  }))
});

// gulp.task('pug', function() {
//   return gulp.src(['src/pug/*.pug', 'src/pug/pages/*.pug'])
//   .pipe(plumber())
//   .pipe(pug({pretty: true}))
//   .pipe(gulp.dest('build'))
//   .pipe(browserSync.reload({ stream: true }))
// });

gulp.task('pug', () =>
	new Promise((resolve, reject) => {
		emitty.scan(global.emittyChangedFile).then(() => {
			gulp.src(['src/pug/*.pug', 'src/pug/pages/*.pug'])
				.pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
				.pipe(pug({ pretty: true }))
				.pipe(gulp.dest('build'))
				.on('end', resolve)
				.on('error', reject);
		});
	})
);

gulp.task('fonts', () => {
  return gulp.src('src/fonts/**/*.*')
    .pipe(gulp.dest('build/fonts/'));
});

gulp.task('svg', () => {
  return gulp.src(svgPath.input)
      .pipe(svgmin({
          js2svg: {
              pretty: true
          }
      }))
      .pipe(cheerio({
          run: function ($) {
            $('[fill]').each( function(index, elem) {
              if (!$(elem).is('[fill="currentColor"]')) {
                $(elem).removeAttr('fill');
              }
            });
              $('[stroke]').removeAttr('stroke');
              $('[style]').removeAttr('style');
          },
          parserOptions: {xmlMode: true}
      }))
      .pipe(replace('&gt;', '>'))
      .pipe(svgSprite({
          mode: {
              symbol: {
                  sprite: "sprite.svg"
              }
          }
      }))
      .pipe(gulp.dest(svgPath.output));
});

gulp.task('img:src', () => {
  return gulp.src(imgPATH.input).pipe(gulp.dest(imgPATH.ouput));
});

gulp.task('img:build', () => {
  return gulp.src(imgPATH.input)
      .pipe(cache(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imageminJpegRecompress({
              loops: 4,
              min: 70,
              max: 80,
              quality: 'high'
          }),
          imagemin.svgo(),
          imagemin.optipng({optimizationLevel: 3}),
          pngquant({quality: '65-70', speed: 5})
      ], {
          verbose: true
      })))
      .pipe(gulp.dest(imgPATH.ouput));
});

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('styles:build', 'scripts', 'fonts', 'pug','svg', 'img:build')
));

if (gulpversion == 3) {
  gulp.task('watch', ['styles', 'scripts', 'browser-sync'], function() {
    gulp.watch('build/scss/**/*.'+syntax+'', ['styles']);
    gulp.watch(['libs/**/*.js', 'build/js/common.js'], ['scripts']);
    gulp.watch('build/*.html', ['code'])
  });
  gulp.task('default', ['watch']);
}

if (gulpversion == 4) {
  gulp.task('watch', () => {
    // Shows that run "watch" mode
    global.watch = true;
  
    gulp.watch('src/pug/**/*.pug', gulp.series('pug')).on('all', (event, filepath) => {global.emittyChangedFile = filepath;});
    gulp.watch(['src/scss/**/*.'+syntax+'', 'src/scss/**/*.scss'], gulp.parallel('styles'));
    gulp.watch(['libs/**/*.js', 'src/js/common.js'], gulp.parallel('scripts'));
    gulp.watch('build/*.html', gulp.parallel('code'))
    gulp.watch('src/fonts/**/*.*', gulp.parallel('fonts'))
    gulp.watch(['src/img/general/**/*.{png,jpg,gif}',
    'src/img/content/**/*.{png,jpg,gif}'], gulp.parallel('img:src'));
    gulp.watch('src/img/svg/*.svg', gulp.parallel('svg'));
  });
  gulp.task('default', gulp.parallel('styles', 'fonts', 'scripts', 'pug', 'watch','svg', 'img:src', 'browser-sync' ));
}
