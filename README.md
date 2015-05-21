### devmetrics-nodejs-core
NodeJS core lib for metrics and logs

####Basic level

**Simple log**

`require('devmetrics-core')().log(level, text);`

> Basic logging, for anything. Levels: trace, debug, info, warn, error

**Exception**

`require('devmetrics-core')().exception(e);`

> Add to exception handling sections to track application problems


####Domain level api

**Web request**

`require('devmetrics-core')().setContext(request, user_id = null);`
> Set request context for all further events.

> Generally it's best to set context at the very beginning of the request handling.
> So all the events are with proper context.

`require('devmetrics-core')().webRequest(request);`
> Measure total request time, call at the end of the request to get correct request time (if `setContext` was called at the beginning)


**Storage request**

`require('devmetrics-core')().storageRequest(storageName, action, description, duration);`
> Measure db requests, example:

> `dbRequest('mongodb', 'findOne', 'users', 160);`

> `dbRequest('memcached', 'incr', 'mycounter', 12);`


**External service request**

`require('devmetrics-core')().externalRequest(serviceName, description, duration);`
> Measure external services requests, example:

> `externalRequest('fb.com', 'authorize', 239);`


**System event**

`require('devmetrics-core')().systemEvent(description, extra = {});`
> Application system events, not connected with business logic, like 'web_app_started', 'cron_script_X_started'

> Use extra field to pass additional info


**User event**

`require('devmetrics-core')().userEvent(description, extra = {});`

> User actions, track 'login', 'contact_form', 'purchase'

> Use extra field to pass additional info


**Frontend event**

`require('devmetrics-core')().frontendEvent(description);`
> User frontend actions from js, track user behaviour on the web page, just prepare an api callback.

> Use https://github.com/devmetrics/devmetrics-js for frontend


**Function wrapper**
```
var myFunc = function() {...};
myFunc = require('devmetrics-core')().funcWrapper(myFunc);
```
> Measure function execution time. Wrap any function once before using it and check logs and graphs for function execution time.
