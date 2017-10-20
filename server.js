// do not edit this file directly -- it was generated by postinstall.js from server.template.js

//
// content of server.template.js
//

var fs = require('fs');
var path = require('path');

// load our module path cache
require('./server.cache.modulePath');

// load our stat cache
require('./server.cache.stat');

// load our file cache
eval(require('zlib').gunzipSync(fs.readFileSync(path.resolve(__dirname, 'server.cache.js.gz'))).toString());

// save the original readFileSync that we'll override with our caching version
var originalReadFileSync = fs.readFileSync;

// caching version of readFileSync that avoids the filesystem if the file is in the cache
function cachedReadFileSync(file, options) {
	if (!options || options === 'utf8') {
		var fn = file.replace(path.resolve(__dirname, 'node_modules') + path.sep, '');
		if (fn.endsWith('.js')) {
			fn = fn.substr(0, fn.length - 3);
		}
		if (s[fn]) {
			return s[fn];
		};
	}
	return originalReadFileSync(file, options);
};

// replace standard readFileSync with our caching version
fs.readFileSync = cachedReadFileSync;

// if iisnode is being used, it defines the port we need to use in an environment
// variable; if this variable is defined, we override the config with it otherwise
// the web app won't work correctly
if (process.env.PORT) {
	// we do the require in-place here to ensure it comes from the cache
	require('ghost/core/server/config').set('server:port', process.env.PORT);
}

//
// content of ghost\index.js
//

// # Ghost Startup
// Orchestrates the startup of Ghost when run from command line.

var startTime = Date.now(),
    debug = require('ghost-ignition').debug('boot:index'),
    ghost, express, logging, errors, utils, parentApp;

debug('First requires...');

ghost = require('ghost/core');

debug('Required ghost');

express = require('express');
logging = require('ghost/core/server/logging');
errors = require('ghost/core/server/errors');
utils = require('ghost/core/server/utils');
parentApp = express();

debug('Initialising Ghost');
ghost().then(function (ghostServer) {
    // Mount our Ghost instance on our desired subdirectory path if it exists.
    parentApp.use(utils.url.getSubdir(), ghostServer.rootApp);

    debug('Starting Ghost');
    // Let Ghost handle starting our server instance.
    return ghostServer.start(parentApp).then(function afterStart() {
        require('./server.cache.modulePath.generator');
        require('./server.cache.stat.generator');
        logging.info('Ghost boot', (Date.now() - startTime) / 1000 + 's');

        // if IPC messaging is enabled, ensure ghost sends message to parent
        // process on successful start
        if (process.send) {
            process.send({started: true});
        }
    });
}).catch(function (err) {
    if (!errors.utils.isIgnitionError(err)) {
        err = new errors.GhostError({err: err});
    }

    if (process.send) {
        process.send({started: false, error: err.message});
    }

    logging.error(err);
    process.exit(-1);
});
