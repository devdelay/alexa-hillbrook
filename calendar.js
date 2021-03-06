var ical = require('ical'),
    moment = require('moment-timezone'),
    rp = require('request-promise');

var url = 'https://hillbrook.myschoolapp.com/podium/feed/iCal.aspx?q=4F7E8A1EB007DDCF38EB65C42638FAF0539D63B3F3E197D0D7F3AA50A8C759454E2A6411EE2EA89A5A3F62462239449017183CC0C7763E5F';

/*
calendar feed returns a list of events:

{ type: 'VEVENT',
  params: [],
  uid: '4865d95d-53b0-41c0-bed4-e73722bd7a3b',
  start: { Wed, 11 May 2016 07:00:00 GMT tz: undefined },
  end: { Thu, 12 May 2016 07:00:00 GMT tz: undefined },
  dtstamp: '20160511T233453',
  summary: 'D Day',
  status: 'CONFIRMED',
  class: 'PUBLIC',
  priority: '3',
  categories: [ 'podium', 'events' ] }

loadEvents returns a promise that resolves with list of events between fromDt and toDt:

{
  start: { Wed, 11 May 2016 07:00:00 GMT tz: undefined },
  end: { Thu, 12 May 2016 07:00:00 GMT tz: undefined },
  summary: 'D Day',
}

*/
module.exports = {
    loadEvents: function(fromDt, toDt) {
        console.log('start load events for '+fromDt.toISOString()+' to '+toDt.toISOString());
        return rp(url).then(function(response) {
            if (!response) {
                return([]);
            }
            var events = [];
            var data = ical.parseICS(response);
            Object.keys(data).forEach(function(key) {
                var ev = {
                    start: data[key].start ? moment(data[key].start) : null,
                    end: data[key].end ? moment(data[key].end) : null,
                    summary: data[key].summary
                };
                if (!ev.start || !ev.summary) {
                    return;
                }
                // all day events are 07:00:00 GMT tz: undefined
                if (ev.end && ev.end.diff(ev.start, 'days') === 1) {
                    if (fromDt.format('MM-DD') !== ev.start.format('MM-DD')) {
                        return;
                    }
                } else if (ev.start < fromDt || ev.start > toDt) {
                    return;
                }
                events.push(ev);
            });
            return events;
        });
    }
};
