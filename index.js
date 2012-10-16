var express = require('express');
var app = express();
var cp = require('child_process');
var exec = cp.exec;
var fs = require('fs');

var gitHubIps = [
  '207.97.227.253',
  '50.57.128.197',
  '108.171.174.178',
  '127.0.0.1'
];

var args = process.argv;
if(args.length <= 2) {
	console.error("Usage: /path/to/gitrepo [Watched BRANCH]");
	process.exit(1);
}

var gitRepo = args[2];
if(!fs.existsSync(gitRepo)) {
	console.error("'" + gitRepo + "' does not exist or is not readable");
	process.exit(1);
}

var watchedBranch = args[3] || 'master';
console.log("Watched Branch: " + watchedBranch);


app.use(express.bodyParser());
app.post('/github', function(req, res) {

  var remoteIp = req.connection.remoteAddress;

  if(gitHubIps.indexOf(remoteIp) === -1) {
    console.error("'" + remoteIp + "' tried to POST. Not within allowed IPs.");
    res.send({status: 'You are not welcome here! Go away! Thanks!'});
    return;
  }

	if(!req.body || !req.body.payload) {
		console.log("no payload sent");
		res.send({status:"no payload sent."});
		return;
	}

	try {
		var payload = JSON.parse(req.body.payload);
	} catch(e) {
		console.error("could not parse payload");
		res.send({status:"could not parse your payload, but thanks anyway!"});
		return;
	}

	var branch = payload.ref.replace(/^.*\/([^\/]+)$/,'$1');
	console.log("Payload for Branch: '" + branch + "' received");
	console.log("Watched branch: '" + watchedBranch + "'");

	if(watchedBranch !== branch) {
		console.log("branch '" + branch + "' not matching '" + watchedBranch + "'");
		res.send({status: "branch '" + branch + "' not matching '" + watchedBranch + "'"});
		return;
	}

	exec(
		'git checkout -f "' + branch + '" && git pull && git reset --hard',
		{
			cwd: gitRepo
		},
		function(err, stdout, stderr) {
			if(err) return console.error(err);
			console.log(stdout);
			console.error(stderr);
		}
	);

  res.send({status:'ok, thanks'});
  return;

});

console.log('Listening on 0.0.0.0:8080');
app.listen(8080);


