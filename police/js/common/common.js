'use strict';

var State = (function(){
	var state;
	var getState = function() {
		//console.log(location.hash, location.hash.substr(1))
		if (!state && location.hash) {
			state = Common.uriDecode(location.hash.substr(1))
		} 
		if (!state) state = {};
		return state; 
	}
	var addState = function(args) {
		if (!state) getState()
		var changed = false;
		for (var key in args) {
			var sv = state[key], tv = args[key];
			if (sv!= tv)   changed = true;
			state[key] = tv;
		}
		if (changed) {
			pushState(state)
		}
	}
	function pushState(_state) {
		state = _state;
		var url= '#' + Common.uriEncode(state);
		//console.log('push', state)
		history.pushState(state, '', url);
		
	}
	$(window).on('popstate', function(e){
		var state = e.originalEvent.state;
		if (state) {
			console.log('popstate', state)
			Core.trigger('popstate', { state : state} )
		}
	});
	return { addState : addState, pushState : pushState, getState : getState }
	
})();

Date.prototype.format = function(format) {
	if (!format)
		format = 'dd-mm-yyyy';
  var o = {
    "m+" : this.getMonth()+1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "M+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
    "S" : this.getMilliseconds() //millisecond
  }

  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
  return format;
}
Number.prototype.humanFileSize = function(si) {
    var thresh = si ? 1000 : 1024;
	var bytes = this;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return Math.round(bytes) +' '+units[u];
}
String.prototype.format = String.prototype.f = function () {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i] == undefined || arguments[i] == null ? '' : arguments[i]);
    }
    return s;
};
String.prototype.contains = function (s) {
	return this && this.toLowerCase().indexOf(s.toString().toLowerCase())>=0;
}
String.prototype.equals = function (s) {
	return $.trim(this.toLowerCase()) ==  $.trim(s.toString().toLowerCase());
}
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
Date.prototype.fineFormat = function() {
	var date = this;
	//var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
	var	diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);

	if (isNaN(day_diff) || day_diff < 0 || day_diff >= 40) return ''; //date.toLocaleDateString();
	var res =  day_diff == 0 && (diff < 60 && "just now" || diff < 120 && "a minute ago" 
		|| diff < 3600 && Math.floor(diff / 60) + " minutes ago" || diff < 7200 && "1 hour ago" 
		|| diff < 86400 && Math.floor(diff / 3600) + " hours ago") || day_diff == 1 && "yesturday" || day_diff < 7 && day_diff + " days ago" 
		|| day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago" ;
	return res;

}

var Common = (function () {
	return {
		clone: function(o){
          return JSON.parse(JSON.stringify(o));
        },
		
		getTemplates : function() {
			var templates = {}
			$('[data-template').each(function() {
				var $this = $(this)
				templates[$this.attr('data-template')] =$this.html();
			}).appendTo($('body'))
			return templates
		},
	
		download : function(name, data, nojson) {
			var pom = document.createElement('a');
			if (!nojson)
				data= JSON.stringify(data);
			pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
			var d = new Date().format()
			//pom.setAttribute('download', '{1}_{0}.json'.format(d, name));
			pom.setAttribute('download', name);

			if (document.createEvent) {
				var event = document.createEvent('MouseEvents');
				event.initEvent('click', true, true);
				pom.dispatchEvent(event);
			}
			else {
				pom.click();
			}
		},
		getColors : function (l) {
			var colors = []
			var step = Math.ceil(360/l)
			for (var i = step; i <= 360; i+=step) {
				var c = Common.hslToRgb(i/360, 0.6, 0.4);
				colors.push('rgb({0},{1}, {2})'.format(c[0], c[1], c[2]))
			}
			return colors
		}, 
		hslToRgb : function (h, s, l){
		    var r, g, b;
		    if(s == 0){
		        r = g = b = l; // achromatic
		    }else{
		        var hue2rgb = function hue2rgb(p, q, t){
		            if(t < 0) t += 1;
		            if(t > 1) t -= 1;
		            if(t < 1/6) return p + (q - p) * 6 * t;
		            if(t < 1/2) return q;
		            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		            return p;
		        }

		        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		        var p = 2 * l - q;
		        r = hue2rgb(p, q, h + 1/3);
		        g = hue2rgb(p, q, h);
		        b = hue2rgb(p, q, h - 1/3);
		    }

		    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
		}, 
		uriEncode : function(obj) {
			var str = [];
			for(var p in obj)
			if (obj.hasOwnProperty(p)) {
			  str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
			return str.join("&");
	   },
		uriDecode : function(queryString) {
			var obj = {};
			var pairs = queryString.split('&');
			pairs.forEach(function(o) {
				var split = o.split('=');
				var key = decodeURIComponent(split[0]);
				if (key)
					obj[key] = decodeURIComponent(split[1]);
			});
			return obj;
	   },
	   sortByField  : function (arr, expr, asc) {
			if (arr)
			return arr.sort(function(a,b) {
				a = a[expr] != null ? a[expr] : '';
				b = b[expr] != null ? b[expr] : '';
				if (a < b) return (asc) ? -1 : 1;
				if (a > b) return (asc) ? 1 : -1;
				return 0;
			});
		}
	
	}	
})();

if (window.d3) {
	d3.selection.prototype.moveToFront = function() {
	  return this.each(function(){
		  if (this.parentNode && this.parentNode.appendChild)    this.parentNode.appendChild(this);
	  });
	};
}

var Storage = (function () {
	var objects = {}
    return {
		get : function(key) {
			var o = objects[key]
			if (!o) {
				//console.warn('read', key)
				o = objects[key] = localStorage[key] ? JSON.parse(localStorage[key]) : null;
			}
			return o;
		},
		has : function(key) {
			return localStorage[key]!=null && localStorage[key]!=undefined;
		},
		update : function(key, prop, val) {
			var usettings = Storage.get(key)
			usettings[prop] = val;
			Storage.set('user-settings', usettings);
		},
		set : function(key, val) {
			if (val) {
				//try { localStorage[key] = JSON.stringify(val) } catch(e) { console.warn('Storage limit overdraft!!!') ; return false}
				localStorage[key] = JSON.stringify(val)
				objects[key] = val;
				Core.trigger('storage-update', {key : key, val : val})
			}
			else delete localStorage[key];
		},
		getArray :  function() {
			var arr = [];
			//console.log(objects, localStorage)
			for (var key in localStorage) {
				arr.push({key : key, value : localStorage[key]})
			}
			return arr;
		}
    };

})();
