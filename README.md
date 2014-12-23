Dependencies
==========

* node
* npm install util node-twitter-api

Original Instructions
---

Use Twitter's [sample streaming API](https://dev.twitter.com/streaming/reference/get/statuses/sample) to show the top 10 retweeted [tweets](https://dev.twitter.com/overview/api/tweets) (note the retweeted_status field) in a rolling window of time, where the window's start is n minutes ago (where n is defined by the user) and the window's end is the current time.

Output should continuously update and include the tweet text and number of times retweeted in the current rolling window.

Please host your code on GitHub.
