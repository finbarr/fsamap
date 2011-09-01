var express = require('express');
//require.paths.unshift('support/mongoose/lib')
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/fsamap');
var htmlparser = require('htmlparser');

var app = express.createServer();
var http = require('http');
var util = require('util');

var _ = require('underscore');

var select = require('soupselect').select;

var handler = new htmlparser.DefaultHandler(function(error, dom) {
	if(error) {
		console.log(error.message);
	} else {
		var bname = select(dom, '#ctl00_ContentPlaceHolder1_uxBusinessName')[0];
		if(bname) {
			bname = bname.children[0].data;
			var address = '';
			select(dom, '#businessDetails .information span').forEach(function(info) {
				if(info.children && info.children[0].data) {
					address += info.children[0].data + '\n';
				}
			});
			address = address.substring(0, address.length - 1);
			select(dom, '#additionalInformation .InfoBusinessTypeContainer').forEach(function(info) {
				_.each(info.children, function(child) {
					console.log(util.inspect(child));
					// create a map of heading:data (and possibly turn data into an array if it is comma separated)
				});
			});
			console.log(bname);
			console.log(address);
		} else {
			// id is invalid
		}
		//ding('#localAuthority .InfoLAContainer');
	}
});

var parser = new htmlparser.Parser(handler);

process.on('exit', function() {
	console.log('exit');
});

app.get('/scrape/:id([0-9]+)/:total([0-9]+)', function(req, res) {
	var id = req.params.id;
	var total = req.params.total;
	var current = 0;
	var success = 0;
	var failure = 0;
	var callback = function(result) {
		if(result) {
			success++;
		} else {
			failure++;
		}
		if(success + failure == total) {
			res.send(success + '/' + failure);
		}
	}
	while(current++ < total) {
		var options = {
			host: 'ratings.food.gov.uk',
			port: 80,
			path: '/EstablishmentDetails.aspx?eid=' + (id++) + '&pf=1'
		}
		http.get(options, function(res) {
			res.setEncoding('utf-8');
			var body;
			res.on('data', function(data) {
				body += data;
			});
			res.on('end', function() {
				parser.parseComplete(body);
			});
			callback(true);
		}).on('error', function(e) {
			console.log('Error: ' + e.message);
			callback(false);
		});
	}
});

app.listen(9000);
