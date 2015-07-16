var devmetrics = require('./../lib/devmetrics-core')({'host': 'service.devmetrics.io', 'app_id': 'lib_test'});

//for (var i = 0; i < 400; ++i) {
    var randomNumber = Math.random() * 100;
    var userId = Math.round(Math.random() * randomNumber);

    devmetrics.info('hey');
    if (randomNumber > 70)
        devmetrics.warn('hey warning');
    if (randomNumber > 90)
        devmetrics.error('error log');

    devmetrics.userEvent('login', userId, ['osx', 'andrew']);
    if (randomNumber > 30)
        devmetrics.userEvent('button_click', userId, ['osx', 'andrew']);

    if (randomNumber > 10)
        devmetrics.appEvent('new_connection', ['osx', 'andrew']);
    if (randomNumber > 40)
        devmetrics.appGauge('database_insert', Math.random() * 30, ['osx']);
    if (randomNumber > 10)
        devmetrics.appEvent('database_reconnect', ['osx']);
    if (randomNumber > 20)
        devmetrics.appGauge('database_search', Math.random() * 90, ['osx']);
    if (randomNumber > 80)
        devmetrics.appGauge('database_get', Math.random() * 10, ['osx']);
//}
console.log('finished');
//process.exit();