var consumer_key    = 'asdf',
    consumer_secret = 'asdf',
    user_token      = 'asdf',
    user_secret     = 'asdf';

var req_info = {
  'method': 'GET',
  'port': 443,
  'hostname': 'stream.twitter.com',
  'uri': '/1.1/statuses/sample.json',
  'query_params': {
    'delimited': 'length',
    'language': 'en',
    'filter_level': 'medium'
  }
};

var crypto = require('crypto'),
    OAuth = require('oauth'),
    https = require('https');

var oauth = new OAuth.OAuth('','',consumer_key,consumer_secret,'1.0',null,'HMAC-SHA1');

var oauth_params = [
    ['oauth_consumer_key', consumer_key],
    ['oauth_nonce', oauth._getNonce(32)],
    ['oauth_signature_method', 'HMAC-SHA1'],
    ['oauth_timestamp', oauth._getTimestamp()],
    ['oauth_token', user_token],
    ['oauth_version', '1.0']
];

var generateOAuthHeader = function(req_info, params) {
    params.push(['oauth_signature', generateOAuthSig(req_info, params)]);
    //console.log(require('util').inspect(params));
    return 'OAuth ' + joinOAuthParams(params);
};

var joinOAuthParams = function(params) {

    params.sort(function(a, b) {
        return a[0].localeCompare(b[0]);
    });

    return params.map(function(curr,idx,arr) {
        //console.log(curr[0] + '="' + curr[1] + '"');
        return curr[0] + '="' + curr[1] + '"';
    }).join(', ');
};

var generateOAuthSig = function(req_info, oauth_params) {

    var qp = req_info['query_params'];

    // combine query params with oauth params
    for (var key in qp)
    {
        if (qp.hasOwnProperty(key))
            oauth_params.push([key, qp[key]]);
    }

    oauth_params.sort(function(a, b) {
        return a[0].localeCompare(b[0]);
    });

    var signing_key = encodeURIComponent(consumer_secret) + '&' + encodeURIComponent(user_secret);

    var signature_base = req_info['method'].toUpperCase() + '&' +
        encodeURIComponent(
            'http' + (req_info['port'] == '443' ? 's' : '') + '://' +
            req_info['hostname'] + req_info['uri']
        ) + '&' + 
        encodeURIComponent(oauth_params.map(function(curr,idx,arr) {
            //console.log(encodeURIComponent(curr[0]) + '=' + encodeURIComponent(curr[1]));
            return encodeURIComponent(curr[0]) + '=' + encodeURIComponent(curr[1]);
        }).join('&'));

    //console.log('signing key: ' + signing_key);
    //console.log('signature base: ' + signature_base);
    return crypto.createHmac('sha1', signing_key).update(signature_base).digest('base64');
};

var getQueryString = function(qp)
{
    if (! qp.length)
        return '';

    var qpkeys = [];

    for (var key in qp)
    {
        if (qp.hasOwnProperty(key))
            qpkeys.push(key);
    }

    return '?' + qpkeys.map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(qp[key]);
    }).join('&');
};

var req_options = {
  hostname: req_info['hostname'],
  port: req_info['port'],
  path: req_info['uri'] + getQueryString(req_info['query_params']),
  method: 'GET',
  headers: { 'Authorization': generateOAuthHeader(req_info, oauth_params) }
  //rejectUnauthorized: false
};

var req = https.request(req_options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();