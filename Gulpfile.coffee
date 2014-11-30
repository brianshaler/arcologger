gulp = require 'gulp'
gutil = require 'gulp-util'
browserify = require 'gulp-browserify'
coffee = require 'gulp-coffee'
plumber = require 'gulp-plumber'
rename = require 'gulp-rename'
watch = require 'gulp-watch'

gulp.task 'client', ->
  gulp.src 'node/public/js/index.js'
  .pipe browserify()
  .on 'error', gutil.log
  .on 'error', gutil.beep
  .pipe rename 'app.js'
  .pipe gulp.dest 'node/public/js'

gulp.task 'coffee', ->
  gulp.src 'coffee/**/*.coffee'
  .pipe coffee()
  .pipe gulp.dest 'node'

gulp.task 'watch', ['client', 'coffee'], ->
  gulp.watch ['node/public/js/**/*.js', '!node/public/js/app.js'], ['client']

  watch glob: 'coffee/**/*.coffee'
  .pipe plumber()
  .pipe coffee()
  .pipe gulp.dest 'node'

gulp.task 'default', ['coffee', 'client']
