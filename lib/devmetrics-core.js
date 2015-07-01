(function () {
    var os = require("os");
    var winston = require('winston');
    require('winston-logstash-udp');
    var extend = require('extend');
    winston.emitErrs = true;

    var devmetricsObj;

    module.exports = function devmetricsCoreInit(options) {
        options = options || {};
        if (devmetricsObj && !options['no_cache']) return devmetricsObj;

        // Parse options
        var hostname = os.hostname() || 'undefined_host';
        var version = options['code_version'] ? options['software_version'] : 1;
        var host = options['host'] || 'service.devmetrics.io';
        var port = options['port'] || 5545;
        var app_id = options['token'] ? options['token'] : hostname.replace(/[\W_]+/g, "_"); // alphanum for token

        // UDP transport
        var loggerObj = new winston.Logger({
            transports: [
                new winston.transports.LogstashUDP({
                    level: 'debug',
                    port: port,
                    node_name: app_id,
                    host: host,
                    handleExceptions: true
                })
            ],
            exitOnError: false
        });

        // Console logger, optional
        var stdLogger = false;
        if (!options['no_console']) {
            stdLogger = new winston.Logger({
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
        }

        // generic function to construct object for logstash
        var constructObj = function (event_type, message, dimensions, level, request) {
            var stack_trace = null;
            var exception = null;
            var text = message;
            var obj = {};
            if (event_type == 'exception') {
                obj = extend(obj, {
                    'exception_stack': message.stack,
                    'error': 1
                });
                text = message.message;
            }
            event_type = hostname.replace(/[\W_]+/g, "_"); // no whitespace for metric name
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


        /**
         * @param event_name Metric name, all events with same metric name are aggregated
         * @param param optional, Additional info, metric dimension, like subtype
         * @param user_id optional, User unique identifier, used only for log
         * @param comment optinal, Arbitrary human text that would be written to logs, used only for log
         */
        var userEvent = function (event_name, param, user_id, comment) {
        };


        var mainLogger = function (event_type, message, dimensions, request, params) {
            dimensions = dimensions || [];
            var level = dimensions[0] || 'info';
            var obj2send = constructObj(event_type, message, dimensions, level, request);
            if (params) obj2send['params'] = params;

            obj2send = JSON.stringify(obj2send);

            if (loggerObj[level] && typeof loggerObj[level] == 'function') {
                loggerObj[level](obj2send);
            } else {
                loggerObj.info(obj2send);
            }

            if (stdLogger[level] && typeof stdLogger[level] == 'function') {
                stdLogger[level](message);
            } else {
                stdLogger.info(message);
            }
        };

        var utilTagsParser = function(event_tags) {
            event_tags = event_tags || [];
            if( Object.prototype.toString.call( event_tags ) !== '[object Array]' ) { // if not array, convert
                event_tags = [event_tags.toString()];
            }
            return event_tags;
        }

        devmetricsObj = {
            userEvent: function (event_name, user_id, event_tags, request) {
                event_name = event_name.toString() || 'undefined';
                user_id = user_id.toString() || 0;
                event_tags = utilTagsParser(event_tags);
                var msg = event_name;
                msg += user_id ? ', user: ' + user_id : '';
                msg += event_tags ? ', tags: ' + event_tags.join('.') : '';
                mainLogger('user_event', msg, event_tags, request);
            },
            appEvent: function (event_name, event_tags, request) {
                event_name = event_name.toString() || 'undefined';
                event_tags = utilTagsParser(event_tags);
                var msg = event_name;
                msg += event_tags ? ', tags: ' + event_tags.join('.') : '';
                mainLogger('app_event', msg, event_tags, request);
            },
            info: function (text, request) {
                mainLogger('log', text, ['info'], request);
            },
            warn: function (text, request) {
                mainLogger('log', text, ['warn'], request);
            },
            warning: function (text, request) {
                mainLogger('log', text, ['warn'], request);
            },
            error: function (text, request) {
                mainLogger('log', text, ['error'], request);
            },
            exception: function (level, err, request) {
                mainLogger('exception', err, level, request, err);
            }
        };

        devmetricsObj.info('Checkout dashboards @ http://devmetrics.io/dashboard/' + app_id);

        return devmetricsObj;
    }

})();
