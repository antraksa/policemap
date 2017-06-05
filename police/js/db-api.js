var DBApi = (function() {
    var headers = { 'x-apikey': '58da976b9b7aa194660910e5', 'Content-Type': 'application/json', 'Accept': 'application/json' }
    var calls = []

    function call(args, success) {
        call = function(complete) {
            return $.ajax({
                url: 'https://police-7230.restdb.io/rest/{0}'.format(args.url),
                headers: headers,
                method: args.method || 'GET',
                data: args.data ? JSON.stringify(args.data) : null,
                success: function(data) {
                    console.log('call success', args, data)
                    if (success) success(data)
                },
                error: function() {
                    Core.trigger('mess', { error: true, mess: 'Проблемы с доступом к rest db' })
                },
                complete: complete
            })
        }
        calls.push(call)
        process()
    }

    var currentCall;
    function process() {
        var call = calls[0];
        if (!call || currentCall)  return;
        currentCall = call;
        call(function() {
            calls.splice(calls.indexOf(call), 1)
            if (calls[0]) {
                currentCall = calls[0];
                setTimeout(process, 3000)
            } else {
                setTimeout(function() { currentCall = null },3000)
            }
        })
    }

    function getCommentsByTargetId(targetId, success) {
        var q = '{"target" : "{0}", "accepted" : true}';
        return call({ url: 'police-comments?q=' + q.format(targetId) }, success)
    }

    function postComment(comment, success) {
        comment.created = +new Date();
        return call({ method: 'POST', data: comment, url: 'police-comments' }, success)
    }
    return {
        call: call,
        headers: function(_headers) { headers = _headers },
        postComment: postComment,
        getCommentsByTargetId: getCommentsByTargetId
    }

})();
