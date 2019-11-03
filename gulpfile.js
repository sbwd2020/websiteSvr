const gulp = require('gulp')
const gulpLoadPlugins = require('gulp-load-plugins')
const autoprefixer = require('autoprefixer')
const browserSync = require('browser-sync').create()
const del = require('del')
const runSequence = require('run-sequence')

const browserify = require('browserify')
// const watchify = require('watchify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const glob = require('glob')
const es = require('event-stream')

const fs = require('fs')

// 加载插件
const $ = gulpLoadPlugins()

const reload = browserSync.reload

// 复制文件
gulp.task('copy', () => {
  let copy = gulp.src([
    './src/static/**/*',
    './src/views/**/*.html',
    // './node_modules/tailwindcss/dist/tailwind.css',
    './node_modules/tailwindcss/dist/tailwind.min.css',
    './node_modules/tailwindcss/dist/tailwind.css.map',
  ]).pipe(gulp.dest((file) => {

    if (file.path.indexOf('views') > -1) {
      return './public/views'
    }
    if (file.path.indexOf('css') > -1) {
      return './public/assets/css'
    }
    if (file.path.indexOf('tailwind') > -1) {
      return './public/assets/css'
    }
    if (file.path.indexOf('fonts') > -1) {
      return './public/assets/fonts'
    }
    return './public/assets'
  })).pipe(
    $.size({
      title: '复制文件'
    })
  )

  return copy
})

// 处理模板
gulp.task('ejs', () => {

  let dir = './src/views'
  let fileArr = []
  // let fileNameArr = []
  let checkDir = (dir) => {
    let currentDir = dir
    let files = fs.readdirSync(currentDir)

    files.forEach(file => {
      let currentFile = currentDir + '/' + file
      let stat = fs.lstatSync(currentFile)
      if (stat.isDirectory()) {
        checkDir(currentFile)
      } else {
        fileArr.push(currentFile)
      }
    })
  }

  checkDir(dir)

  fileArr.forEach(file => {
    let jsonName = file.replace('./src/views/', '').replace('.html', '')
    let jsonFile = './src/json/' + jsonName + '.json'
    let jsonData = {}
    if (fs.existsSync(jsonFile)) {
      jsonData = JSON.parse(fs.readFileSync(jsonFile).toString())
    }

    gulp.src(file).pipe(
      $.ejs(jsonData)
    ).pipe(
      gulp.dest('./public/demo')
    )
  })

  console.log('处理ejs模板完毕')
  // var jsonData = require('./src/json/')
  // console.log(jsonData) // TODO动态数据处理未解决
  // let ejs = gulp.src([
  //   './src/views/**/*.html'
  // ]).pipe(
  //   $.ejs(jsonData)
  // ).pipe(
  //   gulp.dest('./public/demo')
  // ).pipe(
  //   $.size({
  //     title : '处理ejs模板'
  //   })
  // )
  //
  // return ejs
})

// 处理less
gulp.task('less', () => {
  let less = gulp.src([
    './src/assets/less/**/*.less'
  ]).pipe(
    // 输出错误
    $.plumber({
      errorHandler: (err) => {
        console.log(err)
        this.emit('end')
      }
    })
  ).pipe(
    // css前缀预处理
    $.postcss([
      autoprefixer({
        browsers: ['last 2 versions']
      })
    ])
  ).pipe(
    $.less()
  ).pipe(
    gulp.dest('./public/assets/css')
  ).pipe(
    $.minifyCss({
      compatibility: 'ie7'
    })
  ).pipe(
    $.rename({
      suffix: '.min'
    })
  ).pipe(
    gulp.dest('./public/assets/css')
  ).pipe(
    $.size({
      title: '处理less文件'
    })
  )

  return less
})

// 处理js
gulp.task('js', (done) => {
  glob('./src/assets/js/*.js', function (err, files) {
    if (err) {
      done(err)
    }
    console.log(files)
    let tasks = files.map((file) => {
      let outName = file.replace('./src/assets/js/', '')
      return browserify({
        entries: [file]
      }).transform(
        'babelify', {
          'comments': false
        }).bundle().pipe(
        source(outName)
      ).pipe(
        buffer()
      ).pipe(
        gulp.dest('./public/assets/js')
      )
    })

    es.merge(tasks).on('end', done)
  })
})
// 删除上次编译的文件
gulp.task('del', () => {
  return del([
    './public/assets/*',
    './public/views/*',
  ], {
    dot: true
  })
})

// 监听
if (process.env.NODE_ENV = 'dev') {

  gulp.task('watch', () => {
    gulp.watch(['./src/views/**/**/*'], ['copy', reload])
    gulp.watch(['./src/assets/less/**/**/*'], ['less', reload])
    gulp.watch(['./src/assets/js/**/**/*'], ['js', reload])
  })

  gulp.task('start', ['default'], () => {
    let port = require('./config/index').port
    browserSync.init({
      notify: false,
      logPrefix: 'ASK',
      // server: './public'
      proxy: 'http://localhost:' + port
    })

    // gulp.watch(['./src/**/*'] , reload)
  })

  gulp.task('default', () => {
    runSequence('del', ['copy', 'less', 'js'], 'watch')
  })

} else {

  gulp.task('watch', () => {
    gulp.watch(['./src/views/**/**/*'], ['copy', 'ejs', reload])
    gulp.watch(['./src/json/**/**/*'], ['ejs', reload])
    gulp.watch(['./src/assets/less/**/**/*'], ['less', reload])
    gulp.watch(['./src/assets/js/**/**/*'], ['js', reload])
  })

  gulp.task('start', ['default_local'], () => {
    browserSync.init({
      notify: false,
      logPrefix: 'ASK',
      server: './public'
    })

    // gulp.watch(['./public/**/*'] , reload)
  })


  gulp.task('default_local', (cb) => {
    runSequence('del', ['copy', 'ejs', 'less', 'js'], 'watch', cb)
  })
}