bootstrap = ->
    $('pre').each (iter, el) ->
        html = $(el).html()
        newline = html.indexOf '\n'
        lang = html.slice ((html.indexOf '=')+1), newline
        $(this).attr 'class', 'sh_' + lang
        
        $(el).html ('<code>' + html.slice (newline+1), html.length)
    sh_highlightDocument()



$(document).ready () ->
    bootstrap()

