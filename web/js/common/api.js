'use strict';

var API = (function(){
	var Services = Config.Services,Proxy = Config.Proxy;
	var topicsUpdated = false, istestUrl = location.href.indexOf('__testUrl') >=0;
	//var clustersQueryString, clustersData;
	
	var getGraph = function(link,ont, success, error) {
		var graphUrl = Services.ontologies + 'api/ontologies/{1}/terms/{0}/graph';
		//'http://localhost/new-history/php/proxy.php?proxyUrl='
		$.getJSON(Proxy.proxy2 +  encodeURIComponent(graphUrl.format(encodeURIComponent(encodeURIComponent(link)), ont)), function(data) {
			console.log('getGraph', link, ont, data)
			data.link =  link;
			data.ont =  ont;
			success(data)
		}).error(error)
	}
	
	var xhr = function(req) {
		var xhr = new window.XMLHttpRequest();
		//console.log('apply progress', req)
		xhr.addEventListener("progress", function(e) {
			//console.log('progress', e)
			Core.trigger('Download.progress', {  request : req, progress :e.loaded  })
		}, false);
		return xhr;
	}
			
	return {
		clusters : function(args, success, error, progress) {
			//return
			var d1 = args.d1, d2 = args.d2;
			var q = args.subQ || args.q;
			var alg = args.alg;
			var source = args.source || 'pubmed';
			//console.log('args', args)
			var isOrpha = source == 'orpha';
			var noLenses = source == 'custom' || source == 'answers' || source == 'alxlab';
			var journal = source == 'pubmed' && args.journal ? '"{0}"[Journal]'.format(args.journal)  : '';
			var limit = isOrpha ? 100 : parseInt(args.limit);
			var isDcs = limit > 0 || isOrpha;
			var lens = noLenses ? 0 : args.lens;
			var isKeywords =  lens== 2 && source == 'pubmed';
			
			var fsuccess = function(data, rq) {
				if (isKeywords || isDcs) {
					var allDocs = {};
					data.documents.forEach(function(d) {
						if (allDocs[d.id]) return;
 						allDocs[d.id] = d;
						if (isOrpha) {
							d.date = d.pubyear;
						}
						else if (d.pubyear) {
							d.date = d.pubyear.split('-')[0]
						} 
						if (d.keywords)
							d.tags = d.keywords.split(',')
						d.query = q;	
					})
					success({clusters : data.clusters, allDocs : allDocs, docsArr : data.documents})
				} else 
					success(data)
			}
			
			var dataRange = '', getData;
			var req = { get : function() { return xhr(this) }, isClusters: true };
			var url;
			if (istestUrl) url = getTestUrl(isDcs, args)
			var progress;
			if (isKeywords) {
				PubmedCommon.get(q, d1, d2, req, function(data) {fsuccess(data, req)})
			}
			else if (isDcs) {
				if (source == 'pubmed')
					dataRange= '(%22{0}%22[PDat]%20:%20%22{1}%22[PDat])%20'.format(d1, d2);
				else if (source == 'clinicaltrials')
					dataRange = '&lup_s=01/01/{0}&lup_e=01/01/{1}'.format(d1,d2)
				else if (source == 'orpha') {
					var start_suffix = "-01-01T0:00:00Z";
					var end_suffix = "-12-31T23:59:59Z";
					console.log(d1+start_suffix, d2+end_suffix)
					
					dataRange='&SolrDocumentSource.solrFilterQuery=date:[{0}%20TO%20{1}]'.format(d1+start_suffix, d2+end_suffix)
					
				}
				//console.log(decodeURIComponent('+date%3A%5B2016-05-16T21%3A58%3A13.580Z+TO+2010-05-15T21%3A58%3A13.580Z%5D'))
				var dcsurl = lens == 1 ?  Services.dcs_rare :  Services.dcs; 
				if (!url) url = dcsurl +  '?dcs.source={0}&query={1}{2}{4}&dcs.output.format=JSON&dcs.&results={5}&callback'.format( source, q, dataRange, alg,  journal, limit);
				req.xhr = $.ajax({type : 'GET',  url : url, xhr : req.get.bind(req) }).error(error)
					.success(function(data) { fsuccess(data, req)})
			} else {
				var surl = lens == 1 ?  Services.lingo4g_rare :  Services.lingo4g; 
				var port = source == 'pubmed' ? 9999 : source == 'clinicaltrials' ? 9299 : 0;
				LingoCommon.post(surl,port, req, args,  function(data) { 
					fsuccess(data, req)
				} , error, progress)
			}
			
			return req;
		},
		pathwaysSearch : function(args, success, error) {
			//args.q = 'Hypophosphatasia';
			var searchUrl = istestUrl ? 'data/ont-search.json' : Proxy.proxy2 + Services.ontologies + 'api/search?q={0}&start=0'.format(args.q) 
			var req = $.getJSON(searchUrl, function(data) { 
				var docs = data.response.docs, exist = false;
				var onts = [];
				docs.forEach(function(d) {
					onts.push( { ont : d.ontology_name, link : d.iri, label:d.label })
				})
				if (onts.length == 0) 
					success()
				else {
					getGraph(onts[0].link, onts[0].ont, function(data) {
						data.ontoligies = onts;
						success(data)
					},error)
				}

			}).error(error)
		},
		getGraph : getGraph,
		pathwaysSelect : function(link, ont, success, error) {
			var selectUrl = Services.ontologies + 'api/ontologies/{1}/terms/{0}';
			//console.warn(selectUrl.format(encodeURIComponent(encodeURIComponent(link)), ont))
			$.getJSON(Proxy.proxy2 +  encodeURIComponent(selectUrl.format(encodeURIComponent(encodeURIComponent(link)), ont)), function(data) { 
				var doc = { 
					id  : 0,
					title : data.label,
					snippet : data.description ? data.description.join('\n') : '',
					url : Services.ontologies + 'ontologies/{0}/terms/graph?iri={1}'.format(ont, link)
				}
				success({ document : doc})
			})
		},
		queryAutocomplete : function(q, success) {
			var url = Proxy.proxy2 + encodeURIComponent(Services.scibite + 'lookup.si?q={0}&app_id=at764&app_key=882acef635decb837cd5a8'.format(encodeURIComponent(q)));
			return $.getJSON(url, function(data) {
				//console.log('queryAutocomplete', q, data)
				success(data ? data.map(function(d) { return d.name }) : [])
			})//.error(function() { success([]) } )
		},
		getFacets  : function(q, success, noDefaultKey) {
			//var url = Proxy.proxy2 +  encodeURIComponent(Services.scibite +'facet.si?q={0}&rows=500&app_id=at764&app_key=882acef635decb837cd5a8');
			var url = Services.scibite +'facet.si?q={0}&rows=500&app_id=at764&app_key=882acef635decb837cd5a8'.format(encodeURIComponent(q));
			url = Proxy.proxy2 + encodeURIComponent(url);
			var res = [];
			var req = $.getJSON(url, function(data) {
				console.info(url, data)
				var lbs = data.FACETS.id2Name, cd = data.FACETS.intersectCountData;
				for (var key in lbs) {
					if (!res.filter(function(r) { return r.label.toLowerCase() == lbs[key].toLowerCase()})[0])
						res.push({ key : key, label : lbs[key], count : cd[key] })
				}
				Common.sortByField(res, 'count')
			}).complete(function() {
				if (!noDefaultKey && !res.filter(function(r) { return r.label.toLowerCase() == q.toLowerCase()})[0])
					res.splice(0,0,{ key : q, label : q, count :0, original : true })
			
				success(res.slice(0,20));
			})
			return req;
		},
		getNews: function(topic, success, error, rows) {
			var docsReaded = Storage.get('docsReaded') || [];
			//console.info(topic)
			var q = topic.key || topic.label;
			rows = rows || 20;
			var q = topic.special ? 'special=' + topic.id : 'q=' + encodeURIComponent(q);
			var url = Proxy.proxy2 + encodeURIComponent(Services.scibite + 'news.si?{0}&rows={1}&app_id=at764&app_key=882acef635decb837cd5a8'.format(q, rows))
			
			//console.warn(url)
			if (location.href.indexOf('__testUrl') >=0) 
				url = 'data/news.json'
			return $.getJSON(url, function(data) {
				//console.warn('news', topic.label,  data)
				topic.documents = [];
				topic.newDocsCount = 0;
				data.DOCS.forEach(function(d) {
					var doc = {
						date: (new Date(d.date)),
						snippet : d.body, 
						title : d.title,
						url : d.hyperlink,
						id : d.uid,
						tags : d.tagname,
					}
					if (doc.tags && doc.tags.length > 10)
						doc.tags = doc.tags.slice(0,10)
					
					topic.documents.push(doc)
					if (docsReaded.indexOf(doc.id) < 0) {
						doc.isNew = true;
						topic.newDocsCount++
					}
				})
				
				success({topic : topic})
			}).error(error)
		},
		topTopics :function(success)  {
			//var	url = 'data/top.json' //hardcoded top topics
			var url = Proxy.proxy1 + 'https://news.scibite.com/scibites/trends.html';
			
			var topics = Storage.get('topTopics')
			//console.warn(topics)
			if (topics) {
				//console.warn('topics', topics)
				var  f = success;
				setTimeout(function() {f(topics)}, 100) 
				success = null;
			} 
			if (!topics || !topicsUpdated){ 
				$.get(url , function(data) {
					var $el = $('<div>');
					$el.html(data);
					var res  = []
					//$el.find('img').remove()
					//console.log($(el).find('img, [src]'))
					$el.find('td').each(function() {
						var lb = $.trim($(this).text());
						var type = parseInt($(this).index());
						var query = $(this).find('a').attr('href').split('q=')[1];
						var o = { label : lb, type : type, query : query}
						res.push(o)
					});
					Storage.set('topTopics', res)
					topicsUpdated = true;
					if (success) success(res)
					console.warn('top topics', (res))
				}).error(function() { })
			}
			
		},
		getCardsInfo : function(id, success, complete) {
			var url = Services.disgenet + '?default-graph-uri=&query=prefix+wp%3A++++++%3Chttp%3A%2F%2Fvocabularies.wikipathways.org%2Fwp%23%3E+%0D%0A%0D%0ASELECT+DISTINCT+%3Fdisease+%3FdiseaseName+str%28%3FphenotypeName%29+as+%3FphenotypeName+str%28%3FgeneName%29+as+%3FgeneName+str%28%3FpathwayName%29+as+%3FpathwayName+WHERE+{+%0D%0A%3Fgda+sio%3ASIO_000628+%3Fdisease%2C%3Fgene+.+%0D%0A%3Fgene+rdf%3Atype+ncit%3AC16612+.%0D%0A%3Fgene+dcterms%3Atitle+%3FgeneName+.%0D%0A%3Fdisease+rdf%3Atype+ncit%3AC7057+%3B%0D%0A+++++++++dcterms%3Atitle+%3FdiseaseName+.+%0D%0A%3Fdisease+skos%3AexactMatch+%3Chttp%3A%2F%2Fidentifiers.org%2Forphanet%2F{0}%3E+.%0D%0A%3Chttp%3A%2F%2Fidentifiers.org%2Forphanet%2F{0}%3E+sio%3ASIO_000341+%3Fphenotype+.+%0D%0A%3Fphenotype+dcterms%3Atitle+%3FphenotypeName+.+%0D%0A%0D%0AOPTIONAL{%0D%0A{SELECT+DISTINCT+%3Fgene+%3FpathwayName+WHERE+{%0D%0A%3Fdisease+skos%3AexactMatch+%3Chttp%3A%2F%2Fidentifiers.org%2Forphanet%2F{0}%3E+.%0D%0A%3Fgda+sio%3ASIO_000628+%3Fdisease%2C%3Fgene+.+%0D%0A%3Fgene+rdf%3Atype+ncit%3AC16612+.+%0D%0A%3Fdisease+rdf%3Atype+ncit%3AC7057+.%0D%0ASERVICE+%3Chttp%3A%2F%2Fsparql.wikipathways.org%2F%3E+{%0D%0A%3FgeneProduct+a+wp%3AGeneProduct+.%0D%0A%3FgeneProduct+dc%3Aidentifier+%3Fgene+.%0D%0A%3FgeneProduct+dcterms%3AisPartOf+%3Fpathway+.%0D%0A%3Fpathway+dcterms%3Aidentifier+%3Fpathwayid+.%0D%0A%3Fpathway+dc%3Atitle+%3FpathwayName+.%0D%0A}+%23+end+of+service%0D%0A}+%23+end+of+service+query%0D%0A}+%23+end+of+subquery%0D%0A}+%23+end+of+optional%0D%0A}+%23+end+of+query%0D%0AORDER+BY+DESC%28%3FphenotypeName%29DESC%28%3FgeneName%29DESC%28%3FpathwayName%29%0D%0ALIMIT+100&format=json&timeout=0&debug=on';
			url = url.format(id)
			//console.log(id, url)
			url = Proxy.proxy2 +  encodeURIComponent(url)
			if (istestUrl) url = 'data/desprops.json'
			$.getJSON(url,function(data) {
				
				var  genes = [], phenotypes = [], pathways= [];
				var ds = data.results.bindings.forEach(function(d) {
					if (genes.indexOf(d.geneName.value) < 0) genes.push(d.geneName.value) ;
					var p = d.pathwayName ?  d.pathwayName.value: null
					if (p && pathways.indexOf(p) < 0) pathways.push(p);
					if (phenotypes.indexOf(d.phenotypeName.value) < 0) phenotypes.push(d.phenotypeName.value) ;
				})
				genes.sort();pathways.sort(); phenotypes.sort()
				success({genes : genes, phenotypes : phenotypes, pathways : pathways})
				
			}).complete(complete)
			
		},
		getAnnotations: function(success) {
			/*var url = Services.bioontology + 'annotator?text={0}&apikey=0b9c65e3-76b3-498e-9330-5c2eb1998d38&ontologies=IDO,FB-CV,MEDDRA,PW,GO,ORDO,PPIO';
			return $.getJSON(url.format(encodeURIComponent(text)),function(data) {
				var annotations = [], cur;
				data.forEach(function(d) {
					var txt = d.annotations[0].text.toLowerCase();
					if (!cur || cur.text!=txt) {
						cur = {text : txt, links : []}
						annotations.push(cur)
					}
					cur.links.push( {lnk : d.annotatedClass.links.ui, index : cur.links.length })
				})
				success({annotations : annotations})
				//console.warn('getTagging', data);
			})*/
			 $.getJSON('data/annotation-dict.json', success)
		}, getGeneReactome : function(name, success, complete) {
			var getPNG =  function (o) {
				var url1 = Proxy.proxy1 + Services.reactomews + 'highlightPathwayDiagram/{0}/PNG'.format(o.dbId)
				console.log(url1)
				$.ajax({method : 'POST', url : url1, 
					success : function(data) {
						o.png = data;
						success(o);
					}, beforeSend: function (xhr) {
						xhr.setRequestHeader ("Content-Type", "application/json");
					} 
				}).complete(complete)
			}
			var url = Proxy.proxy1 + Services.reactomews + 'queryHitPathways';
			
			
			$.ajax({method : 'POST', data :  name , url : url, 
				success : function(data) {
					var diagram = data.forEach(function(o) {
						if (o.hasDiagram) {
							console.info('queryHitPathways', o)
							getPNG(o)
							url = null
						} 
					})
					if (url) complete()
				}, beforeSend: function (xhr) {
					xhr.setRequestHeader ("Content-Type", "application/json");
				} 
			}).error(complete)

		}, getGenePhenotypes : function(symbol, success) {
			var url  = Services.rolodex + 'hpo/annotations??filter={gene-symbol:%22ALPL%22}'
			return $.ajax({method : 'GET', url :  url, success : function(data) {
				//console.log('getGenePhenotypes', data)
				var phenotypes = data._embedded['rh:doc'].map(function(o) { return { id : o['HPO-ID'], name : o['HPO-term-name']}});
				success({phenotypes : phenotypes});
			}, beforeSend : function (xhr) {
				xhr.setRequestHeader ("Authorization", "Basic " + btoa('andrei:andrei'));
			}})
		}, wiki : WikiCommon.wiki 
		, wikiFull : WikiCommon.wikiFull
		, heatmap : {
			search : function(q, success) {
				var url = 'data/phen/search.json';
				//var q = 'ALPL';
				//var url = Proxy.proxy1 + 'http://10.194.66.25:9298/search/{0}.json'.format(q)
				$.getJSON(url ,  function(data) {
					console.log('heatmap search', q,  data.results)
					success({ results : data.results})
				})
			},list : function(id, success) {
				var url = 'data/phen/list.json';
				//var url = Proxy.proxy1 + 'http://10.194.66.25:9298/gene/{0}/phenotype_list.json'.format(id);
				$.getJSON(url ,function(data) {
					success({ phenotypes : data.phenotype_list})
					console.log('heatmap list', id, data)
				})
			},relationship : function(ids, target, success) {
				var url = 'data/phen/rel{0}.json'.format(target);
				//var url = Proxy.proxy1 + 'http://beta.monarchinitiative.org/simsearch/phenotype';
				$.post(url , {'input_items' : ids.join(' ')}, function(data) {
					//console.log('heatmap rel', data.b[0])
					var result = data.b.map(function(b) {
						if (b.label.toLowerCase() == 'lowe oculocerebrorenal syndrome') {
							b.matches.forEach(function(m) {
								 if (m.a.label == 'Proptosis')
										console.warn(m)
							}) 
						}
						Common.sortByField(b.matches, 'label', true)
						return { label : b.label, id : b.id,  type : b.type, taxon : b.taxon,
						matches : b.matches.map (function(m) { return  { value : m.b.IC, match : {label : b.label, id: b.id},   id : m.a.id  } }) }
						//console.log(b)
					 })
					success({ target : target, result : result})
				})
			},
		}
		
	}
	
	function getTestUrl(isDcs, args) {
		var datas = ['clinical.json', 'alpl.json', 'bigdata.json', 'shortestPath.json', 'clusters.json', 'limit.json', 'clusters1.json', 'clusters2011-2012.json', 'clusters2012-2013.json', 'clusters2013-2014.json', 'clusters2014-2015.json']
		if (args.nestReqIndex) {
			return (isDcs ? 'data/clusters{0}-{1}.json' : 'data/lingo/hpp{0}-{1}.json').format(args.d1, args.d2)
			//console.log(args)
			//return 'data/matrix2011.json';
			//return 'data/matrix2016.json';
		} else {
			return 'data/' + datas[1];
		}
	}
		
	function generate(n, m) {
		var maxdepth = 0	;
		var docs = new Array(n);
		for (var i=0; i < n; i++) {
			docs[i] = { id : 'id' + i, title : 'Document ' + i, snippet : ' Some long snippet...'}
		}
		var allclusters = [],  count = 0;
		var run = function (clusters, depth) {
			if (depth > maxdepth) return;
			var rnd = Math.random() * 5 + 20 ;
			
			var cls = []; 
			for (var i=0; i < rnd; i++) {
				var dr = Math.random() * n/2;
				var c = {phrases : [ 'C' + depth + '_' + i ], id : count++, clusters : [] };
				cls.push(c);
				c.documents = (depth == maxdepth) ? docs.slice(dr, dr + Math.random() * 30 + 5).map(function(d) {return d.id}) : []
				if (count > m) return;
			}
			for (var i=0; i < rnd; i++) {
				run(cls[i].clusters, depth + 1)
				clusters.push(cls[i])
			}
		}
		run(allclusters, 0)
		return  {
			clusters : allclusters,
			documents : docs 
		}
 	} 
})()





