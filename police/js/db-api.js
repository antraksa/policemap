'use strict';

var DBApi = (function() {
    var headers = { 'x-apikey': '58da976b9b7aa194660910e5', 'Content-Type': 'application/json', 'Accept': 'application/json' }
    var calls = []

    function docall(args, success) {
        var prom = {}
        var call = function(complete) {
            return $.ajax({
                url: 'https://police-7230.restdb.io/rest/{0}'.format(args.url),
                headers: headers,
                method: args.method || 'GET',
                data: args.data ? JSON.stringify(args.data) : null,
                success: function(data) {
                    //console.log('call success', args, data)
                    if (success) success(data)
                },
                error: function() {
                    Core.trigger('mess', { error: true, mess: 'Проблемы с доступом к rest db' })
                },
                complete: function() {
                    complete()
                    if (prom.done) prom.done()
                }
            })
        }
        //console.log('call', args)
        calls.push(call)
        process()
        return {
            done: function(done) {
                prom.done = done;
            }
        }
    }

    var locked = false, ltimeout;

    function process() {
        var call = calls[0];
        if (!call) return;
        if (locked)  {
            setTimeout(process, 500);
            return;
        }
        clearTimeout(ltimeout); 
        locked = true;
        call(function() {
            calls.splice(calls.indexOf(call), 1)
            ltimeout = setTimeout(function() {locked = false; }, 2000) 
            process()
        })
    }

    function getCommentsByTargetId(targetId, city, success) {
        var q = '{"target" : "{0}", "accepted" : true, "city" : "{1}"}';
        return docall({ url: 'police-comments?q=' + q.format(targetId, city) }, success)
    }

    function postComment(comment, success) {
        comment.created = +new Date();
        return docall({ method: 'POST', data: comment, url: 'police-comments' }, success)
    }
    return {
        docall: docall,
        headers: function(_headers) { headers = _headers },
        postComment: postComment,
        getCommentsByTargetId: getCommentsByTargetId
    }

})();
