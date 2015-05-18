(function() {
  var os = require("os");
  var winston = require('winston'); require('winston-logstash');
  winston.emitErrs = true;

  var devmetricsObj;

  module.exports = function devmetricsCoreInit (options) {
    options = options || {};
    if (devmetricsObj && !options['no_cache']) return devmetricsObj;

    var hostname = os.hostname() || 'undefined_host';
    var version = options['code_version'] ? options['software_version'] : 1;
    var host = options['host'] || 'service.devmetrics.io';
    var port = options['port'] || 5545;
    var app_id = options['token'] ? options['token'] : hostname.replace(/[\W_]+/g, "_"); // alphanum for token

    var loggerObj = new winston.Logger({
      transports: [
        new winston.transports.Logstash({
          level: 'debug',
          port: port,
          node_name: app_id,
          host: host,
          handleExceptions: true
        })
      ],
      exitOnError: false
    });

    var stdLogger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          level: 'info',
          handleExceptions: true,
          json: false,
          colorize: true
        })
      ],
      exitOnError: false
    });

    var constructObj = function(event_type, level, message, request) {
      var stack_trace = null;
      var exception = null;
      var text = message;
      var obj = {};
      if (event_type == 'exception') {
        obj = extend(obj, {
            'exception_stack' : message.stack,
            'error': 1
          });
        text = message.message;
      }
      obj = extend(obj, {
        "app_id": app_id,
        "event_type": event_type,
        "host": hostname,
        "session": request && request.session ? request.session.id : '',
        "request_uri": request && request.path ? request.path.replace(/[\/\.]/g, "-").join('-') : '',
        "message": event_type + ": " + text,
        "version": version,
        "timestamp": new Date().getTime(),

        "severity": level || 'info',
        "uri": ''
      });
      return obj;
    }

    var mainLogger = function(event_type, level, message, request, params) {
      var obj2send = constructObj(event_type, message, level, request);
      if (params) obj2send['params'] = params;

      obj2send = JSON.stringify(obj2send);

      if (loggerObj[level] && typeof loggerObj[level] == 'function') {
        loggerObj[level](obj2send);
      } else {
        loggerObj.info(obj2send);
      }

      if (stdLogger[level] && typeof stdLogger[level] == 'function') {
        stdLogger[level](message);
      }
    };

    devmetricsObj = {
      log: function (level, text, request) {
        mainLogger('user_event', level, text, request);
      },
      event: function (level, text, params, request) {
        mainLogger('user_event', level, text, request, params);
      },
      exception: function (level, err, request) {
        mainLogger('exception', level, err, request, err);
      }
    };

    devmetricsObj.log('info', 'Checkout dashboards @ http://devmetrics.io/dashboard/' + app_id);

    return devmetricsObj;
  }

})();