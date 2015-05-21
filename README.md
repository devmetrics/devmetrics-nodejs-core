### devmetrics-nodejs-core
NodeJS core lib for metrics and logs

####Basic level

####Simple log:
require('devmetrics-core')().log('info', 'my text');

####App event:
require('devmetrics-core')().event('info', 'started', {'thread_count': 10, 'some_param': 'some_value'});

####Exception:
require('devmetrics-core')().exception(e);


####Domain level api

**Web request:**

`require('devmetrics-core')().setContext(request, user_id = null);`
> Set request context for all further events.

> Generally it's best to set context at the very beginning of the request handling.
> So all the events are with proper context.

`require('devmetrics-core')().webRequest(request);`
> Measure total request time, call at the end of the request to get correct request time (if `setContext` was called at the beginning)


**Storage request:**

`require('devmetrics-core')().storageRequest(storageName, action, description, duration);`
> Measure db requests, example:

> `dbRequest('mongodb', 'findOne', 'users', 160);`

> `dbRequest('memcached', 'incr', 'mycounter', 12);`


**External service request:**

`require('devmetrics-core')().externalRequest(serviceName, description, duration);`
> Measure external services requests, example:

> `externalRequest('fb.com', 'authorize', 239);`


**System event:**

`require('devmetrics-core')().systemEvent(description);`
> Application system events, not connected with business logic, like 'web_app_started', 'cron_script_X_started'


**User event:**

`require('devmetrics-core')().userEvent(description);`
> User actions, track 'login', 'contact_form', 'purchase'


**Frontend event:**

`require('devmetrics-core')().frontendEvent(description);`
> User frontend actions from js, track user behaviour on the web page, just prepare an api callback.

> Use https://github.com/devmetrics/devmetrics-js for frontend