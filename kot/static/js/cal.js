/* Copyright Michal Kawalec, 2012
 * Depends on jquery & jquery-ui
 */

"use strict";

// Some debug helpers
var debug = {
    debug : true,
    marker_length: 7,
    previous_caller: "",

    log : function(what, caller) {
        if(this.debug){
            if(this.previous_caller != caller){
                var marker = "";
                for(var i = 0; i < this.marker_length; i++) marker += '-';
                console.log(marker + caller + marker);
                this.previous_caller = caller;    
            }
            console.log(what);
        }
    }
}


var calendar = {  
    current_date        : new Date(),
    double_click_timeout: 500,
    uid                 : '1',
    uname               : 'michal',
    prevent             : [],
    prev_prevent        : [],
    
    // event = {
    // 'date': date,
    // 'location': 'location',
    // 'duration': number of minutes,
    // 'name': text,
    // 'description': text,
    // 'attendees': [(id,name),...],
    // 'owner': (id,name),
    // 'max_attendees': int,
    // 'joinable': boolean
    // }
    
    helpers : {

        // Gets the current width of the scrollbar
        // Quite an ingenious idea
        getScrollBarWidth: function() {
            var inner = document.createElement('p');
            inner.style.width = "100%";
            inner.style.height = "200px";

            var outer = document.createElement('div');
            outer.style.position = "absolute";
            outer.style.top = "0px";
            outer.style.left = "0px";
            outer.style.visibility = "hidden";
            outer.style.width = "200px";
            outer.style.height = "150px";
            outer.style.overflow = "hidden";
            outer.appendChild (inner);

            document.body.appendChild (outer);
            var w1 = inner.offsetWidth;
            outer.style.overflow = 'scroll';
            var w2 = inner.offsetWidth;
            if (w1 == w2) w2 = outer.clientWidth;

            document.body.removeChild (outer);

            return (w1 - w2);
        },

        // Cleans everything from calendar display
        // Useful for redrawing the calendar
        clean_cal_disp: function(){
            var calendar_display = document.getElementById('calendar_display');
            while(calendar_display.children.length){
                calendar_display.removeChild(calendar_display.children[0]);
            }
        },


        /* This function gets the number of days in the current
         * month. It does it by iterating through a date object.
         * This way, we have the javascript do the tricky 
         * date-figuring bit for us :D
         */
        get_number_of_days: function(which_month, which_year){
            // The lowest number of days in a month is 28, so we will 
            // start the search at this number
            var ret = 27;
            var date = new Date();
            date.setMonth(which_month);
            date.setFullYear(which_year);

            while(which_month == date.getMonth()){
                ret++;
                date.setDate(ret);
            }
            return --ret;
        },

        // Creates a primary grid for the calendar display
        create_structure: function(){
            // Holds some kind of a status box - yet to be defined
            var status_box      = document.createElement('div');
            $(status_box).attr('id', 'status_box');

            // Holds the buttons for changing the viewing type (day/week/month)
            var buttons_holder  = document.createElement('div');
            $(buttons_holder).attr('id', 'buttons_holder');

            // Create the button group
            var button_group    = document.createElement('div');
            $(button_group).attr('id', 'mwd_button_group');
            $(button_group).attr('class', 'btn-group');
            $(button_group).attr('data-toggle', 'buttons-radio');

            // Create the buttons in the group
            var button_day      = document.createElement('button');
            $(button_day).attr('id', 'button_day');
            $(button_day).attr('class', 'btn');
            $(button_day).text('Day');
            var button_month    = document.createElement('button');
            $(button_month).attr('id', 'button_month');
            $(button_month).attr('class', 'btn');
            $(button_month).text('Month');

            // Append the buttons to the group
            button_group.appendChild(button_day);
            button_group.appendChild(button_month);
            // And the group to the div
            buttons_holder.appendChild(button_group); 


            // Create another button group for next/previous
            var button_group_np = document.createElement('div');
            $(button_group_np).attr('class', 'btn-group');

            var button_next     = document.createElement('button');
            $(button_next).attr('id', 'button_next');
            $(button_next).attr('class', 'btn');
            $(button_next).text('>');

            var button_prev     = document.createElement('button');
            $(button_prev).attr('id', 'button_prev');
            $(button_prev).attr('class', 'btn');
            $(button_prev).text('<');

            button_group_np.appendChild(button_prev);
            button_group_np.appendChild(button_next);
            buttons_holder.appendChild(button_group_np);

            // The placeholder for the actual calendar
            var calendar_display= document.createElement('div');
            $(calendar_display).attr('id', 'calendar_display');

            // Add it all to the page
            var calendar_holder = document.getElementById('calendar_holder');
            calendar_holder.appendChild(status_box);
            calendar_holder.appendChild(buttons_holder);
            calendar_holder.appendChild(calendar_display);

            // Sort the events
            this.sort_events();
        },

        // Focuses the view on the 'now'
        focus_on_now: function(){
            // Determine the holder for the line of now
            var tmp_date        = new Date();
            var line_holder     = document.getElementById('hour_row_' + tmp_date.getHours());
            var calendar_display= document.getElementById('calendar_display');
            calendar_display.scrollTop = line_holder.offsetTop-100;
        },

        // A more general version of helpers.focus_on_now()
        // This one focuses at a given hour
        focus_on_hour: function(hour){
            // Determine the holder for the line of now
            var hour_holder     = document.getElementById('hour_row_' + hour);
            var calendar_display= document.getElementById('calendar_display');
            calendar_display.scrollTop = hour_holder.offsetTop-100;
        },

        // Overlap checker
        // Note that it is absolutely critical for the usfulness of data
        // returned by this function for the events object NOT to change 
        // immidiately before and during invocation of this function.
        check_overlap: function(date, duration, index){
            var ret = [0, 0];
            for(var i in events){
                // Check if these events are on the same day
                if(events[i]['date'].getFullYear() == date.getFullYear() &&
                   events[i]['date'].getMonth() == date.getMonth() &&
                   events[i]['date'].getDate() == date.getDate() && i!=index){
                       // If so, check if they can overlap
                       var f_start, f_end, s_start, s_end;
                       f_start   = date.getTime();
                       f_end     = f_start + 60*1000*duration;
                       s_start   = events[i]['date'].getTime();
                       s_end     = s_start + events[i]['duration']*60*1000;
                       
                       // First, check the 'before in time' scenario
                       if((f_start < s_end && f_end < s_end && f_end > s_start)||
                          (f_start < s_start && f_end > s_end) ||
                          (f_start == s_start && f_end < s_end) ||
                          (f_start > s_start && f_end == s_end) ||
                          (f_start == s_start && f_end == s_end)) {
                              if(index < i)
                                  ret[0]++;
                              else 
                                  ret[1]++;
                       }
                       // Now the case with the first and second interchanged
                       else if((s_start < f_end && s_end < f_end && s_end > f_start)||
                          (s_start < f_start && s_end > f_end) ||
                          (s_start == f_start && s_end < f_end) ||
                          (s_start > f_start && s_end == f_end)){
                              if(index < i)
                                  ret[0]++;
                              else 
                                  ret[1]++;
                       }
                }
                       
            }
            return ret;
        },

        // Sorts events by time
        // Using binary search for searching for insertion place in ret[]
        // one can have this function work in nlogn :D
        sort_events : function(){
            var ret = [];
            for(var i = 0; i < events.length; i++){
                if(i==0)
                    ret.push(events[0]);
                else {
                    for(var j = 0; j < ret.length; j++){
                        if(ret[j]['date'].getTime() > events[i]['date'].getTime()){
                            ret.splice(j, 0, events[i]);
                            break;
                        }
                        if(j == ret.length-1){
                            ret.push(events[i]);
                            break;
                        }
                    }
                }
            }
            events = ret;
        },

        // Makes an async request to the server and saves event details
        json_event_save: function(event_id){
            $.ajax({
                url: script_root + '/_event_save',
                type: 'POST',
                dataType: 'json',
                data: {
                    id: events[event_id]['id'],
                    name: events[event_id]['name'],
                    location: events[event_id]['location'],
                    description: events[event_id]['description'],
                    date: events[event_id]['date'].toISOString(),
                    duration: events[event_id]['duration']
                },
                success: function(data){
                }
            });
        },

        // Corrects the datetime for the timezone.
        // It is a rather stupid function, as it will break
        // times near the time change boundary (ie. summer time).
        // But I just want a hack now
        correct_timezone: function() {
            var temp = new Date();
            var offset = temp.getTimezoneOffset();
            for(var i in events){
                events[i]['date'].setMinutes(events[i]['date'].getMinutes()-offset);
            }
        }
    },

    // TODO Make the calendar automatically resizable
    // TODO Put everything in its own namespace
    // TODO Choose and apropriately mark private functions

    // Creates a monthly view of the calendar
    draw_month: function() {
        this.helpers.clean_cal_disp();

        // Gets the placeholder in which the month will be drawn
        var calendar_display= document.getElementById('calendar_display');
        $(calendar_display).attr('style', 'overflow:hidden');

        // A temprorary date object for some manipulation
        var temp_date       = new Date();
        var now             = new Date();
        temp_date.setMonth(this.current_date.getMonth());
        temp_date.setFullYear(this.current_date.getFullYear());
        temp_date.setDate(1);

        // Figure out how many days of the previous and 
        // next months need to be drawn
        var previous_days, next_days;
        previous_days       = (temp_date.getDay()+6)%7;

        temp_date.setDate(this.helpers.get_number_of_days(this.current_date.getMonth(),
                    this.current_date.getFullYear()));
        next_days           = 6 - (temp_date.getDay()+6)%7;

        // Number of weeks to draw
        var n_weeks         = 
            Math.ceil((previous_days + next_days + temp_date.getDate())/7);

        // Compute the x and y size of the day
        var day_y = calendar_display.offsetHeight/n_weeks;
        var day_x = calendar_display.offsetWidth/7;

        // Introduced because of the performance concerns inside the for loop
        var days_in_a_month = this.helpers.get_number_of_days(this.current_date.getMonth(),
                this.current_date.getFullYear());

        // Draw the days
        for(var i = -previous_days+1; 
                i < this.helpers.get_number_of_days(this.current_date.getMonth(), 
                    this.current_date.getFullYear())+next_days+1;
                i++){
                    var attrs = {};

                    temp_date.setMonth(this.current_date.getMonth());
                    temp_date.setDate(i);

                    attrs['date']  = temp_date.getDate();
                    attrs['month'] = temp_date.getMonth();
                    attrs['year'] = temp_date.getFullYear();

                    if(i > 0 && i <= days_in_a_month)
                        attrs['active'] = true;
                    else
                        attrs['active'] = false;

                    attrs['day_x'] = day_x;
                    attrs['day_y'] = day_y;

                    // Check if this is 'today'
                    if(this.current_date.getMonth() == temp_date.getMonth() &&
                            this.current_date.getDate() == temp_date.getDate() &&
                            this.current_date.getFullYear() == temp_date.getFullYear())
                        attrs['clicked'] = true;

                    if(now.getMonth() == temp_date.getMonth() &&
                            now.getDate() == temp_date.getDate() &&
                            now.getFullYear() == temp_date.getFullYear())
                        attrs['today'] = true;

                    // The day_x-1 trick takes care of the border being too wide on 
                    // all days but the first one
                    var y   = Math.floor((i+previous_days-1)/7)*(day_y-1);
                    var day = 
                        this.assemble_month_day(((i+previous_days-1)*(day_x-1))%((day_x-1)*7), y, attrs);
                    calendar_display.appendChild(day);

                    // And bind events to the newly created day
                    this.bind_month_day(attrs);
                }

        // Presenting stuff to the user
        this.set_status_box();
        $('#mwd_button_group button').each(function(iter, obj){
            $(obj).removeClass('active');
            if($(obj).attr('id') == 'button_month') $(obj).addClass('active');
        });
        this.draw_events_month();
    },

    // TODO Think about wether draw_month and draw_day should use global variables for choosing which day/month to draw or shouldn't they
    // TODO Standarize the -/_ convention -> probably just use underscores

    // Draws the particular day
    draw_day: function(){
        // Make sure that there is nothing drawn
        this.helpers.clean_cal_disp();

        var calendar_display= document.getElementById('calendar_display');
        $(calendar_display).attr('style', 'overflow-y:scroll');

        // TODO Focus on 'now' time first
        // Create the element that will serve as the placeholder for day's events
        var day_holder      = document.createElement('div');
        var day_holder_width= calendar_display.offsetWidth-this.helpers.getScrollBarWidth()-2;
        $(day_holder).attr('id', 'day_holder');
        $(day_holder).attr('style', 'width:' + 
                day_holder_width + 'px;');

        var hour_row_height = 42;

        // Add the hour rows
        for(var i = 0; i < 24; i++){
            var hour_row    = document.createElement('div');
            $(hour_row).attr('id', 'hour_row_' + i);
            $(hour_row).attr('class', 'hour_row snap_to');
            $(hour_row).attr('style', 'position:absolute;' +
                    'top:' + ((hour_row_height+1)*i) + 'px;left:0;' + 
                    'height:' + hour_row_height + 'px;' +
                    'width:' + day_holder_width + 'px;');

            // Let's add the label
            var hour_row_label = document.createElement('div');
            $(hour_row_label).attr('id', 'hour_row_label_' + i);
            $(hour_row_label).attr('class', 'hour_row_label');
            $(hour_row_label).attr('style', 'height:' + hour_row_height 
                    + 'px;');
            $(hour_row_label).text(i);
            hour_row.appendChild(hour_row_label);

            // And add the half-hour line
            var half_hour_line = document.createElement('div');
            $(half_hour_line).attr('id', 'half_hour_line_' + i);
            $(half_hour_line).attr('class', 'half_hour_line snap_to');
            $(half_hour_line).attr('style', 'height:' + (hour_row_height/2)
                    + 'px;');
            hour_row.appendChild(half_hour_line);

            day_holder.appendChild(hour_row);
        }

        // For performance resons, I will show the day_holder after 
        // all of the rows are added
        calendar_display.appendChild(day_holder);
        this.draw_line_of_now();

        // Check if focusing on 'now' is needed.
        // In other case, just focus on some sane hour
        var temp_date = new Date();
        if(temp_date.getDate() == this.current_date.getDate() &&
                temp_date.getMonth() == this.current_date.getMonth() &&
                temp_date.getFullYear() == this.current_date.getFullYear())
            this.helpers.focus_on_now();
        else this.helpers.focus_on_hour(10);

        // And draw the events
        this.draw_events_day();
        this.bind_new_event_day();
    },

    // TODO Get rid of the day-inactive classes - just stick with the active/nothing bootstrap convention
    // TODO Move more position: and similar to css

    // Draws the line that defines the 'now'
    draw_line_of_now: function(){
        // Remove old lines, if exist
        $('.line_of_now').each(function(iter, obj){
            var tmp_date    = new Date();
            tmp_date.setSeconds(-1);
            var old_line_holder = document.getElementById('hour_row_' + (tmp_date.getHours()-1));
            if(old_line_holder)
                old_line_holder.removeChild(obj);
        });

        var now             = new Date();
        // Check if we are on the right day to draw the line of now on
        var right_day       = false;
        if(now.getDate() == this.current_date.getDate() &&
                now.getMonth() == this.current_date.getMonth() &&
                now.getFullYear() == this.current_date.getFullYear())
            right_day   = true;

        // If one switches to the monthly view, this function will
        // be set to run again, but there will be no day view left.
        // In such a case, do not execute
        if(document.getElementById('hour_row_' + now.getHours()) &&
                right_day){
                    var line_holder     = document.getElementById('hour_row_' + (now.getHours()-1));
                    var height          = line_holder.offsetHeight*now.getMinutes()/60-1;

                    var line_of_now     = document.createElement('div');
                    $(line_of_now).attr('class', 'line_of_now');
                    $(line_of_now).attr('style', 'height:' + height + 'px;');

                    // A label with current time
                    var time = now.toLocalLongTime();
                    var time_holder     = document.createElement('div');
                    $(time_holder).attr('class', 'time_holder');
                    $(time_holder).text(time);
                    line_of_now.appendChild(time_holder);

                    line_holder.appendChild(line_of_now);
                    setTimeout("calendar.draw_line_of_now()", 1000);
                }
    },


    // Set the status box to the current month/year 
    // (nothing more planned, yet)
    set_status_box: function() {
        $('#status_box').text('Selected day is: '+ this.current_date.getDate() + '/' + 
                (this.current_date.getMonth()+1) + '/' + 
                this.current_date.getFullYear());
    },

    // Assemble the day on the monthly calendar
    assemble_month_day: function(x, y, attrs){
        var day             = document.createElement('div');
        $(day).attr('id', 'month-day-' + attrs['month'] 
                + '-' + attrs['date']);

        $(day).attr('data-year', attrs['year']);
        $(day).attr('data-month', attrs['month']);
        $(day).attr('data-day', attrs['date']);

        $(day).attr('style', 'width:'   + (parseInt(attrs['day_x'])-2) +
                'px;height:' + (parseInt(attrs['day_y'])-2) +
                'px;left:'   + x              +
                'px;top:'    + y              +
                'px;position:absolute;');

        if(attrs['active'])
            $(day).attr('class', 'month-day day-active');
        else
            $(day).attr('class', 'month-day day-inactive');

        if(attrs['clicked'])
            $(day).addClass('clicked');
        if(attrs['today'])
            $(day).addClass('today');

        // Create the header with the day number (googlecal style)
        var header          = document.createElement('div');
        $(header).attr('class', 'month-day-header');
        $(header).text(attrs['date']);

        day.appendChild(header);

        return day; 
    },

    // TODO add a keyboard shortcuts handler
    // TODO add a client-side cache, preferabely using client-side storage for more added awesomenes

    draw_calendar: function(delta){
        this.helpers.clean_cal_disp();
        if($('#button_month').attr('class').indexOf('active')!= -1){
            calendar.current_date.setMonth(calendar.current_date.getMonth()+delta);
            calendar.draw_month();
        }
        else if($('#button_day').attr('class').indexOf('active')!= -1){
            calendar.current_date.setDate(calendar.current_date.getDate()+delta);
            calendar.draw_day();
        }
        this.set_status_box();
    },

    // Button binder 
    // Assumes that the buttons were already 
    // created by helpers.create_structure()
    // TODO Diffenent action depending on what is being displayed (week/day)
    bind_buttons: function(){
        $('#button_next').bind('click', function() {
            calendar.draw_calendar(1);
        });
        $('#button_prev').bind('click', function() {
            calendar.draw_calendar(-1);
        });
        $('#button_day').bind('click', function() {
            calendar.helpers.clean_cal_disp();
            calendar.draw_day();
            calendar.set_status_box();
        });
        $('#button_month').bind('click', function() {
            calendar.helpers.clean_cal_disp();
            calendar.draw_month();
            calendar.set_status_box();
        });
    },

    // event = {
    // 'date': date,
    // 'location': 'location',
    // 'duration': number of minutes,
    // 'name': text,
    // 'description': text,
    // 'attendees': [[id,name],...],
    // 'owner': [id,name],
    // 'max_attendees': int,
    // 'joinable': boolean
    // }

    bind_new_event_day: function() {
        $('.snap_to').bind('click', function(event){
            if($(this).attr('id')){
                if($(this).attr('id').indexOf('hour_row_') != -1){
                    var event_date = new Date();
                    event_date.setFullYear(calendar.current_date.getFullYear());
                    event_date.setMonth(calendar.current_date.getMonth());
                    event_date.setDate(calendar.current_date.getDate());
                    event_date.setMinutes(0);
                    event_date.setSeconds(0);
                    var hour = $(this).attr('id').slice(9);
                    event_date.setHours(hour);

                    var new_event = {};
                    new_event['date'] = event_date;
                    new_event['location'] = "";
                    new_event['duration'] = 60;
                    new_event['name'] = "Default event";
                    new_event['description'] = "";
                    new_event['attendees'] = [[uid, uname]];
                    new_event['owner'] = [uid, uname];
                    new_event['max_attendees'] = 100;
                    new_event['joinable'] = true;

                    events.push(new_event);
                    calendar.draw_day();

                    calendar.helpers.sort_events();
                    calendar.draw_day();

                    // Now, IMPLEMENT syncing with the server
                }
            }
        });
    },

    // Function ran when a day on the month display is clicked
    clicked_month_day: function(object) {
        // The function will remove the 'clicked' label from all days.
        // The following gives us the ability to assign the clicked label
        // if it is needed
        var stay_clicked = false;
        if($(object).attr('class').indexOf('clicked') == -1)
            stay_clicked = true;

        // Set the new current date
        this.current_date.setMonth($(object).attr('data-month'));
        this.current_date.setDate($(object).attr('data-day'));
        this.current_date.setFullYear($(object).attr('data-year'));

        // Strip the clicked class from all of the objects.
        // Useful if another day was clicked beforehand
        $('.month-day.clicked').each(function(iter, obj){
            $(obj).removeClass('clicked');
        });

        // Check if there was a previous click some time ago
        if(new Date().getTime() - $(object).attr('data-clicked') 
                < this.double_click_timeout){
                    this.current_date.setMonth($(object).attr('data-month'));
                    this.current_date.setDate($(object).attr('data-day'));

                    // Set the mwd buttons to show 'day'
                    $('#mwd_button_group button').each(function(iter, obj){
                        $(obj).removeClass('active');
                        if($(obj).attr('id') == 'button_day')
                        $(obj).addClass('active');
                    });

                    this.draw_day();
                }
        else {
            if(stay_clicked)
                $(object).addClass('clicked');

            $(object).attr('data-clicked', new Date().getTime());
        }
        this.set_status_box();
    },

    // Adds existing events to the month view
    draw_events_month: function() {
        for(var i in events){
            // TODO: Accommodate the events on the inactive months, too
            if(events[i]['date'].getFullYear() == this.current_date.getFullYear() &&
                    events[i]['date'].getMonth() == this.current_date.getMonth()){
                        var event_holder = document.getElementById('month-day-' + events[i]['date'].getMonth() +
                                '-' + events[i]['date'].getDate());

                        var event = document.createElement('div');
                        $(event).attr('class', 'month_event');
                        var event_header = document.createElement('div');
                        $(event_header).attr('class', 'month_event_header');
                        var event_body = document.createElement('div');
                        $(event_body).attr('class', 'month_event_body');

                        $(event_header).html(events[i]['date'].toLocalShortTime());
                        $(event_body).html(events[i]['name']);

                        event.appendChild(event_header);
                        event.appendChild(event_body);
                        event_holder.appendChild(event);
                    }
        }
    },

    // Adds existing events to the day view
    draw_events_day: function(){
        // Remove the old junk
        $('.event').each(function(iter, obj){
            document.getElementById('day_holder').removeChild(obj);
        });

        for(var i in events){
            if(events[i]['date'].getFullYear() == this.current_date.getFullYear() &&
                    events[i]['date'].getMonth() == this.current_date.getMonth() &&
                    events[i]['date'].getDate() == this.current_date.getDate()){
                        var overlap = this.helpers.check_overlap(
                                events[i]['date'], 
                                events[i]['duration'], i);
                        var overlap_sum = overlap[0]+overlap[1];
                        overlap_sum++;

                        var event_date = events[i]['date'];
                        var event_start = document.getElementById('hour_row_'+
                                event_date.getHours());
                        var event_offset_top = event_start.offsetTop + 1;
                        if(event_date.getMinutes() == 30) 
                            event_offset_top += 21;

                        var event_start_header = document.getElementById('hour_row_label_'
                                +event_date.getHours());
                        var day_holder = document.getElementById('day_holder');

                        // Now create the div representing the event
                        var event_div   = document.createElement('div');
                        $(event_div).attr('class', 'event');
                        $(event_div).attr('id', 'event_' + i);

                        var event_height;
                        if(events[i]['duration'] < 30) 
                            event_height = event_start.offsetHeight/2-2;
                        else
                            event_height = event_start.offsetHeight*events[i]['duration']/60;
                        var event_width = (event_start.offsetWidth - 
                                event_start_header.offsetWidth)/(overlap_sum)-5;
                        /*var event_width = event_start.offsetWidth-7-
                            event_start_header.offsetWidth;*/
                        var event_left = event_start_header.offsetWidth+1+
                            overlap[0]*event_width;
                        if(overlap[0])
                            event_left += 5;

                        $(event_div).attr('style', 'position:absolute;' + 
                                'left:' + event_left +
                                'px;top:' + (event_offset_top) + 
                                'px;width:' + event_width + 
                                'px;height:' + event_height + 'px;');
                        day_holder.appendChild(event_div);

                        var min_height = Math.floor(event_start.offsetHeight);

                        // Add the time and name header
                        var header = document.createElement('div');
                        $(header).attr('class', 'event_header');
                        var header_time = document.createElement('div');
                        $(header_time).attr('class', 'header_time');
                        var header_name = document.createElement('div');
                        var header_name_inner = document.createElement('div');
                        $(header_name).attr('class', 'header_name');
                        $(header_name).attr('id', 'header_name_' + i);
                        $(header_name_inner).attr('id', 'header_name_inner_' + i);
                        
                        
                        var start_date = event_date.toLocalShortTime();
                        var end_date = events[i]['date'];
                        // Lol, this is a reference, NOT a copy/
                        // Therefore a different approach is needed
                        end_date.setMinutes(
                                end_date.getMinutes()+events[i]['duration']);
                        end_date = end_date.toLocalShortTime();
                        events[i]['date'].setMinutes(
                                events[i]['date'].getMinutes()-events[i]['duration']);
                        $(header_time).html(start_date + ' - ' + end_date);
                        $(header_name_inner).html(events[i]['name']);
                        $(header_name_inner).attr('data-parent-id', 'header_name_' + i);
                        $(header_name_inner).attr('data-fieldname', 'name');
                        $(header_name_inner).attr('data-i', i);
                        $(header_name_inner).attr('data-block-modal', true);
                        $(header_name_inner).attr('data-id', events[i]['id']);
                        this.bind_edit(header_name_inner);


                        header.appendChild(header_time);
                        header_name.appendChild(header_name_inner);
                        header.appendChild(header_name);
                        event_div.appendChild(header);

                        this.create_details_view(i, events[i], $(event_div).attr('id'));

                        // Make the event draggable 
                        $(event_div).draggable({grid: [0, 1], 
                            snap: '.snap_to',
                            snapMode: 'outer',
                            snapTolerance: 12,
                            stop: function(e, ui){
                                var delta = Math.ceil((ui.position['top']-ui.originalPosition['top'])/21)*30;
                                var i = parseInt($(this).attr('id').slice(6));
                                // For some reason
                                if(delta > 0)
                                    delta -= 30;
                                var date = events[i]['date'];
                                date.setMinutes(date.getMinutes()+delta);
                                
                                // Send the updated event to server
                                calendar.helpers.json_event_save(i);
                                // Prevent the modal
                                calendar.prevent.push('modal_' + i);
                                calendar.draw_events_day();
                            }
                        });
                        // And make it resizable
                        $(event_div).resizable({handles: "s",
                            minHeight: min_height,
                            snap: '.snap_to',
                            snapMode: 'inner',
                            ghost: true,
                            snapTolerance: 19,
                            start: function(e, ui){
                            },
                            stop: function(e, ui){
                                var i = parseInt($(this).attr('id').slice(6));

                                var duration = Math.ceil(this.offsetHeight/21)*30;
                                events[parseInt($(this).attr('id').slice(6))]['duration'] = duration;
                                // Send the updated event to server
                                calendar.helpers.json_event_save(i);
                                // Prevent the modal
                                calendar.prevent.push('modal_' + i);

                                calendar.draw_events_day();
                            },
                            create: function(e, ui){
                            }
                        });

                    }
        }
    },

    create_details_view_all: function() {
        for(var i in events){
            if(events[i]['date'].getFullYear() == this.current_date.getFullYear() &&
                    events[i]['date'].getMonth() == this.current_date.getMonth() &&
                    events[i]['date'].getDate() == this.current_date.getDate()){
                       this.create_details_view(i, events[i], 'event_' + i);
                    }
        }
    },


    create_details_view: function(i, attrs, id) {
        // TODO: If uid == current user, allow editions
        // Verify the rights server-side
        
        // Remove the old junk
        var object = document.getElementById('details_view_'+i);
        if(object){
            console.log('removing');
            var holder = document.getElementById('calendar_holder');
            holder.removeChild(object);
        }
        $('.modal-backdrop').remove();
            

        // Create the details view
        var details = document.createElement('div');
        // Add class 'fade' for animation 
        $(details).attr('class', 'details_view modal hide');
        $(details).attr('id', 'details_view_' + i);

        // Create the header and the body
        var modal_header = document.createElement('div');
        $(modal_header).attr('class', 'modal-header');
        $(modal_header).attr('id', 'modal-header-' + i);
        var modal_body = document.createElement('div');
        $(modal_body).attr('class', 'modal-body');
        $(modal_body).attr('id', 'modal-body-' + i);

        // Owner info
        var owner   = document.createElement('div');
        $(owner).attr('class', 'event_owner');

        var owner_header = document.createElement('div');
        $(owner_header).attr('class', 'details_header');
        $(owner_header).html('Owner:');

        var owner_body = document.createElement('div');
        $(owner_body).attr('class', 'details_body');


        if(attrs['owner'][0] == uid &&
                attrs['owner'][1] == uname)
            $(owner_body).text('You are the owner!');
        else
            $(owner_body).text(attrs['owner'][1]);
        owner.appendChild(owner_body);
        owner.appendChild(owner_header);

        // Event name
        var name    = document.createElement('div');
        $(name).attr('class', 'event_name');
        $(name).attr('data-parent-id','modal-header-'+ i);
        $(name).attr('data-fieldname', 'name');
        $(name).attr('data-i', i);
        $(name).attr('data-id', attrs['id']);
        $(name).text(attrs['name']);
        this.bind_edit(name);

        // Event time
        var time    = document.createElement('div');
        $(time).attr('class', 'event_time details_elem');

        var time_header = document.createElement('div');
        $(time_header).attr('class', 'details_header');
        var time_body = document.createElement('div');
        $(time_body).attr('class', 'details_body');
        $(time_header).html('Duration:');

        // Why is it not an explicit reference?
        var start   = attrs['date'].toLocalShortTime();
        var end     = attrs['date'];
        end.setMinutes(end.getMinutes() + attrs['duration']);
        end = end.toLocalShortTime();
        attrs['date'].setMinutes(
                attrs['date'].getMinutes()-attrs['duration']);
        $(time_body).text(start + ' - ' + end);
        time.appendChild(time_body);
        time.appendChild(time_header);


        // Event location (with google maps link)
        var location= document.createElement('div');
        $(location).attr('id', 'location-' + i);
        $(location).attr('class', 'event_location details_elem');

        var location_header = document.createElement('div');
        $(location_header).attr('class', 'details_header');
        var location_body = document.createElement('div');
        $(location_body).attr('class', 'details_body');

        $(location_body).attr('data-parent-id', 'location-' + i);
        $(location_body).attr('data-fieldname', 'location');
        $(location_body).attr('data-i', i);
        $(location_body).attr('data-id', attrs['id']);

        $(location_header).html('Location:');
        $(location_body).html(attrs['location'] + '<br />');
        this.bind_edit(location_body);
        
        var maps_btn= document.createElement('button');
        $(maps_btn).attr('class', 'btn btn-info btn-mini btn-location');
        $(maps_btn).html('Show on map!');
        $(maps_btn).bind('click', function(event){
            window.open('https://maps.google.com/?q=' +
                encodeURIComponent(attrs['location']), '_blank');
        });
        location.appendChild(location_body);
        location.appendChild(location_header);
        location.appendChild(maps_btn);


        // Description
        var description = document.createElement('div');
        $(description).attr('id', 'description-' + i);
        $(description).attr('class', 'event_description details_elem');

        var description_header = document.createElement('div');
        $(description_header).attr('class', 'details_header');
        var description_body = document.createElement('div');
        $(description_body).attr('class', 'details_body');
        $(description_header).text('Description:');
        $(description_body).text(attrs['description']);
        $(description_body).attr('data-parent-id', 'description-' + i);
        $(description_body).attr('data-fieldname', 'description');
        $(description_body).attr('data-i', i);
        $(description_body).attr('data-id', attrs['id']);
        this.bind_edit(description_body);

        description.appendChild(description_body);
        description.appendChild(description_header);


        // Attendees
        var att     = document.createElement('div');
        $(att).attr('class', 'event_att');

        var att_header = document.createElement('div');
        $(att_header).attr('class', 'details_header');
        $(att_header).html('Attendees:');

        var att_body = document.createElement('div');
        $(att_body).attr('class','details_body');
        for(i in attrs['attendees']){
            var attendant = document.createElement('button');
            $(attendant).attr('class', 'btn btn-info btn-mini btn-att');
            $(attendant).attr('data-id', attrs['attendees'][i][0]);

            var attendant_name = document.createElement('div');
            $(attendant_name).attr('class', 'attendant_name');
            $(attendant_name).text(attrs['attendees'][i][1]);
            attendant.appendChild(attendant_name);
            if(attrs['attendees'][i][0] == uid){
                // Add a spacer
                var spacer = document.createElement('div');
                $(spacer).attr('class', 'spacer');
                $(spacer).html('|');
                attendant.appendChild(spacer);

                var remove = document.createElement('i');
                $(remove).attr('class', 'icon-remove');
                $(remove).bind('click', function(event){
                    // IMPLEMENT
                });
                attendant.appendChild(remove);
            }

            att_body.appendChild(attendant);
        }
        att.appendChild(att_body);
        att.appendChild(att_header);

        // And the QR code display
        var QR = document.createElement('div');
        $(QR).attr('class', 'event_QR');
        $(QR).attr('id', 'event_QR_' + i);
        var qr_canvas = document.createElement('canvas');
        $(qr_canvas).attr('class', 'event_QR_canvas');
        $(qr_canvas).attr('id', 'event_QR_canvas_' + i);
        $(qr_canvas).attr('width', '305');
        $(qr_canvas).attr('height', '305');
        QR.appendChild(qr_canvas);


        modal_header.appendChild(name);
        modal_header.appendChild(owner);
        details.appendChild(modal_header);
        modal_body.appendChild(QR);
        modal_body.appendChild(time);
        modal_body.appendChild(location);
        modal_body.appendChild(description);
        modal_body.appendChild(att);
        //modal_body.appendChild(joinable);
        details.appendChild(modal_body);

        $('#calendar_holder').append(details);
        this.bind_show_modal(id, $(details).attr('id'));
        //$(details).modal();
        // TODO: Add headers in details display
    },


    bind_edit : function(object){
        $(object).bind('click', function(event){
            var parent = document.getElementById($(this).attr('data-parent-id'));

            var value = $(this).text();
            var edit_id = $(this).attr('id');
            var edit_class = $(this).attr('class');
            
            var edit_field;
            if(this.offsetHeight > 20)
                edit_field = document.createElement('textarea');
            else
                edit_field = document.createElement('input');

            $(edit_field).attr('type', 'text');
            $(edit_field).attr('value', value);
            $(edit_field).attr('class', 'edit-field');
            $(edit_field).attr('data-id', edit_id);
            $(edit_field).attr('data-event-id', $(this).attr('data-id'));
            $(edit_field).attr('data-i', $(this).attr('data-i'));
            $(edit_field).attr('data-class', edit_class);
            $(edit_field).attr('data-fieldname', $(this).attr('data-fieldname'));
            $(edit_field).attr('data-block-modal', $(this).attr('data-block-modal'));
            $(edit_field).attr('data-parent', $(parent).attr('id'));

            $(edit_field).attr('id', 'edit_field_' + Math.random().toString());

            // Prevent the opening of a modal when clicked on the day-view
            if($(this).attr('data-block-modal') == 'true'){
                calendar.prevent.push('modal_' + $(this).attr('data-i'));
                $(edit_field).bind('click', {i: $(this).attr('data-i')}, 
                        function(event){
                            calendar.prevent.push('modal_'+event.data.i);
                        });
            }
            $(this).unbind('click');

            parent.removeChild(this);
            parent.appendChild(edit_field);
            edit_field.select();

            calendar.watch_field($(edit_field).attr('id'));
        });
    },

    watch_field: function(field_id) {
        if(!this.prevented('watch_field_' + field_id)){
            var field = document.getElementById(field_id);

            // Make Return force sync with server
            $(field).keypress({'fid': field_id}, function(event){
                if(event.which == 13 && !calendar.prevented(
                        'watch_field_' + field_id + '_return')){
                    event.preventDefault();

                    calendar.field_save_and_remove(event.data.fid);
                    
                    // This will ensure us that the rest of the function will not run
                    // if save event was lunched
                    calendar.prevent.push('field_save_and_remove_' + event.data.fid);
                    calendar.prevent.push('watch_field_' + event.data.fid);

                }
            });
            if($(field).attr('data-prev') == field.value){
                // Check if the field stays the same for longer time,
                // so it can be saved
                if($(field).attr('data-prev-count') == 2){
                    this.field_save_and_remove(field_id);
                }
            }
            else
                $(field).attr('data-prev-count', 0);
            if(document.getElementById($(field).attr('id'))){
                $(field).attr('data-prev', field.value);
                $(field).attr('data-prev-count', 
                        parseInt($(field).attr('data-prev-count'))+1);
                setTimeout("calendar.watch_field('" + $(field).attr('id') + "')", 3000);
            }
        }
    },
    
    field_save_and_remove: function(field_id){
        if(!this.prevented('field_save_and_remove_' + field_id)){
            // SYNC with server
            var field = document.getElementById(field_id);
            events[$(field).attr('data-i')][$(field).attr('data-fieldname')] =
                field.value;

            calendar.helpers.json_event_save($(field).attr('data-i'));

            var static_field = document.createElement('div');
            $(static_field).attr('id', $(field).attr('data-id'));
            $(static_field).attr('class', $(field).attr('data-class'));
            $(static_field).attr('data-parent-id', $(field).attr('data-parent'));
            $(static_field).attr('data-id', $(field).attr('data-event-id'));
            $(static_field).attr('data-i', $(field).attr('data-i'));
            $(static_field).attr('data-fieldname', $(field).attr('data-fieldname'));
            $(static_field).text(field.value);

            var parent = document.getElementById(
                    $(field).attr('data-parent'));
            parent.removeChild(field);
            parent.appendChild(static_field);
            calendar.draw_events_day();
            calendar.bind_edit(static_field);
        }
    },

    bind_show_modal: function(event_id, modal_id){
        $('#' + event_id).bind('click', {id: modal_id}, function(event){
            var i = event.data.id.slice(13);
            if(!calendar.prevented('modal_' + i)){
                $('#' + event.data.id).attr('style', '');
                $('#' + event.data.id).modal();

                // QR code getter
                // TODO: Add a client-size cache
                $.ajax({
                    url: script_root + '/_get_event_qr',
                    mimeType: 'application/base64',
                    data: {
                        'id': events[i]['id']
                    },
                    success: function(data){
                        data = 'data:image/png;base64,' + data;
                        var image = new Image();
                        image.src = data;

                        image.onload = function() {
                            var qr_canvas = document.getElementById('event_QR_canvas_'+i);
                            var context = qr_canvas.getContext('2d');
                            context.clearRect(0, 0, 305, 305);
                            context.drawImage(image, 0, 0, 305, 305);
                        }
                    }
                });
            }
        });
    },

    bind_month_day: function(attrs){
        $('#month-day-' + attrs['month'] + '-' + attrs['date']).bind(
                'click', function(event){
                    event.preventDefault();
                    calendar.clicked_month_day(this);
                });
    },

    prevented: function(field_id){
        for(var i in this.prevent){
            if(this.prevent[i] == field_id){
                this.prevent.splice(i, 1);
                return true;
            }
        }
        return false;
    },

    prevent_watcher: function(){
        for(var i in this.prev_prevent){
            for(var j in this.prevent){
                if(this.prev_prevent[i] == this.prevent[j]){
                    this.prevent.splice(j,1);
                    console.log('removing_duplicate');
                    break;
                }
            }
        }
        this.prev_prevent = this.prevent;
        setTimeout('calendar.prevent_watcher()', 500)
    },


    bootstrap: function(){
        this.helpers.correct_timezone();
        this.helpers.create_structure();
        this.bind_buttons();
        this.draw_month();
        this.prevent_watcher();
    }
    // TODO Add some margin on the bottom of day display
}

// A time display helper function
Date.prototype.toLocalShortTime = function(){
    var hours = this.getHours();
    var minutes = this.getMinutes();

    if(hours < 10) 
        hours = '0' + hours;
    if(minutes < 10)
        minutes = '0' + minutes;
    return hours + ':' + minutes;
}
Date.prototype.toLocalLongTime = function(){
    var hours = this.getHours();
    var minutes = this.getMinutes();
    var seconds = this.getSeconds();

    if(hours < 10) 
        hours = '0' + hours;
    if(minutes < 10)
        minutes = '0' + minutes;
    if(seconds < 10)
        seconds = '0' + seconds;
    return hours + ':' + minutes + ':' + seconds;
}

$(document).ready(function(){
    calendar.bootstrap();
});
