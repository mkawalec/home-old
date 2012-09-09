# Get the left/top offsets of an element
get_offsets = (element) ->
    offset = [element.offsetLeft, element.offsetTop]
    while element = element.offsetParent
        offset[0] += element.offsetLeft
        offset[1] += element.offsetTop
    return offset

# Show the user that the update was successful
status_notify = (object, what) ->
    bg_color = $(object).css 'background-color'
    border_color = ""
    if ($(object).css 'border-color').length > 0
        border_color = $(object).css 'border-color'
    else
        # A super-regex for matching any colour format (known to me)
        border_color = (((($(object).attr 'style').match /border-color:(#[0-9A-F]{6})|(rgb\((\d+),\s*(\d+),\s*(\d+)\))/)[0]).match /#([0-9A-F]{6})|(rgb\((\d+),\s*(\d+),\s*(\d+)\))/)[0]
        console.log border_color
    
    switch what
        when "success"
            ($(object).stop().animate {'background-color': '#99EE99', 'border-color': '#EAFF00'},
                500).animate {'background-color': bg_color,'border-color': border_color}, 500
        when "error"
            ($(object).stop().animate {'background-color': '#EE9999', 'border-color': '#EE0000'},
                500).animate {'background-color': bg_color,'border-color': border_color}, 500
            console.log 'error, error'

# Converts decimal to hex
decimal_to_hex = (decimal) ->
    hex = decimal.toString(16)
    if hex.length == 1
        hex = '0' + hex
    return hex

# Converts hex to decimal
hex_to_decimal = (hex) ->
    return parseInt hex, 16

# Generates an opposite colour
return_opposite = (colour) ->
    colour = rgb2hex colour
    return '#' + (decimal_to_hex (255-hex_to_decimal colour.substr 0,2)).toString() +
        (decimal_to_hex (255-hex_to_decimal colour.substr 2,2)).toString() +
        (decimal_to_hex (255-hex_to_decimal colour.substr 4,2)).toString()

rgb2hex = (rgb) ->
    rgb = rgb.match /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/
    return (hex rgb[1]) + (hex rgb[2]) + (hex rgb[3])

hex = (x) ->
    return if isNaN(x) then "00" else hexDigits[(x - x % 16) / 16] + hexDigits[x % 16]

hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f")

# Choose a minimum of a two numbers
min = (first, second) ->
    if first < second
        return first
    return second

# Choose a max of a two numbers
max = (first, second) ->
    if first > second
        return first
    return second

rgb2hsv = (hex) ->
    red = hex_to_decimal hex.substr 1,2
    green = hex_to_decimal hex.substr 3,2
    blue = hex_to_decimal hex.substr 5,2
    hue = 0; sat = 0; f = 0; i = 0

    x = min (min red, green), blue
    val = max (max red, green), blue

    if x != val
        if red == x
            f = green-blue
            i = 3
        else
            if green == x
                f = blue-red
                i = 5
            else
                f = red-green
                i = 1
        hue = ((i-f/(val-x))*60)%360
        sat = (val-x)/val
    return [hue,sat,val]

