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
        var port = options['port'] || 5546;
        var app_id = options['app_id'] ? options['app_id'] : hostname.replace(/[\W_]+/g, "_"); // alphanum for token
        app_id = app_id.toLowerCase();

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

        // morgan request logger
        var enableHttpLogger = function(app) {
            if (!app) {
                return;
            }
            var morgan = require('morgan');
            morgan.token('statsdKey', function getStatsdKey(req) {
                return req.statsdKey
            });
            morgan.token('sessionId', function(req, res) {
                return req.session ? req.session.id : 'N/A';
            });
            var requestObjDescr = {
                app_id: app_id,
                event_type: "http_request",
                metric_name: ":statsdKey",
                host: hostname,
                session: ":sessionId",
                referrer: ":referrer",
                user_agent: ":user-agent",
                request_uri: ":statsdKey",
                message: "[:date] :method :url :status :response-time ms",
                status_code: ":status",
                method: ":method",
                gauge_value: ":response-time"
            }

            var logsStream  = {
                write: function(message, encoding) {
                    var obj = JSON.parse(message);
                    var msg = 'http_request: ' + obj['method'] + ' ' + obj['request_uri'] + ' ' + obj['status_code'] + ' ' + 'took ' + Math.round(obj['response_time']) + ' ms';
                    if (obj['status_code'] >= 400) {
                        loggerObj.error(message);
                        if (stdLogger) {
                            stdLogger.error(msg);
                        }
                    } else {
                        loggerObj.info(message);
                        if (stdLogger) {
                            stdLogger.info(msg);
                        }
                    }
                }
            };

            var requestLogHandler = morgan(JSON.stringify(requestObjDescr), {stream: logsStream});

            var statsdURL = function (req, res, next) {
                req.statsdKey = ['http', req.path.replace(/[\/\.]/g, "-")].join('-');
                next();
            };

            app.use(statsdURL);
            app.use(requestLogHandler);
        }

        // mongoose request logger
        var enableMongooseLogger = function(mongoose) {
            if (!mongoose) {
                return false;
            }
            mongoose.set('debug', function (collectionName, method, query, doc, options) {
                var msg = 'mongo collection: ' + collectionName + ' method: ' + method;
                var uri = 'db--' + collectionName + '-' + method;
                var event = {
                    "app_id": app_id,
                    "event_type": "db_call",
                    "metric_name": collectionName + '.' + method,
                    "host": hostname,
                    "message": msg,
                    "uri": uri,
                    "method": method,
                    "response_time": 0 // request duration coming soon
                };
                loggerObj.info(event);
                if (stdLogger) {
                    stdLogger.info(msg);
                }
            });
        }

        // generic function to construct object for logstash
        var constructObj = function (event_type, message, dimensions, level, request, uid) {
            var stack_trace = null;
            var exception = null;
            uid = uid || (request && request.session ? request.session.id : '');
            var text = message;
            var obj = {};
            if (event_type == 'exception') {
                obj = extend(obj, {
                    'exception_stack': message.stack,
                    'error': 1
                });
                text = message.message;
            }
            for (var i in dimensions) {
                dimensions[i] = dimensions[i].replace(/[\W_]+/g, "_");
            }
            var metric_name = dimensions[0];
            obj = extend(obj, {
                "app_id": app_id,
                "metric_name": metric_name,
                "event_type": event_type,
                "host": hostname,
                "session": uid,
                "uri": request && request.path ? request.path.replace(/[\/\.]/g, "-").join('-') : '',
                "message": event_type + ": " + text,
                "version": version,
                "timestamp": new Date().getTime(),

                "severity": level || 'info',
                d1: dimensions[0] || '',
                d2: dimensions[1] || '',
                d3: dimensions[2] || '',
                d4: dimensions[3] || '',
                d5: dimensions[4] || '',
                d6: dimensions[5] || '',
                d7: dimensions[6] || ''
            });
            return obj;
        }

        var mainLogger = function (event_type, message, dimensions, request, params) {
            dimensions = dimensions || [];
            var level = dimensions[0] || 'info';
            params = params || {};
            var obj2send = constructObj(event_type, message, dimensions, level, request, params['uid'] || false);
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
            /**
             * @param event_name Metric name, all events with same metric name are aggregated
             * @param user_id optional, User unique identifier, used only for log
             * @param event_tags optional, Additional info, metric dimensions, string or array
             * @param request optional, request object if applicable, to fetch request context
             */
            userEvent: function (event_name, user_id, event_tags, request) {
                event_name = event_name.toString() || 'undefined';
                user_id = user_id.toString() || 0;
                event_tags = utilTagsParser(event_tags);
                event_tags.unshift(event_name);
                var msg = event_name;
                msg += user_id ? ', user: ' + user_id : '';
                msg += event_tags ? ', tags: ' + event_tags.join('.') : '';
                mainLogger('user_event', msg, event_tags, request, {uid: user_id});
            },
            /**
             * @param event_name Metric name, all events with same metric name are aggregated
             * @param event_tags optional, Additional info, metric dimensions, string or array
             * @param request optional, request object if applicable, to fetch request context
             */
            appEvent: function (event_name, event_tags, request) {
                event_name = event_name.toString() || 'undefined';
                event_tags = utilTagsParser(event_tags);
                event_tags.unshift(event_name);
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
            exception: function (err, request) {
                mainLogger('exception', err, ['error'], request);
            },
            enableHttpLogger : enableHttpLogger,
            enableMongooseLogger: enableMongooseLogger
        };

        devmetricsObj.info('Checkout logs @ http://www.devmetrics.io/logs/' + app_id + '/tail');

        return devmetricsObj;
    }

})();
