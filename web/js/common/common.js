'use strict';

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

var Common = (function () {
	return {
		getSelectionCoords : function () {
			var sel = document.selection, range, rect;
			var x = 0, y = 0;
			if (sel) {
				if (sel.type != "Control") {
					range = sel.createRange();
					range.collapse(true);
					x = range.boundingLeft;
					y = range.boundingTop;
				}
			} else if (window.getSelection) {
				sel = window.getSelection();
				if (sel.rangeCount) {
					range = sel.getRangeAt(0).cloneRange();
					if (range.getClientRects) {
						range.collapse(true);
						if (range.getClientRects().length>0){
							rect = range.getClientRects()[0];
							x = rect.left;
							y = rect.top;
						}
					}
				
				// Fall back to inserting a temporary element
					 if (x == 0 && y == 0) {
						var span = document.createElement("span");
						if (span.getClientRects) {
							// Ensure span has dimensions and position by
							// adding a zero-width space character
							span.appendChild( document.createTextNode("\u200b") );
							range.insertNode(span);
							rect = span.getClientRects()[0];
							x = rect.left;
							y = rect.top;
							var spanParent = span.parentNode;
							spanParent.removeChild(span);

							// Glue any broken text nodes back together
							spanParent.normalize();
						}
					}
				}
			}
			return { x: x, y: y };
		},

		parseTouch : function (e, i) {
			e = e.originalEvent;
			var touch = e.touches ? e.touches.item( i || 0) : null;
			return {
				x: touch ? touch.clientX : e.clientX,
				y: touch ? touch.clientY : e.clientY,
				target: touch ? document.elementFromPoint(touch.clientX, touch.clientY) : e.target 
			};
		},
		hexToRgb : function (hex, a) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? 'rgba({0},{1},{2}, {3})'.format( parseInt(result[1], 16), parseInt(result[2], 16),parseInt(result[3], 16), a) : null;
		},
		indexOf : function(arr, callback) {
			for (var i = 0; i < arr.length; i ++ ) {
				if (callback(arr[i])) return i;
			}
			return -1;
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
	   clone: function(o){
          return JSON.parse(JSON.stringify(o));
        },
		//convert svg to imgage url 
		svgSerialize : function(el, success, transform, size) {
			//var svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="{0}"  height="{1}"><g class="root">'.format(size.w, window.innerHeight/2) + el.find('.root')[0].innerHTML+'</g></svg>';
			
			el.attr('xmlns','http://www.w3.org/2000/svg')
			
			var svgMarkup = el.wrapAll('<div>').parent().html();
			//console.warn(svgMarkup)
			
			var $svg = $(svgMarkup);
			transform($svg)
			svgMarkup = $svg.wrapAll('<div>').parent().html();
			var DOMURL = window.URL || window.webkitURL || window;
			//try {
				
				var blob = new Blob([svgMarkup], {type: "image/svg+xml;charset=utf-8"});
				var url = DOMURL.createObjectURL(blob);
				var img = new Image();
				img.src = url;
				img.onload = function() {
					var can = $('#screenshot-renderer')[0]
					can.width = size.width/5;
					can.height = size.height/5;
					var ctx =  can.getContext('2d');
					ctx.clearRect(0, 0, size.width/5, size.height/5);
					ctx.drawImage(img, 0,0, size.width/5, size.height/5)
					var rurl = can.toDataURL()
					//$('.screenshot')[0].src = rurl;
					if (success) success({ url : rurl })
				}
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
		getColors : function (l) {
			var colors = []
			var step = Math.ceil(360/l)
			for (var i = step; i <= 360; i+=step) {
				var c = Common.hslToRgb(i/360, 0.6, 0.4);
				colors.push('rgb({0},{1}, {2})'.format(c[0], c[1], c[2]))
			}
			return colors
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
/*
var Http = (function() {
	function ajax(url, args) {
		args = args || {};
		var method = args.method || 'GET'
			
		var xhr = new XMLHttpRequest();
		var promise = new Promise(function(resolve, reject) {
			xhr.open(method, url, true);

			xhr.onload = function() {
			  if (this.status == 200) {
				resolve(this.response);
			  } else {
				var error = new Error(this.statusText);
				error.code = this.status;
				reject(error);
			  }
			};

			xhr.onerror = function() {
			  reject(new Error("Network Error"));
			};

			xhr.send();
		});
		promise.xhr = xhr;
		console.log(promise.xhr)
		return promise;
	}
	
	return { 
		ajax : ajax,
		get : function(url) { return ajax(url) },
		post : function(url, data) { return ajax(url, { data : data }) }
	}
})();*/

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
