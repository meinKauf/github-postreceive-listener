var express = require('express');
var exec = require('child_process').exec;
var fs = require('fs');
var optimist = require('optimist');
var app = express();

var gitHubIps = [
  '207.97.227.253',
  '50.57.128.197',
  '108.171.174.178',
  '127.0.0.1'
];

optimist.usage('Usage $0 -b [branchToWatch] -e [pathToScript]');
optimist.default('b', 'master');
optimist.default('e', null);
var argv = optimist.argv;

var watchedBranch = argv.b;
console.log("Watched Branch: " + watchedBranch);

var executeScript = argv.e;
if(!fs.existsSync(executeScript)) {
  console.error("Given file does not exist '" + executeScript + "'");
  process.exit(1);
}

console.log("Script to execute: '" + executeScript + "'");

app.use(express.bodyParser());
app.post('/github', function (req, res) {

  var remoteIp = req.connection.remoteAddress;

  if (gitHubIps.indexOf(remoteIp) === -1) {
    console.error("'" + remoteIp + "' tried to POST. Not within allowed IPs.");
    res.send({status: 'You are not welcome here! Go away! Thanks!'});
    return;
  }

  if (!req.body || !req.body.payload) {
    console.log("no payload sent");
    res.send({status: "no payload sent."});
    return;
  }

  try {
    var payload = JSON.parse(req.body.payload);
  } catch (e) {
    console.error("could not parse payload");
    res.send({status: "could not parse your payload, but thanks anyway!"});
    return;
  }

  var branch = payload.ref.replace(/^.*\/([^\/]+)$/, '$1');
  console.log("Payload for Branch: '" + branch + "' from '" + remoteIp + "' received");

  if (watchedBranch !== branch) {
    console.log("branch '" + branch + "' not matching '" + watchedBranch + "'");
    res.send({status: "branch '" + branch + "' not matching '" + watchedBranch + "'"});
    return;
  }

  res.send({status: 'ok, thanks'});

  console.log("Will execute '" + executeScript + "'");
  exec(executeScript, function (err, stdout, stderr) {
    if (err) {
      return console.error(err);
    }
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  });

});

console.log('Listening on 0.0.0.0:8080');
app.listen(8080);


