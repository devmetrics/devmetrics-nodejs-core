var devmetrics = require('./../lib/devmetrics-core')({'host': 'it.devmetrics.io', 'app_id': 'lib_test'});
devmetrics.info('hey');
devmetrics.error('error log');
devmetrics.userEvent('hey_event', 123, ['osx', 'andrew']);
devmetrics.appEvent('app_started', ['osx']);