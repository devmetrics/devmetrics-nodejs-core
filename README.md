# devmetrics-nodejs-core
NodeJS core lib for metrics and logs

###Simple log:
require('devmetrics-core')().log('info', 'my text');

App event:
require('devmetrics-core')().event('info', 'started', {'thread_count': 10, 'some_param': 'some_value'});

Exception:
require('devmetrics-core')().exception(e);
