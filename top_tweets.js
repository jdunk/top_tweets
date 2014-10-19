var consumer_key    = 'asdf',
    consumer_secret = 'asdf',
    access_token      = 'asdf',
    access_secret     = 'asdf';

var util = require('util'),
    fs = require('fs'),
    twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
    consumerKey: consumer_key,
    consumerSecret: consumer_secret
});

/* uncomment to test if credentials are valid
twitter.verifyCredentials(access_token, access_secret, function(error, data, response) {
    if (error) {
        console.log('there was an authentication error. please check that access token and secret are correct.');
        process.exit();
    } else {
        //console.log(util.inspect(data));
        //console.log(data['screen_name']);
        console.log('auth successful');
    }
});
*/

var top_tweets = [],
    max_top_tweets_stored = 50,
    max_top_tweets_displayed = 10,
    max_age_minutes = 5, // default. overridden by 1st cli arg
    curr_top_ten_str = '',
    purge_old_counter = 0;

if (process.argv[2])
    max_age_minutes = process.argv[2];

function getTopTweets()
{
    twitter.getStream('sample', {
            'language': 'en',
            'filter_level': 'medium' // possible values: 'none','low','medium'
        },
        access_token,
        access_secret,
        function(error, data, data_raw, response)
        {
            if (error)
            {
                console.log('there was an error fetching statuses.');
                console.log(util.inspect({'error': error, 'data_raw': data_raw}));
                // no need to exit, just restart
                // unless, of course, quota is exceeded. check for that case would go here.
                //process.exit();
                getTopTweets();
            }
            else
            {
                if (data['retweeted_status'])
                {
                    var tweet = data['retweeted_status'];

                    var tdata = {
                        'id': tweet['id'],
                        'count': tweet['retweet_count'],
                        'name': tweet['user']['name'],
                        'handle': tweet['user']['screen_name'],
                        'text': tweet['text'],
                        'timestamp': tweet['created_at']
                    };

                    var insert_at_pos = null,
                        delete_at_pos = null;

                    // find insertion position in "count" order
                    // find removal position for any prior tweet record (i.e. old retweet count)
                    for (var i=0; i<top_tweets.length; i++)
                    {
                        if (insert_at_pos != null && delete_at_pos != null)
                            break;

                        if (top_tweets[i]['id'] == tdata['id'])
                        {
                            // we found old version
                            if (top_tweets[i]['count'] == tdata['count'])
                            {
                                // old verison is up to date. do nothing, exit loop.
                                insert_at_pos = false;
                                break;
                            }
                            else
                            {
                                delete_at_pos = i;
                            }
                        }
                        else if (insert_at_pos == null)
                        {
                            if (top_tweets[i]['count'] > tdata['count'])
                            {
                                // no need to insert if not in top max_top_tweets_stored
                                if (i == 0 && top_tweets.length == max_top_tweets_stored)
                                    break;

                                // tweet has enough retweets, but is it new enough?
                                // parse date is expensive, so only do it for retweeted enough tweets

                                tdata['timestamp_int'] = Date.parse(tdata['timestamp']);

                                if (tweetIsTooOld(tdata['timestamp_int'], max_age_minutes))
                                    break;
                                    
                                insert_at_pos = i;
                            }
                        }
                    }

                    // if this is now the top-most tweet
                    if (insert_at_pos == null && 
                        (! top_tweets.length || (i && tdata['count'] >= top_tweets[top_tweets.length-1]['count'])))
                    {
                        tdata['timestamp_int'] = Date.parse(tdata['timestamp']);

                        if (! tweetIsTooOld(tdata['timestamp_int'], max_age_minutes)) 
                            insert_at_pos = top_tweets.length;
                    }

                    // remove old tweet
                    if (delete_at_pos != null)
                    {
                        top_tweets.splice(delete_at_pos, 1);

                        if (insert_at_pos != null && delete_at_pos < insert_at_pos)
                            insert_at_pos--;
                    }

                    // insert tweet
                    if (insert_at_pos != null)
                        top_tweets.splice(insert_at_pos, 0, tdata);

                    // truncate to top max_top_tweets_stored
                    if (top_tweets.length > max_top_tweets_stored)
                        top_tweets.splice(0, top_tweets.length - max_top_tweets_stored);

                    displayTopTweets(max_top_tweets_displayed);
                }

                purge_old_counter++;

                if (purge_old_counter == 50)
                {
                    top_tweets = purgeOldTweets(top_tweets, max_age_minutes);
                    purge_old_counter = 0;
                }
            }
        },
        function(res) {
            //console.log('disconnect');
        }
    );
}

function displayTopTweets(max)
{
    var str = '';

    for (var i=0; i < max; i++)
    {
        var idx = top_tweets.length-1-i;
        
        if (idx < 0)
            break;

        var t = top_tweets[idx];

        if (i == 0)
            str += '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n';

        str += '#' + (i+1) + ' [' + t['count'] + '] ' + t['name'] +
            ' (@' + t['handle'] + ') ' + t['timestamp'] + '\n' +
            t['text'];
            
        if (idx && i < max-1)
            str += '\n\n-----------------------------------\n';
    }

    // only output if there is any change
    if (str != curr_top_ten_str)
    {
        curr_top_ten_str = str;
        console.log(curr_top_ten_str);
    }
}

function tweetIsTooOld(timestamp_int, max_age_minutes)
{
    return ((new Date).getTime() - timestamp_int) / 60000 > max_age_minutes;
}

function purgeOldTweets(tweets, max_age_minutes)
{
    var keep = [];

    for (var i=0; i<tweets.length; i++)
    {
        if (! tweetIsTooOld(tweets[i]['timestamp_int'], max_age_minutes))
            keep.push(tweets[i]);
    }

    return keep;
}

function dbg(str)
{
    fs.appendFile('debug.log', str + '\n', function (err) {});
}

getTopTweets();