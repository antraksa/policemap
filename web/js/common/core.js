'use strict';
var Core = (function() {
	var sections = {}, constructors = {};
	var xhrs = [];
	function register(id, constructor) { constructors[id] = constructor ; } 
	var apps = [], loaders = [];
	function init( args) {
		loadStatics($(document), function() { 
			var id = this.id;
			sections[id] = this;
		}, function() {
			for (var key in constructors) {
				constructors[key].call(sections[key]); 
			}
			if (args && args.completed) args.completed( { sections : sections  })
		});
	}
	function loadStatics($target, loaded, completed) {
		var $statics = $target.find('[data-html-src]').each(function() {
			var $tar = $(this);
			var url = $tar.attr('data-html-src');
			xhrs.push(this);
			//console.log('start', url);
			$tar.load(url, function(res, status, _xhr) {
				loadStatics($(this), loaded, completed);
				loaded.call(this);
				xhrs.splice(xhrs.indexOf(this), 1);
				$tar.removeAttr('data-html-src');
				if (xhrs.length==0) { //all static completed 
					if (completed) completed();
				}
			})
		})
		/*if ($statics.length == 0) {
			if (completed) completed();
		}*/
	}
	var events = {};
	function on(eventName, callback) {
		var callbacks = events[eventName] || [];
		callbacks.push(callback);
		if (typeof callback === 'function')
			events[eventName] = callbacks;
		else	
			console.warn('Invalid callback');
	}
		
	function trigger(eventName, args, sender) {
		var callbacks = events[eventName];
		if (callbacks) {
			callbacks.forEach(function(callback) {
				if (typeof callback === 'function') 
					callback.call(sender, args);
			})
		}
	}
	
	function addApp(appIndex, initf) {
		apps[appIndex] = initf;
	}
	function addLoader(appIndex, initf) {
		loaders[appIndex] = initf;
	}
	
	return {init : init, register : register, on : on, trigger : trigger, apps : apps, loaders : loaders, addApp : addApp, addLoader : addLoader}
})();	



	




