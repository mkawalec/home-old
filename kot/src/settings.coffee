@max_image_size = 1024*1024*10


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
    $(avatar).attr 'class', 'span4 avatar_selector'

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
    $(delete_button).attr 'class', 'btn btn-danger btn-small'
    $(delete_button).attr 'id', 'delete_button'
    $(delete_button).text 'Delete'
    
    send_button = document.createElement 'button'
    $(send_button).attr 'class', 'btn btn-primary btn-small'
    $(send_button).attr 'id', 'send_button'
    $(send_button).text 'New file'

    avatar_body.appendChild avatar_alert
    avatar_body.appendChild file_input
    avatar_body.appendChild avatar_thumbnail
    avatar_body.appendChild delete_button
    avatar_body.appendChild send_button
    avatar_body.appendChild file_dropbox

    avatar.appendChild avatar_header
    avatar.appendChild avatar_body
    holder.appendChild avatar

    #### Misc settings ####
    misc = document.createElement 'div'
    $(misc).attr 'class', 'span3 misc_settings'

    misc_header = document.createElement 'div'
    $(misc_header).attr 'class', 'header'
    $(misc_header).text 'Various settings:'
    misc.appendChild misc_header

    # Avatar alerts holder
    misc_alert = document.createElement 'div'
    $(misc_alert).attr 'id', 'misc_alert'

    # File quota
    file_quota = document.createElement 'div'
    $(file_quota).attr 'class', 'file_quota setting'

    file_quota_header = document.createElement 'div'
    $(file_quota_header).attr 'class', 'setting_header file_quota_header'
    $(file_quota_header).text 'Your disk quota usage:'
    file_quota.appendChild file_quota_header

    progress_bar = document.createElement 'div'
    $(progress_bar).attr 'class', 'progress'
    $(progress_bar).attr 'id', 'file_quota_progress'
    bar = document.createElement 'div'
    $(bar).attr 'class', 'bar'
    $(bar).attr 'style', 'width:0%;'
    progress_bar.appendChild bar

    percent_disp = document.createElement 'div'
    $(percent_disp).attr 'class', 'percent_display'
    $(percent_disp).text '%'
    progress_bar.appendChild percent_disp

    file_quota.appendChild progress_bar

    # Email change
    email_change = document.createElement 'div'
    $(email_change).attr 'class', 'email_change setting'

    email_change_header = document.createElement 'div'
    $(email_change_header).attr 'class', 'setting_header email_change_header'
    $(email_change_header).text 'Change your email:'

    email1 = document.createElement 'input'
    $(email1).attr 'type', 'text'
    $(email1).attr 'class', 'setting_input input-medium'
    $(email1).attr 'placeholder', 'New email'
    $(email1).attr 'data-field-id', 'email1'
    $(email1).bind 'focus', (event) ->
        $(this).bind 'keydown', (event) ->
            if event.which == 13
                event.preventDefault()
                $('#email_submit_button')[0].click()

    $(email1).bind 'blur', (event) ->
        $(this).unbind 'keydown'

    email2 = document.createElement 'input'
    $(email2).attr 'type', 'text'
    $(email2).attr 'class', 'setting_input input-medium'
    $(email2).attr 'placeholder', 'New email again'
    $(email2).attr 'data-field-id', 'email2'
    $(email2).bind 'focus', (event) ->
        $(this).bind 'keydown', (event) ->
            if event.which == 13
                event.preventDefault()
                $('#email_submit_button')[0].click()

    $(email2).bind 'blur', (event) ->
        $(this).unbind 'keydown'

    email_submit_button = document.createElement 'button'
    $(email_submit_button).attr 'class', 'btn btn-small btn-primary'
    $(email_submit_button).attr 'id', 'email_submit_button'
    $(email_submit_button).text 'Change'
    
    email_change.appendChild email_change_header
    email_change.appendChild email1
    email_change.appendChild email2
    email_change.appendChild email_submit_button
    
    # Password change
    password_change = document.createElement 'div'
    $(password_change).attr 'class', 'password_change setting'

    password_change_header = document.createElement 'div'
    $(password_change_header).attr 'class', 'setting_header password_change_header'
    $(password_change_header).text 'Change your password:'

    password0 = document.createElement 'input'
    $(password0).attr 'type', 'password'
    $(password0).attr 'class', 'setting_input input-medium'
    $(password0).attr 'placeholder', 'Old password'
    $(password0).attr 'data-field-id', 'password0'
    $(password0).bind 'focus', (event) ->
        $(this).bind 'keydown', (event) ->
            if event.which == 13
                event.preventDefault()
                $('#password_submit_button')[0].click()

    $(password0).bind 'blur', (event) ->
        $(this).unbind 'keydown'

    password1 = document.createElement 'input'
    $(password1).attr 'type', 'password'
    $(password1).attr 'class', 'setting_input input-medium'
    $(password1).attr 'placeholder', 'New password'
    $(password1).attr 'data-field-id', 'password1'
    $(password1).bind 'focus', (event) ->
        $(this).bind 'keyup', (event) ->
            if event.which == 13
                event.preventDefault()
                $('#password_submit_button')[0].click()
            else
                show_pass_strength()

    $(password1).bind 'blur', (event) ->
        $(this).unbind 'keyup'

    password2 = document.createElement 'input'
    $(password2).attr 'type', 'password'
    $(password2).attr 'class', 'setting_input input-medium'
    $(password2).attr 'placeholder', 'New password again'
    $(password2).attr 'data-field-id', 'password2'
    $(password2).bind 'focus', (event) ->
        $(this).bind 'keydown', (event) ->
            if event.which == 13
                event.preventDefault()
                $('#password_submit_button')[0].click()

    $(password2).bind 'blur', (event) ->
        $(this).unbind 'keydown'

    pass_submit_button = document.createElement 'button'
    $(pass_submit_button).attr 'class', 'btn btn-small btn-primary'
    $(pass_submit_button).attr 'id', 'password_submit_button'
    $(pass_submit_button).text 'Change'

    pass_strength = document.createElement 'div'
    $(pass_strength).attr 'id', 'pass_strength'
    
    password_change.appendChild password_change_header
    password_change.appendChild password0
    password_change.appendChild password1
    password_change.appendChild password2
    password_change.appendChild pass_submit_button
    password_change.appendChild pass_strength

    misc.appendChild misc_alert
    misc.appendChild file_quota
    misc.appendChild email_change
    misc.appendChild password_change
    holder.appendChild misc
    $(email_submit_button).bind 'click', () ->
        submit_email(this)
    $(pass_submit_button).bind 'click', () ->
        submit_pass(this)


    #### User files ####
    files = document.createElement 'div'
    $(files).attr 'class', 'span12 user_files'

    files_header = document.createElement 'div'
    $(files_header).attr 'class', 'header'
    $(files_header).text 'Your files:'
    files.appendChild files_header

    files_table = document.createElement 'table'
    $(files_table).attr 'class', 'table files_table table-striped table-condensed'
    $(files_table).attr 'caption', 'A table listing all your files'

    table_header = document.createElement 'thead'
    $(table_header).html '<tr><td>File name</td><td>Mime type</td><td>Size</td><td>Event name</td><td>Event date</td><td>Get file</td><td>Delete file</td></tr>'

    table_body = document.createElement 'tbody'
    $(table_body).attr 'class', 'files_table_body'
    files_table.appendChild table_header
    files_table.appendChild table_body
    files.appendChild files_table

    holder.appendChild files

    #### General bookkeeping ####
    request_avatar()
    mark_selected()
    bind_events()
    populate_with_files()
    get_quota_usage()
    return 0

# Notifies the user about her password strength
show_pass_strength = ->
    password1 = $('[data-field-id=password1]')[0]
    entropy = calculate_entropy password1.value

    pass_strength = $('#pass_strength')
    $(pass_strength).text "It would take #{nicefy(Math.pow(2,entropy-32))} on one standard PC to break your password"


# Submits new password to the server, assuming that it passes some constraints
submit_pass = (submit_button) ->
    password0 = $('[data-field-id=password0]')[0]
    password1 = $('[data-field-id=password1]')[0]
    password2 = $('[data-field-id=password2]')[0]
    
    if $.trim(password1.value) != $.trim(password2.value)
        misc_alert("The two passwords aren't the same")
        return 0

    # Not validating the password now, TODO
    
    $(submit_button).text 'Changing...'
    $.ajax {
        url: script_root + '/_change_password'
        type: 'POST'
        dataType: 'json'
        data:
            new_pass: $.trim(password1.value)
            old_pass: $.trim(password0.value)
        success: (data) ->
            submit_button = $("#password_submit_button")[0]
            $(submit_button).text 'Change'
            password_change = $('div.password_change.setting')[0]
            
            if data.different_pass
                status_notify password_change, 'error'
                misc_alert("The old password is incorrect")
                return -1

            status_notify password_change, 'success'

            $('[data-field-id=password0]')[0].value = ''
            $('[data-field-id=password1]')[0].value = ''
            $('[data-field-id=password2]')[0].value = ''
        error: (data) ->
            $(submit_button).text 'Change'
            
            password_change = $('div.password_change.setting')[0]
            status_notify password_change, 'error'
    }

# Submits new email to the server, assuming that it passes some constraints
submit_email = (submit_button) ->
    email1 = $('[data-field-id=email1]')[0]
    email2 = $('[data-field-id=email2]')[0]
    
    if $.trim(email1.value) != $.trim(email2.value)
        misc_alert("The two emails aren't the same")
        return 0

    # Not validating the email now, TODO
    
    $(submit_button).text 'Changing...'
    $.ajax {
        url: script_root + '_change_email'
        type: 'POST'
        dataType: 'json'
        data:
            new_email: $.trim(email1.value)
        success: (data) ->
            submit_button = $("#email_submit_button")[0]
            $(submit_button).text 'Change'
            
            email_change = $('div.email_change.setting')[0]
            status_notify email_change, 'success'

            $('[data-field-id=email2]')[0].value = ''
        error: (data) ->
            console.log 'blah'
            $(submit_button).text 'Change'
            
            email_change = $('div.email_change.setting')[0]
            status_notify email_change, 'error'
    }


# Gets the quota usage from the server and sets the progress bar
get_quota_usage = ->
    $.ajax {
        url: script_root + '_get_quota'
        type: 'GET'
        dataType: 'json'
        success: (data) ->
            progress_bar = $('#file_quota_progress div.bar')[0]
            percent_disp = $('#file_quota_progress div.percent_display')[0]
            progress = data.used/data.quota*100
            if typeof progress != Number
                $(percent_disp).text '0%'
            else
                $(percent_disp).text "#{Math.round(progress)}%"
                $(progress_bar).animate({width: "#{progress}%"})

        error: (data) ->
            console.log 'blah'
    }


# Populates the filelist with user's files
populate_with_files = ->
    for file in files
        table_body = $('.files_table_body')[0]
        table_row = document.createElement 'tr'
        $(table_row).attr 'data-id', file.id

        file_name = document.createElement 'td'
        $(file_name).text file.filename

        file_mimetype = document.createElement 'td'
        $(file_mimetype).text file.mimetype

        file_size = document.createElement 'td'
        $(file_size).text get_nice_size file.size

        event_name = document.createElement 'td'
        $(event_name).text file.event_name

        event_date = document.createElement 'td'
        $(event_date).text file.event_date.format_nicely()

        get_button_wrapper = document.createElement 'td'
        get_button = document.createElement 'button'
        $(get_button).attr 'class', 'btn btn-success btn-small'
        $(get_button).attr 'data-id', file.id
        $(get_button).text 'Get this file!'
        $(get_button).bind 'click', (event) ->
            get_file $(this).attr('data-id')

        get_button_wrapper.appendChild get_button

        delete_button_wrapper = document.createElement 'td'
        delete_button = document.createElement 'button'
        $(delete_button).attr 'class', 'btn btn-danger btn-small'
        $(delete_button).attr 'data-id', file.id
        $(delete_button).text 'Remove this file'
        $(delete_button).bind 'click', (event) ->
            delete_file $(this).attr('data-id')
        delete_button_wrapper.appendChild delete_button

        table_row.appendChild file_name
        table_row.appendChild file_mimetype
        table_row.appendChild file_size
        table_row.appendChild event_name
        table_row.appendChild event_date
        table_row.appendChild get_button_wrapper
        table_row.appendChild delete_button_wrapper

        table_body.appendChild table_row


# Gets a file with a specified id
get_file = (file_id) ->
    frame = document.createElement 'iframe'
    $(frame).attr 'width', 1
    $(frame).attr 'height', 1
    $(frame).attr 'frameborder', 0
    $(frame).attr 'src', "#{script_root}/get_file/#{file_id}"
    $('body')[0].appendChild frame


# Deletes a file with a specified id 
delete_file = (file_id) ->
    $.ajax {
        url: "#{script_root}/_delete_file/#{file_id}"
        type: 'DELETE'
        dataType: 'json'
        success: (data) ->
            table_row = $("tr[data-id=#{data.file_id}]")[0]
            $(table_row).hide 'highlight', ()->
                table_body = $('.files_table_body')[0]
                table_body.removeChild this

                get_quota_usage()
        error: (data) ->
            console.log 'oh snap'
                
    }

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
    $(alert).hide()
    $('#avatar_alert')[0].appendChild alert
    $(alert).show 'shake', 'fast'

misc_alert = (message) ->
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
    $(alert).hide()
    $('#misc_alert')[0].appendChild alert
    $(alert).show 'shake', 'fast'

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
