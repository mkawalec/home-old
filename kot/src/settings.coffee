# Setup the structure
setup_structure = () ->
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
    $(avatar).attr 'class', 'span4 avatar_selector'

    avatar_header = document.createElement 'div'
    $(avatar_header).attr 'class', 'header'
    $(avatar_header).text 'Your avatar:'

    avatar_body = document.createElement 'div'
    $(avatar_body).attr 'class', 'body'


    file_input = document.createElement 'input'
    $(file_input).attr 'type', 'file'
    $(file_input).attr 'id', 'file_input'
    
    send_button = document.createElement 'button'
    $(send_button).attr 'class', 'btn btn-primary'
    $(send_button).attr 'id', 'send_avatar'
    $(send_button).text 'Send'
    avatar_body.appendChild file_input
    avatar_body.appendChild send_button

    avatar.appendChild avatar_header
    avatar.appendChild avatar_body
    holder.appendChild avatar
   
    #### General bookkeeping ####
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

# Bind the events (when one clicks on the colour block)
bind_events = () ->
    $('#send_avatar').bind 'click', (event) ->
        console.log 'sending'
        send_file()

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

# File sender
send_file = () ->
    console.log $('#file_input')[0].value 

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
