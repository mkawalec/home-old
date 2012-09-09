###
Copyright Michal Kawalec, 2012
###

@pile_height = 250
window.lastpress = 0

# Adds the members to each of the piles
setup_pile_members = () ->
    for pile in piles
        pile_div = $("[data-id=#{pile.id}]")[0]
        pile_members =  document.getElementById 'container'
        [pile_left, pile_top] = get_offsets pile_div
        [holder_left, holder_top] = get_offsets document.getElementById 'pile_holder'

        for member in pile.members
            pile_member = document.createElement 'div'
            $(pile_member).attr 'class', 'pile_member'
            
            # Compute the position of each of pile members
            left = parseInt(pile_left) + parseInt(@pile_width*member.x)
            top = parseInt(pile_top) + parseInt(@pile_height*member.y)

            # And set the position
            $(pile_member).attr 'style', 'left:' + left + 'px;top:' + top + 'px;'
            $(pile_member).text member.member
            $(pile_member).attr 'data-id', member.member
            pile_members.appendChild pile_member
            console.log $(pile_member).attr 'style'

            # Now get the member background image from the server
            get_user_style member.member
    
    # Make each of the pile_members draggable
    $('.pile_member').draggable {
        start: () ->
            create_delete()
        drag: () ->
            dragging(this)
        stop: (e, ui) ->
            remove_delete()
            drag_stopped(e, ui, this)
        containment: "parent"
    }

# Gets user picture and colours from the server
get_user_style = (id) ->
    $.ajax {
        url: script_root + '_pile_get'
        type: 'POST'
        dataType: 'json'
        data:
            id: id
        success: (data) ->
            pile_member = $("[data-id=#{data.id}].pile_member")[0]
            if data.status
                img = document.createElement 'img'
                $(img).attr 'class', 'thumb'
                img.src = 'data:'+data.mimetype+';base64,'+data.file
                pile_member.appendChild img

            console.log pile_member
            style = $(pile_member).attr 'style'
            $(pile_member).attr 'style', style+'background-color:'+data.colour+
                                         ';border-color:'+data.border
        error: (data) ->
            status_notify pile_member, 'error'
    }


# Creates a 'virtual pile' used for dropping users there and deleting 
# them from our piles
# On a second thought, the delete area should be added to each of the
# piles
# This way it is easier for all of us to manage
#
# The stop()s everywhere give a protection against quick drag time
create_delete = () ->
    $('.pile').each (iter, obj) ->
        if obj.children.length == 2
            delete_area = document.createElement 'div'
            $(delete_area).attr 'class', 'delete_area'
            $(delete_area).text 'Delete'
            obj.appendChild delete_area

        height = obj.offsetHeight
        holder_height = (document.getElementById 'pile_holder').offsetHeight

        $(obj.children[1]).stop().animate {top: '100px'}
        $(obj).stop().animate {height: (height+98) + 'px'}, () ->
            $(obj.children[2]).stop().animate {opacity: 1}

# And remove the delete pile
remove_delete = () ->
    $('.pile').each (iter, obj) ->
        height = obj.offsetHeight
        holder_height = (document.getElementById 'pile_holder').offsetHeight

        $(obj.children[2]).stop().animate {opacity: 0}, () ->
            $(obj.children[1]).stop().animate {top: '0'}
            $(obj).stop().animate {height: (height-102) + 'px'}

# Sets the structure up 
# and populates it with the piles holders
setup_structure = () ->
    # Get the outer wrapper and create the inner wrapper
    holder = $('.container')
    pile_holder = document.createElement 'div'

    # Make the pile_holder recognizable from the outside
    $(pile_holder).attr 'id', 'pile_holder'
    # Add it to the outer holder
    holder.append pile_holder
    holder_width = pile_holder.offsetWidth
    [holder_left, holder_top] = get_offsets pile_holder

    for pile in piles
        # Get the desired width/height of the pile
        @pile_width = holder_width/piles.length - 10*piles.length

        # Create the pile 
        pile_div = document.createElement 'div'
        $(pile_div).attr 'class', 'pile'
        $(pile_div).attr 'data-id', pile.id
        $(pile_div).attr 'style', 'width:' + @pile_width + 'px;'

         # Create the title on the bottom
        pile_title = document.createElement 'div'
        $(pile_title).attr 'class', 'pile_title'
        $(pile_title).text pile.name

        # Create a placeholder for catching pile members
        pile_members = document.createElement 'div'
        $(pile_members).attr 'class', 'pile_members'

        pile_div.appendChild pile_members
        pile_div.appendChild pile_title
        pile_holder.appendChild pile_div
    
    setup_pile_members()

# Creates the search bar on the right
setup_search = () ->
    search_area = document.createElement 'div'
    $(search_area).attr 'id', 'search_area'

    search_bar = document.createElement 'div'
    $(search_bar).attr 'id', 'search_bar'
    search_field = document.createElement 'input'
    $(search_field).attr 'id', 'search_field'
    search_bar.appendChild search_field

    search_results = document.createElement 'div'
    $(search_results).attr 'id', 'search_results'

    search_area.appendChild search_bar
    search_area.appendChild search_results

    (document.getElementById 'container').appendChild search_area
    bind_search_area()

# Bind the 'search for users' event to the search field
bind_search_area = () ->
    poll_keypress()
    $('#search_field').bind 'keyup', (event) ->
        date = new Date()
        window.lastpress = date.getTime()

window.poll_keypress = () ->
    date = new Date()
    if 500 < (date.getTime() - window.lastpress) < 1001
        $.ajax {
            url: script_root + '/_get_users'
            type: 'GET'
            dataType: 'json'
            data:
                query: '%'+$('#search_field')[0].value+'%'
            success: (data) ->
                set_searched_users(data)
        }
    setTimeout("window.poll_keypress()", 500)

# Populate the users field with users
set_searched_users = (data) ->
    # search_results contains all of the metadata about the user
    # ie. name, description, etc.
    search_results = document.getElementById 'search_results'
    # container holds the movable user avatar
    container = document.getElementById 'container'

    # Remove the old crap - vaccum process
    while search_results.children.length > 0
        search_results.removeChild search_results.children[0]
    children_to_remove = []
    for i in [container.children.length-1..0]
        child = container.children[i]
        if ($(child).attr 'data-search')?
            container.removeChild child
    
    for user in data.result
        user_holder = document.createElement 'div'
        $(user_holder).attr 'class', 'user_holder'

        pile_name = document.createElement 'div'
        $(pile_name).attr 'class', 'pile_name'
        $(pile_name).text user.uname

        user_holder.appendChild pile_name
        search_results.appendChild user_holder
       
        # We don't need to add a user to the pile if 
        # the user is already in the pile
        if not user.in_pile
            pile_member = document.createElement 'div'
            $(pile_member).attr 'class', 'pile_member'
            $(pile_member).attr 'data-id', user.id
            $(pile_member).text user.id

            get_user_style user.id

            # Setting the proper absolute position
            [holder_left, holder_top] = get_offsets user_holder
            holder_top += 4; holder_left += 5
            $(pile_member).attr 'style', "top:#{holder_top}px;left:#{holder_left}px;"

            # This attribute marks the person avatar for clearing next time
            # the function is ran
            $(pile_member).attr 'data-search', true
            container.appendChild pile_member

    # Make each of the pile_members draggable
    $(".pile_member[data-search='true']").draggable {
        start: () ->
            create_delete()
        drag: () ->
            dragging(this)
        stop: (e, ui) ->
            remove_delete()
            drag_stopped(e, ui, this)
        containment: "parent"
    }


# Check if our element is over the delete field - 
# if it is, change the colour of the field slightly,
# if it is not, change the colour back again
dragging = (obj) ->
    over = over_selector obj, '.delete_area'
    over_pile = over_selector obj, '.pile_members'
    if over
        if (($(over).attr 'class').indexOf 'over') == -1
            $(over).addClass 'over'
            $(over).stop().animate {'background-color': '#FFBBBB'}
    else if over_pile
        del_area = over_pile.offsetParent.children[2]
        if (($(del_area).attr 'class').indexOf 'over') != -1
            $(del_area).removeClass 'over'
            $(del_area).stop().animate {'background-color': '#EE9999'}
    
    return 0

# Syncs the new pile_member position with server
# Accepts an event and an ui-object as parameters
drag_stopped = (e, ui, obj) ->
    if over_selector obj, '.delete_area'
        json_sync_piles ($(obj).attr 'data-id'), -1
    else if over_selector obj, '.pile'
        over = over_selector(obj, '.pile')
        json_sync_piles ($(obj).attr 'data-id'), $(over).attr 'data-id'
    return 0

# Sync with the server
json_sync_piles = (object_id, over_id) ->
    object = $('.pile_member[data-id='+object_id+']')[0]

    if over_id != -1
        over = $('.pile[data-id='+over_id+']')[0]
        [over_left, over_top] = get_offsets over
        [object_left, object_top] = get_offsets object
        left = (object_left-over_left)/over.offsetWidth
        top = (object_top-over_top)/@pile_height
    
    # Remove the 'data-search' attribute - this way it will not be
    # cleared by the vacuum process
    $(object).removeAttr 'data-search'

    $.ajax {
       url: script_root + '/_piles_save'
       type: 'POST'
       dataType: 'json'
       data:
           member: object_id
           pile_num: if over_id != -1 then over_id else -1
           x: if over_id != -1 then left else -1
           y: if over_id != -1 then top else -1
       success: (data) ->
           if over_id == -1 and data.result == 1
               remove_object object_id
           else if over_id == -1
               status_notify object, 'error'
           status_notify object, 'success'
       error: () ->
           status_notify object, 'error'
    }


# The object was succesfully removed so delete it from the view
remove_object = (object_id) ->
    object = $('.pile_member[data-id='+object_id+']')[0]
    $(object).hide "explode", 1000
    return 1

# Check if and element is over one of the elements defined by a selector
over_selector = (element, selector) ->
    array_length = $(selector).length
    over_object = false
    $(selector).each (iter, obj) =>
        [offset_left, offset_top] = get_offsets obj
        x1 = offset_left; y1 = offset_top + obj.offsetHeight
        x2 = offset_left + obj.offsetWidth; y2 = offset_top
        
        [element_left, element_top] = get_offsets element

        if x1 < element_left < x2 and y1 > element_top > y2
            over_object = obj
            return false
    return over_object

globals = (name for name of window)[0..10]
test = if 2 isnt 3 then 11 else 22

# A standard bootstrap function
# Runs all what is needed for setting up
# the environment
bootstrap = () ->
    setup_structure()
    setup_search()
    return 0


$(document).ready ->
    bootstrap()

