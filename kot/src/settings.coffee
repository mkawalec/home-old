@max_image_size = 1024*1024*5


# Setup the structure
setup_structure = () ->
    # Sort colours
    sort_colours()

    # Holder element
    holder = document.getElementById 'settings_holder'

    #### Colour theme picker ####
    # Setup the colour theme picker
    colour_picker = document.createElement 'div'
    $(colour_picker).attr 'class', 'span4 colour_picker'

    colour_picker_header = document.createElement 'div'
    $(colour_picker_header).attr 'id', 'colour_picker_header'
    $(colour_picker_header).attr 'class', 'header'
    $(colour_picker_header).text 'Select colour:'

    colour_picker_body = document.createElement 'div'
    $(colour_picker_body).attr 'id', 'colour_picker_body'
    $(colour_picker_body).attr 'class', 'body'

    # Add the selectable colours
    for colour in colours
        colour_body = document.createElement 'div'
        $(colour_body).attr 'class', 'colour_body'
        $(colour_body).attr 'style', "border-color:#{colour.border};background-color:#{colour.colour};"
        $(colour_body).attr 'data-id', colour.id

        colour_picker_body.appendChild colour_body

    colour_picker.appendChild colour_picker_header
    colour_picker.appendChild colour_picker_body
    holder.appendChild colour_picker

    #### Avatar selector ####
    avatar = document.createElement 'div'
    $(avatar).attr 'class', 'span5 avatar_selector'

    avatar_header = document.createElement 'div'
    $(avatar_header).attr 'class', 'header'
    $(avatar_header).text 'Your avatar:'

    avatar_body = document.createElement 'div'
    $(avatar_body).attr 'class', 'body'

    # Avatar alerts holder
    avatar_alert = document.createElement 'div'
    $(avatar_alert).attr 'id', 'avatar_alert'

    # Avatar thumbnail
    avatar_thumbnail = document.createElement 'div'
    $(avatar_thumbnail).attr 'id', 'avatar_thumbnail'

    file_input = document.createElement 'input'
    $(file_input).attr 'type', 'file'
    $(file_input).attr 'id', 'file_input'
    $(file_input).attr 'style', 'display:none;'

    # A drop area on which files may be dragged
    file_dropbox = document.createElement 'div'
    $(file_dropbox).attr 'id', 'file_dropbox'
    dropbox_label = document.createElement 'div'
    $(dropbox_label).attr 'id', 'dropbox_label'
    $(dropbox_label).html '<h1>Drop files here</h1>'
    file_dropbox.appendChild dropbox_label

    # Delete button
    delete_button = document.createElement 'button'
    $(delete_button).attr 'class', 'btn btn-danger'
    $(delete_button).attr 'id', 'delete_button'
    $(delete_button).text 'Delete your avatar'
    
    send_button = document.createElement 'button'
    $(send_button).attr 'class', 'btn btn-primary'
    $(send_button).attr 'id', 'send_button'
    $(send_button).text 'Choose file'

    avatar_body.appendChild avatar_alert
    avatar_body.appendChild file_input
    avatar_body.appendChild avatar_thumbnail
    avatar_body.appendChild delete_button
    avatar_body.appendChild send_button
    avatar_body.appendChild file_dropbox

    avatar.appendChild avatar_header
    avatar.appendChild avatar_body
    holder.appendChild avatar
   
    #### General bookkeeping ####
    request_avatar()
    mark_selected()
    bind_events()

# Marks the selected colour theme
mark_selected = () ->
    selection_marker = document.createElement 'div'
    $(selection_marker).attr 'class', 'selection_marker'

    # The holder element
    holder = document.getElementById 'colour_picker_body'

    # Get the offsets of the currently selected colour theme
    currently_selected = $(".colour_body[data-id=#{current_colour}]")[0]
    offset_left = currently_selected.offsetLeft
    offset_top = currently_selected.offsetTop

    # Now, the selection background sticks out for 5px, so
    offset_left -= 5; offset_top -= 5
   
    opposite = return_opposite $(currently_selected).css 'background-color'
    $(selection_marker).attr 'style', "left:#{offset_left}px;top:#{offset_top}px;"+
        "background-color:#{opposite}"
    holder.appendChild selection_marker

# Request the avatar image from the server
request_avatar = ->
    thumb = $('#avatar_thumbnail')[0]
    $.ajax {
        url: script_root + '_avatar_get'
        type: 'POST'
        dataType: 'json'
        data:
            get: 'True'
        success: (data) ->
            if data.status
                img = document.createElement 'img'
                $(img).attr 'class', 'thumb'
                img.src = 'data:'+data.mimetype+';base64,'+data.file
                thumb.appendChild img

                status_notify thumb, 'success'

        error: (data) ->
            status_notify thumb, 'error'
    }

# Bind the events (when one clicks on the colour block)
bind_events = () ->
    $('#send_button').bind 'click', (event) ->
        event.preventDefault()
        $('#file_input').click()

    $('#delete_button').bind 'click', (event) ->
        #event.preventDefault()
        delete_avatar()

    $('#file_input').bind 'change', (event) ->
        send_file this.files

    $('.colour_body').each (iter, obj) ->
        $(obj).bind 'click', (event) ->
            # Sync with server - IMPLEMENT
            # Move the marker
            offset_left = this.offsetLeft
            offset_top = this.offsetTop
            color = return_opposite $(this).css 'background-color'
            offset_left -= 5; offset_top -= 5
            
            $('.selection_marker').stop().animate {top: offset_top, left: offset_left, 'background-color': color}, 250
            save_colour(this)

    # Dropbox events
    dropbox = document.getElementById 'file_dropbox'
    thumbnail = document.getElementById 'avatar_thumbnail'
    dropbox.addEventListener 'drop', dropbox_drop, false
    thumbnail.addEventListener 'drop', dropbox_drop, false

    $('#avatar_thumbnail').bind 'dragenter', (event) ->
        event.preventDefault()
    $('#avatar_thumbnail').bind 'dragover', (event) ->
        event.preventDefault()
    $('#file_dropbox').bind 'dragenter', (event) ->
        event.preventDefault()
    $('#file_dropbox').bind 'dragover', (event) ->
        event.preventDefault()

# Send an avatar delete signal
delete_avatar = () ->
    thumb = $('#avatar_thumbnail')[0]
    $.ajax {
        url: script_root + '_avatar_delete'
        type: 'POST'
        dataType: 'json'
        data:
            delete: 'True'
        success: (data) ->
            if $('img.thumb').is(':visible')
                $('img.thumb').hide 'scale'
                status_notify thumb, 'success'
        error: (data) ->
            status_notify thumb, 'error'
    }

# Handle the drop event
dropbox_drop = (event) =>
    event.preventDefault()
    
    files = event.dataTransfer.files
    file = files[0]
    dropbox = document.getElementById 'file_dropbox'
    thumbnail = document.getElementById 'avatar_thumbnail'
    
    # Generate thumbnail
    image_type = /image.*/
    if !file.type.match image_type
        avatar_alert('The file you want to upload is not an image!')
        return 0
    if file.size > @max_image_size
        avatar_alert('The file you want to upload is too large')
        return 0

    
    img = document.createElement 'img'
    $(img).attr 'class', 'thumb'
    $(img).hide()
    img.file = file

    # Remove old junk
    if thumbnail.children.length > 0
        thumbnail.removeChild thumbnail.children[0]
    thumbnail.appendChild img

    reader = new FileReader()
    reader.onload = ((aImg) -> (e) -> aImg.src = e.target.result; ($(aImg).delay 200).show 'scale')(img)
    reader.readAsDataURL file

    send_file files

# An alerter
avatar_alert = (message) ->
    alert = document.createElement 'div'
    $(alert).attr 'class', 'alert'
    close_button = document.createElement 'button'
    $(close_button).attr 'class', 'close'
    $(close_button).attr 'data-dismiss', 'alert'
    $(close_button).text 'x'
    message_wrapper = document.createElement 'div'
    $(message_wrapper).text message

    alert.appendChild close_button
    alert.appendChild message_wrapper
    $('#avatar_alert')[0].appendChild alert

# File sender
send_file = (files) ->
    # Generate thumbnail
    image_type = /image.*/
    if !files[0].type.match image_type
        avatar_alert('The file you want to upload is not an image!')
        return 0
    
    if files[0].size > @max_image_size
        avatar_alert('The file you want to upload is too large')
        return 0

    # We are only interested in the first file - why would anyone want multiple avatars?:D
    fd = new FormData()
    fd.append 'avatar', files[0]
    thumb = $('#avatar_thumbnail')[0]

    # Send the file to the server
    $.ajax {
        url: script_root + '_avatar_save'
        type: 'POST'
        processData: false
        contentType: false
        data: fd
        success: (data) ->
            status_notify thumb, 'success'
        error: (data) ->
            status_notify thumb, 'error'
            $('img.thumb').hide 'scale'
    }

# Saves the colour on the server
save_colour = (what) ->
    colour_id = $(what).attr 'data-id'

    $.ajax {
        url: script_root + '/_colour_save'
        type: 'POST'
        dataType: 'json'
        data:
            colour: colour_id
        success: (data) ->
            if data.result != 1
                status_notify what, 'error'
                rollback_colour_change()
            else
                status_notify what, 'success'
                current_colour = colour_id
        error: () ->
            status_notify what, 'error'
            rollback_colour_change()
            }

# Colours sorter
sort_colours = () ->
   low = 0
   high = colours.length-1
   pivot = 0

   stack = new Stack()
   stack.push (new Pair 0, -1)

   while !stack.is_empty()
       while low <= high
           pivot = partition low, high
           stack.push (new Pair pivot+1, high)
           high = pivot-1
       edges = stack.pop()
       low = edges.first; high = edges.second

partition = (low, high) ->
    if low == high
        return low

    pivot = parseInt Math.floor Math.random()*(high-low+1) + low
    left = new Array()
    right = new Array()
    out = new Array @colours.length

    for i in [low..high]
        if i != pivot
            if (score_colour @colours[i]['colour'], @colours[pivot]['colour'])
                left.push @colours[i]
            else
                right.push @colours[i]

    left.push @colours[pivot]
    ret = left.length-1+low

    for i in [0...right.length]
        left.push right[i]
    for i in [0...@colours.length]
        if i < low || i > high
            out[i]=@colours[i]
        else
            out[i]=left[i-low]

    @colours = out
    return ret

# Check if a colour is bigger than a vertex
score_colour = (colour, vertex) ->
    [hue1, sat1, val1] = rgb2hsv colour
    [hue2, sat2, val2] = rgb2hsv vertex

    if hue1 < hue2
        return true
    else
        if hue2 < hue1
            return false
        if sat1 < sat2
            return true
        else
            if sat2 < sat1
                return false
            if val1 < val2
                return true
            return false

# A pair
class Pair
    constructor: (@first, @second) ->

    first: ->
        return @first
    second: ->
        return @second

# A stack
class Stack
    constructor: ->
        @stack = []
    push: (element) ->
        @stack.push element
    pop: ->
        if @stack.length > 0
            ret = @stack[@stack.length-1]
            @stack.splice(-1, 1)
            return ret
        else
            return -1
    is_empty: ->
        if @stack.length > 0
            return 0
        return 1

update_progress = (event) ->
    if event.lengthComputable
        percent = event.loaded/event.total
        console.log percent + '%'
    else
        console.log 'error computing length'

# Moves the selector back in case there was an error communicating
rollback_colour_change = () ->
    colour = $(".colour_body[data-id='#{current_colour}']")[0]
    offset_left = colour.offsetLeft
    offset_top = colour.offsetTop
    color = return_opposite $(colour).css 'background-color'
    offset_left -= 5; offset_top -= 5
            
    $('.selection_marker').stop().animate {top: offset_top, left: offset_left, 'background-color': color}, 250

# A standard bootstrap function
bootstrap = () ->
    setup_structure()

$(document).ready () ->
    bootstrap()
