var devmetrics = require('./../lib/devmetrics-core')();
devmetrics.info('hey');
devmetrics.error('error log');
devmetrics.userEvent('hey_event', 123, ['osx']);
devmetrics.appEvent('app_started', ['osx']);