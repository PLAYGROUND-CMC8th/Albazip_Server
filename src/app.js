var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//mysql 연동
var sequelize = require('./models/index').sequelize;
sequelize.sync();

var indexRouter = require('./routes/index');
var app = express();

var cron = require('node-cron');
var scheduleUtil = require('./module/scheduleUtil');
var taskUtil = require('./module/taskUtil');

//매일 밤 00:00, 내일 업무 생성, 100일 후 스케줄 생
cron.schedule('0 0 0 * * *', function () {
  scheduleUtil.makeAllSchedule();
  taskUtil.makeAllTask();
});

/*cron.schedule('*!/10 * * * * *', function () {
  console.log("cron test");
});*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
