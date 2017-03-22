'use strict';
(function ($) {
	$.fn.switchSelector = function() {
		return $(this).each(function() {
			var $this = $(this);
			var $select = $this.find('select').on('change', function() {
				select.call($a.eq(this.selectedIndex))
			})
			$select.data('update', function() {
				select.call($a.eq($select[0].selectedIndex))
			})
			function select() {
				$(this).addClass('selected').siblings().removeClass('selected')
			}
			var $a = $this.find('a').on('click', function() {
				select.call(this)
				$select[0].selectedIndex = $(this).index();
				$select.trigger('change')
			})
		})
	}
	$.fn.scrollTo = function($cont) {
		var $this = $(this)
		if (!$cont) $cont = $this.offsetParent(); //$('html, body');
		var top = $this.position().top - $cont.height()/3
        $cont.animate({scrollTop: top}, 500); 
        //console.log(top, $cont, $cont.scrollTop())
        return top
    }
	$.fn.serializeJson = function() {
		var o = {}
		$(this).find('[value]').each(function() {
			var $this = $(this);
			var field = this.value;
			o[this.name] = this.value;
		})
		return o;
	}
	$.fn.popup = function (args) {
		args = args || {}
		$(this).each(function() {
			var $a = $(this);
			if (!$a.attr('popup')) {
				$a.attr('popup', true)
				var clicked;
				
				$(window).on('click', function() {
					if (!$a.data('clicked')) {
						if ($a.hasClass('expanded')) {
							setTimeout(function() {
								var $popup = args.popup || $a.siblings('.popup');
								$popup.fadeOut(150, function() {
									$a.removeClass('expanded')
								});
							}, 150)
						}
					}
					$a.data('clicked', null)
				})
				if (!args.hideOnClick) {
					var _p  = (args.popup || $a.siblings('.popup'));
					_p.click(function() { $a.data('clicked', true); })
				}
				$a.on('click', function() {
					var $a = $(this);
					var $popup = args.popup || $a.siblings('.popup');
					$a.data('clicked', true).siblings('.popup-toggle').data('clicked', true) ;
					if (!$a.hasClass('expanded')) {
						$popup.fadeIn(150, function() {
							$a.addClass('expanded')
						})
					} else {
						$popup.fadeOut(150, function() {
							$a.removeClass('expanded')
						})
					}
					
				})
			}
		})
		return $(this);
		
	}
	$.fn.autocomplete = function ($qpopup, template, apicall, options) {
		 
		var prevQ, qtimeout, ptimeout, hoveredRow, data;
		options = options || {};
		
		function check(onfocus) {
			//console.log('check')
			var q = $.trim(this.value).toLowerCase() || '';
			if (/*q  && */(!options.test || options.test(q))) {
				var dopos = function() {
					clearTimeout(ptimeout)
					$qpopup.removeClass('collapsed')	
					if (options.position) {
						var p = $this.offset()
						$qpopup.css('top', p.top + 'px').css('left', p.left + 'px').width( $this.outerWidth())
					}
				}
				var render = function() {
					$qpopup.html(Mustache.render(template, data))
					var $lis =  $qpopup.find('li').on('mousedown', function(e) {
						prevQ = $(this).text();
						triggerChange($(this))
						$qpopup.addClass('collapsed');
						clearTimeout(ptimeout)
					});
				}
				//console.log(q, prevQ)
				if (q!=prevQ) {
					qtimeout = setTimeout(function() {
						apicall(q, function(_data) {
							console.log('_data', _data)
							data = _data//.slice(0, 10);
							dopos()
							render()
							prevQ = q;
						})
					}, 500)
					hoveredRow = null;
				}	 
				else {
					if (onfocus) render()
					clearTimeout(ptimeout)
					ptimeout = setTimeout(function() { dopos() }, 100)
				}	
			} else {
				$qpopup.addClass('collapsed');
				clearTimeout(ptimeout)
			}
		}
		
		
		var $this = $(this);
		//$qpopup.appendTo('body')
		$this.on('change keyup', function(e, args) {
			clearTimeout(qtimeout)
			if (args) return;
			if (e.keyCode && e.keyCode == 13) {
				if (hoveredRow)  triggerChange(hoveredRow);
				$qpopup.addClass('collapsed');
				return;
			}
			check.call(this);
		}).on('blur', function() {
			setTimeout(function() { $qpopup.addClass('collapsed'); }, 300)
			clearTimeout(qtimeout)
		}).on('keydown', function(e) {
			if (e.keyCode == 40) {
				hoverRow(false)
			} else if(e.keyCode == 38) {
				hoverRow(true)
			} 
		}).on('focus', function() {  
			setTimeout(function() { $this.select(); }, 50)  
			check.call(this, true);
		})
		
		function triggerChange($row) {
			if (data) { 
				$this.val($row.text());
				$this.trigger('change', [{ 
					label : $row.text().trim(),
					$row : $row,
					data : data
					//item : data[$row.index()]
				}] )
				clearTimeout(ptimeout)
				$qpopup.addClass('collapsed');
			}
		}
		
		function hoverRow(up) {
			if (prevQ) {
				if (!hoveredRow || !hoveredRow[0]) 
					hoveredRow = $qpopup.children().first().addClass('hovered');
				else 
					hoveredRow = hoveredRow[up ? 'prev' : 'next']().addClass('hovered')
				hoveredRow.siblings().removeClass('hovered')
			}
		}
		return this;
	}

	
	$.fn.blink = function (timeout) {
		$(this).each(function() {
			var $this = $(this).show();
			setTimeout( function() {$this.fadeOut(300)}, timeout || 3000 );
		});
		 return this;
	}
	$.fn.scrollPager = function (update, $list) {
		var $this = $(this);
		var index = 0, pageSize = 50, ds;
		var time;
		$this.on('scroll', function(e) {
			
			var scroll_bottom = $this.scrollTop() + $(this).height();
			var height = $list.height();
			if(scroll_bottom >= height){
				clearTimeout(time)
				time = setTimeout(function() {
					var st = (1+index) * pageSize;
					if (st + pageSize <= ds.length)
						update({paged : ds.slice(st,  st + pageSize) })
				}, 300)
			}
			//console.log(scroll_bottom, height)	
		})
		$this.data('pager', { 
			rebind : function(_ds ) {
				ds = _ds; 
				$this.scrollTop(0)
				index = 0;
				update({paged : ds.slice(0, pageSize), initial : true});  }
		})
		return this;
		
	}
	
	$.fn.slider = function() {
		$(this).each(function() {
			var $this = $(this);
			var isFloat= $this.attr('data-float');
			var isFloat= $this.attr('data-float');
			var ff = !isFloat ? parseInt : parseFloat;
			var min = ff($this.attr('data-min')) || 0;
			var max = ff($this.attr('data-max')) || 10;
				
			var $a = $this.find('a');
			var $p = $this.find('p');
			var $input = $('#' + $this.attr('data-input-id')); //$this.find('input');
			
			var offsetX = $this.offset().left;
			var width = $this.width()- $a.width();
			
			update()
			
			function set(pageX) {
				if (pageX < offsetX) {
					pageX = offsetX;
				}
				if (pageX > offsetX + width) {
					pageX = offsetX + width;
				}
				
				var x = (pageX - offsetX);
				var val = x * 100 / width;
				if (max)
					val= ((max-min)*val)/100 + min;
				val= (!isFloat) ? Math.round(val) : val.toFixed(1);
				$a.css('left', x + 'px').html(val);
				$input.val(val).trigger('change');
				$this.parent().toggleClass('filtered', val > 1)
			}
			var dragged;
			$this.on('mousedown touchstart', function(e) {
				offsetX = $this.offset().left;
				width = $this.width()- $a.width();
				set(Common.parseTouch(e).x) 
				dragged = true;
				$a.addClass('focused');
				e.preventDefault();
				return false;
			})
			$(window).on('mousemove touchmove', function(e) {  
				if (dragged) {
					set(Common.parseTouch(e).x) 
				}
			});
			$(document).on('mouseup touchend', function(e) {  
				dragged = false;
				$a.removeClass('focused');
			})

			function update(val) {
				if (!val )  val= $input.val();
				if (!val) val = min;
				val= Number(val);
				val= (!isFloat) ? Math.round(val) : val.toFixed(1);
				
				offsetX = $this.offset().left;
				width = $this.width()- $a.width();
				
				$input.val(val);
				$a.html(val)
				if (max)
					val = Math.round((val-min)*100/(max-min));
				
				var x = Math.round(val/100*width) ;
				
				$a.css('left', x + 'px');
				$this.parent().toggleClass('filtered', val > 1)
				return $input.data('slider');
			}
			
			function setMax(val) {
				max = Math.round(val || 10);
				$this.attr('data-max', max)
				return $input.data('slider');
			}
			function setMin(val) {
				min = val || 0;
				return $input.data('slider');
			}
			$input.data('slider',  { update : update, setMax : setMax, setMin : setMin })
		})
	}

	$.fn.sliderDouble = function() {
		$('.slider.double').each(function() {
			var $this = $(this);
			var isFloat= $this.attr('data-float');
			var ff = !isFloat ? parseInt : parseFloat;
			var min = ff($this.attr('data-min')) || 0;
			var max = ff($this.attr('data-max'));
				
			var $a = $this.find('a');
			var $input = $this.find('input');
			var $p = $this.find('p');
			var $b = $this.find('b');
			
			var aw = $a.width();
			var offsetX = $this.offset().left;
			var width = $this.width()- $a.width();
			var dmin = width / (max - min)/2
			
		
			function set(dx) {
				var i = $a.index($dragged)
				
				var x = $dragged.data('left') - dx;
				if (x < 0) x = 0;
				
				if ( x > width) x = width;
				if (i==0 &&  x > $a.eq(1).data('left') - aw - dmin) x = $a.eq(1).data('left') - aw - dmin;
				if (i==1 &&  x < $a.eq(0).data('left') + aw + dmin) x = $a.eq(0).data('left') + aw + dmin;
				
				$dragged.css('left', x + 'px').data('left', x);
				if (i==0) x+=aw;
				var val = x * 100 / width;
				if (max)
					val= ((max-min)*val)/100 + min;
				val= (!isFloat) ? Math.round(val) : val.toFixed(1);
				
				if (val!=$input.eq(i).val()) {
					$input.eq(i).val(val).trigger('change');
					$dragged.attr('data-value', val)
				}
				
				var startX =  $a.eq(0).data('left');
				var endX =  $a.eq(1).data('left');
				$b.css('left', startX + 'px').css('width', (endX - startX) +'px');
				
				return
				/*		
				var x = (pageX - offsetX);
				
				if (i==0 && val >= $a.eq(1).data('value')) {
					val = $a.eq(1).data('value')-1;
					x = $a.eq(1).data('left')-aw;
				}
				if (i==1 && val <= $a.eq(0).data('value')) {
					val = $a.eq(0).data('value')+1;
					x = $a.eq(0).data('left')+aw;
				}

				$dragged.data('value', val).data('left', x).attr('data-value', val) ;
				
				*/
			}

			var $dragged, startX;
			
			$this.on('mousedown touchstart', function(e) {
				updateCont()
				var i;
				var x = Common.parseTouch(e).x;
				var x0 = offsetX + $a.eq(0).data('left');
				var x1 = offsetX + $a.eq(1).data('left');
				if (x < x0) i = 0;
				else if (x > x1) i = 1;
				else {
					i = (Math.abs(x - x0) < Math.abs(x - x1)) ? 0 : 1;
				}
				$dragged = $a.eq(i).addClass('focused');;
				if (i==1) set(x1 - x) 
				else set(x0 - x)
				
				e.preventDefault();
				return false;
			})
			$a.on('mousedown touchstart', function(e) {
				updateCont();
				$dragged = $(this).addClass('focused');
				startX =  Common.parseTouch(e).x;
				e.preventDefault();
				return false;
			});
			
			$(window).on('mousemove touchmove', function(e) {  
				if ($dragged) {
					set(startX - Common.parseTouch(e).x) 
					startX =  Common.parseTouch(e).x;
				}
			});
			$(document).on('mouseup touchend', function(e) {  
				if ($dragged) {
					$dragged.removeClass('focused');
					$dragged = null;
				}
			})
			
			function updateCont() {
				offsetX = $this.offset().left;
				width = $this.width()- $a.width();
			}
			
			
			function updateAll() {
				var startX = update(0); 
				var endX = update(1)
				$b.css('left', startX + 'px').css('width', (endX - startX) +'px');
				
			}
			updateAll();
			
			function update(i, val) {
				updateCont();
				var val= val || ff($input.eq(i).val());
				if (!val) val = (i ==0 ? min : max);
				$input.eq(i).val(val);
				var oldval = val;
				if (max)
					val = Math.round((val-min)*100/(max-min));
				var x = Math.ceil(val/100*width) ;
				if (i==0) x-=aw;
				
				$a.eq(i).css('left', x + 'px').data('value', oldval).data('left', x).attr('data-value', oldval);;
				return x;
				 
			}
			$input.data('slider', {
				update : function() { updateAll()}
			})

		})
	}
})(jQuery);



