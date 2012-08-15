#!/bin/env node
//  OpenShift sample Node application

//These are default
var express = require('express');
var fs      = require('fs');
// Adding these for mongoDB
var Db = require('mongodb').Db,
  Server = require('mongodb').Server,
  Connection = require('mongodb').Connection,
  ObjectID = require('mongodb').ObjectID;

//  Local cache for static content [fixed and loaded at startup]
var zcache = { 'index.html': '' };
zcache['index.html'] = fs.readFileSync('./index.html'); //  Cache index.html


//Initialize mongoDB stuff
var host = '127.2.235.129';
var mongoport = Connection.DEFAULT_PORT;
var db = new Db('todolist', new Server(host, mongoport, {}), {native_parser:false});

// Create "express" server.
var app  = express.createServer();
app.use(express.methodOverride());


/*  =====================================================================  */
/*  Setup route handlers.  */
/*  =====================================================================  */

// Handler for GET /health
app.get('/health', function(req, res){
    res.send('Hello 21212.com People!');
});

app.get('/redhat', function(req, res){
    res.send('Hello everyone! MongoDB + Node.JS + OpenShift = Great!');
});

app.get('/', function(req, res){
  db.collection('names').find().toArray(function(err, names) {
	res.header("Content-Type:","text/json");
	res.end(JSON.stringify(names));
});
});

app.put('/user/:name', function(req, res){
	var document = {name:req.params.name};
	db.collection('names').insert(document,{safe:true},function(err,doc){
		if(err){
			console.log(err);
			res.send("Fail")
     	}
		else{
			res.header("Content-Type:","text/json");
			res.end(JSON.stringify(doc[0]._id));
		}
	});
});

app.put('/todos/:id/:date/:todo', function(req, res){
	var document = {creator:req.params.id,date:req.params.date,todo:req.params.todo};
	db.collection('todos').insert(document,{safe:true},function(err,doc){
     	res.header("Content-Type:","text/json");
		res.end(JSON.stringify(doc[0]._id));
	});
});

app.post('/todos/:id/:todo', function(req, res){
	var id = ObjectID(req.params.id);
	db.collection('todos').update({_id:id},{$set:{todo:req.params.todo}},{safe:true},function(err,doc){
		if(err){
       		res.header("Content-Type:","text/json");
			res.end(JSON.stringify({message:"fail"}));
			}
		else{
       		res.header("Content-Type:","text/json");
			res.end(JSON.stringify({message:"success"}));
			}
	});
});


app.get('/todos/:userid', function(req, res){
	  db.collection('todos').find({creator:req.params.userid}).toArray(function(err, todos) {
		res.header("Content-Type:","text/json");
		res.end(JSON.stringify(todos));
	});
});

app.delete('/todos/:id', function(req, res){
	var id = ObjectID(req.params.id);
	db.collection('todos').remove({_id:id},{safe:true},function(err,doc){
		res.header("Content-Type:","text/json");
		res.end(JSON.stringify({message:"success"}));
	})
});

//  Get the environment variables we need.
var ipaddr  = process.env.OPENSHIFT_INTERNAL_IP;
var port    = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

if (typeof ipaddr === "undefined") {
   console.warn('No OPENSHIFT_INTERNAL_IP environment variable');
}

//  terminator === the termination handler.
function terminator(sig) {
   if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...',
                  Date(Date.now()), sig);
      process.exit(1);
   }
   console.log('%s: Node server stopped.', Date(Date.now()) );
}

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});

//  And start the app on that interface (and port).
db.open(function(err, db) {
  if(err) {throw err}
	db.authenticate("admin","z4EuJ8qYFdsN",function(err){
		if(err) throw err
		app.listen(port,ipaddr);
	});
});
