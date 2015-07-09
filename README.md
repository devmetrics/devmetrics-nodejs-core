### devmetrics-nodejs-core
NodeJS lib to instrument application for logs, metrics and usage events in a consistent way.

Events are sent to a logstash over UDP. Use your logstash instance or the devmetrics.io shared ELK (elasticsearch, logstash, kibana) instance.

Browse data in the Kibana or native interface at http://www.devmetrics.io/logs

####The idea: logs + metrics in one request

There are a lot of questions we need to answer about our app every day: business metrics for a product, application metrics for developers, system metrics for devops.

Metrics or logs? Right tool, right job.
- **Metrics** are to provide aggregated information generally visualized as graphs.
- **Logs** are for a detailed drilldown. View specific user actions or debug code behaviour.

Our lib api design relies on several principles:
1. Metrics and logs go together, we provide a single api to write both logs and metrics. If you write logs you always need a metric for this event.
2. If you write metrics, you often need a log with more details for this event. It's often called sampling and used for drilldown and debug. We provide options to control sampling rate.
3. App events and user events are different types of data. It answers different questions for different people. For this reason at lib level we provide two separate api methods: `userEvent(...)` and `appEvent(...)`

####Installation

``` bash
  $ npm install devmetrics-core
```

####Library init

> Default way, sends data to devmetrics.io shared cluster (1M events/month for free):

``` js
var devmetrics = require('devmetrics-core')({'app_id': 'my-private-id'})
```

> Advanced init (for example, to send data to your private instance):

``` js
var devmetrics = require('devmetrics-core')({
  'host': 'your-hostname',
  'port': 5545,
  'app_id': 'my-private-id',
  'no_console': false,
  'software_version': '1.2'
});
```
All settings are optional:

- `host` - Set to your private instance of logstash, if required, defaults to `service.devmetrics.io`
- `port` - Logstash port, defaults to 5546 for devmetrics.io cluster
- `app_id` - The unique app_id to filter your data and access dashboards, defaults to `os.hostname()`
- `no_console` - Set to `true` for the silent mode (no stdout), defaults to `false`
- `software_version` - Your app's version. Useful for continuous integration, defaults to ``

####Simple Logs API

**Simple log**

``` js
devmetrics.info('hey info, not important');
devmetrics.warn('hey warn, probably important');
devmetrics.error('hey error, really important');
```

> Basic logging, for anything. Levels: trace, debug, info, warn, error

**Exception**

``` js
devmetrics.exception(e);
```

> Adds special sections to track application problems


####Event API

**User event**

``` js
/**
 * @param event_name Metric name, all events with same metric name are aggregated
 * @param user_id optional, User unique identifier, used only for log
 * @param event_tags optional, Additional info, metric dimensions, string or array
 */
devmetrics.userEvent('purchase_button_click', 123, ['android', 'US']);
devmetrics.userEvent('login', 89321);
```

> We are generally user oriented and track user actions. So let's separate business metrics from developer data.


**App event**

``` js
/**
 * @param event_name Metric name, all events with same metric name are aggregated
 * @param event_tags optional, Additional info, metric dimensions, string or array
 */
devmetrics.appEvent('app_started', 'server2');
devmetrics.appEvent('web-request', ['index-page', 'US_region']);
```

>  Almost the same API as for UserEvent, but userEvent is for business metrics and appEvent is for application and system metrics. Let's differentiate this data starting from the collect layer.

####Out of the box instrumentation, Application Performance Monitoring

For MEAN stack we've prepared easy-to-go methods for APM instrumentation:
devmetrics.enableHttpLogger(app);
``` js
                        | devmetrics.enableMongooseLogger(mongoose);
For Express.js HTTP requests and MongoDB calls can be easu

####Stay in touch

We are moving fast and appreciate feedback and feature requests.
See you @ https://gitter.im/devmetrics/dev#
