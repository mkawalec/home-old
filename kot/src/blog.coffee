bootstrap = ->
    # Change (or not) the header picture
    # Just a nice hack:D
    # Note that the probability of getting 1 is 3 times 
    # bigger than of 0
    #
    # The code is turned off now, as I am unsure if 
    # I want this effect to exist
    ###
    @header_pic_num = 2
    pic = Math.floor(Math.random()*@header_pic_num)
    header = $('#header')[0]
    if pic == 0
        pic = Math.floor(Math.random()*@header_pic_num)
        
    
    style = ($(header).attr 'style').toString()
    style_array = style.split '1'
    style = style_array[0] + pic + style_array[1]
    $(header).attr 'style', style
    ###

    # Set the code colouring
    $('pre').each (iter, el) ->
        html = $(el).html()
        newline = html.indexOf '\n'
        lang = html.slice ((html.indexOf '=')+1), newline
        $(this).attr 'class', 'sh_' + lang
        
        $(el).html ('<code>' + html.slice (newline+1), html.length)
    sh_highlightDocument()


$(document).ready () ->
    bootstrap()

