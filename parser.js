var express = require('express');
//require.paths.unshift('support/mongoose/lib')
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/fsamap');
var htmlparser = require('htmlparser');

var app = express.createServer();
var http = require('http');
var util = require('util');

//var _ = require('underscore');

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
			var btype = select(dom, '#ctl00_ContentPlaceHolder1_uxBusinessType')[0].children[0].data;
			var idate = select(dom, '#ctl00_ContentPlaceHolder1_uxBusinessLastInspection')[0].children[0].data;
			var lauth = select(dom, '#ctl00_ContentPlaceHolder1_uxLocalAuthorityName')[0].children[0].data;
			var status = select(dom, '#InfoStatus img')[0];
			if(!status) {
				status = select(dom, '#InfoGradeContainer img')[0];
			}
			status = status.attribs.src;
			console.log(status);
			console.log(bname);
			console.log(address);
			console.log(btype);
			console.log(idate);
			console.log(lauth);
		} else {
		}
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
