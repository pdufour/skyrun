Skyrun
======

Skyrun is a small utility library to assist running local scripts on remote servers. With Skyrun you can log into a remote server and run a script of any kind (such as bash, node, python etc. Just provide the appropriate hash bang).

Installing Skyrun
-----------------

To use skyrun from the cli, install skynet globally

	npm install -g skyrun

Using Skyrun from the CLI
---------------------------

eg 

	skyrun user@host path/to/script.sh

Using Skyrun Programmically
---------------------------

At the moment Skyrun only supports logging into remote hosts via ssh public key authentication. Password authentication via ssh is not supported. 

``` js
var skyrun = require('skyrun');
	
var options = {
	'host':'remote server',
	'user':'user to log in with' // optional. Defaults to current user
	'identity':'private key', // optional
}
	
var server = skyrun.createServer(options);
	
server.run('local/path/to/myscript.sh', function(stderr, stdout) {
	if (stderr) {
		// There was an error running the script
	}
	else {
		// No error. have a look in stdout to see the output of the script
	}
});
```