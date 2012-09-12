// Generated by CoffeeScript 1.3.3
var Pair, Stack, avatar_alert, bind_events, bootstrap, delete_avatar, delete_file, dropbox_drop, get_file, get_quota_usage, mark_selected, partition, populate_with_files, request_avatar, rollback_colour_change, save_colour, score_colour, send_file, setup_structure, sort_colours, update_progress,
  _this = this;

this.max_image_size = 1024 * 1024 * 5;

setup_structure = function() {
  var avatar, avatar_alert, avatar_body, avatar_header, avatar_thumbnail, bar, colour, colour_body, colour_picker, colour_picker_body, colour_picker_header, delete_button, dropbox_label, file_dropbox, file_input, file_quota, file_quota_header, files, files_header, files_table, holder, misc, misc_header, percent_disp, progress_bar, send_button, table_body, table_header, _i, _len;
  sort_colours();
  holder = document.getElementById('settings_holder');
  colour_picker = document.createElement('div');
  $(colour_picker).attr('class', 'span4 colour_picker');
  colour_picker_header = document.createElement('div');
  $(colour_picker_header).attr('id', 'colour_picker_header');
  $(colour_picker_header).attr('class', 'header');
  $(colour_picker_header).text('Select colour:');
  colour_picker_body = document.createElement('div');
  $(colour_picker_body).attr('id', 'colour_picker_body');
  $(colour_picker_body).attr('class', 'body');
  for (_i = 0, _len = colours.length; _i < _len; _i++) {
    colour = colours[_i];
    colour_body = document.createElement('div');
    $(colour_body).attr('class', 'colour_body');
    $(colour_body).attr('style', "border-color:" + colour.border + ";background-color:" + colour.colour + ";");
    $(colour_body).attr('data-id', colour.id);
    colour_picker_body.appendChild(colour_body);
  }
  colour_picker.appendChild(colour_picker_header);
  colour_picker.appendChild(colour_picker_body);
  holder.appendChild(colour_picker);
  avatar = document.createElement('div');
  $(avatar).attr('class', 'span4 avatar_selector');
  avatar_header = document.createElement('div');
  $(avatar_header).attr('class', 'header');
  $(avatar_header).text('Your avatar:');
  avatar_body = document.createElement('div');
  $(avatar_body).attr('class', 'body');
  avatar_alert = document.createElement('div');
  $(avatar_alert).attr('id', 'avatar_alert');
  avatar_thumbnail = document.createElement('div');
  $(avatar_thumbnail).attr('id', 'avatar_thumbnail');
  file_input = document.createElement('input');
  $(file_input).attr('type', 'file');
  $(file_input).attr('id', 'file_input');
  $(file_input).attr('style', 'display:none;');
  file_dropbox = document.createElement('div');
  $(file_dropbox).attr('id', 'file_dropbox');
  dropbox_label = document.createElement('div');
  $(dropbox_label).attr('id', 'dropbox_label');
  $(dropbox_label).html('<h1>Drop files here</h1>');
  file_dropbox.appendChild(dropbox_label);
  delete_button = document.createElement('button');
  $(delete_button).attr('class', 'btn btn-danger btn-small');
  $(delete_button).attr('id', 'delete_button');
  $(delete_button).text('Delete');
  send_button = document.createElement('button');
  $(send_button).attr('class', 'btn btn-primary btn-small');
  $(send_button).attr('id', 'send_button');
  $(send_button).text('New file');
  avatar_body.appendChild(avatar_alert);
  avatar_body.appendChild(file_input);
  avatar_body.appendChild(avatar_thumbnail);
  avatar_body.appendChild(delete_button);
  avatar_body.appendChild(send_button);
  avatar_body.appendChild(file_dropbox);
  avatar.appendChild(avatar_header);
  avatar.appendChild(avatar_body);
  holder.appendChild(avatar);
  misc = document.createElement('div');
  $(misc).attr('class', 'span3 misc_settings');
  misc_header = document.createElement('div');
  $(misc_header).attr('class', 'header');
  $(misc_header).text('Various settings:');
  misc.appendChild(misc_header);
  file_quota = document.createElement('div');
  $(file_quota).attr('class', 'file_quota setting');
  file_quota_header = document.createElement('div');
  $(file_quota_header).attr('class', 'setting_header file_quota_header');
  $(file_quota_header).text('Your disk quota usage:');
  file_quota.appendChild(file_quota_header);
  progress_bar = document.createElement('div');
  $(progress_bar).attr('class', 'progress');
  $(progress_bar).attr('id', 'file_quota_progress');
  bar = document.createElement('div');
  $(bar).attr('class', 'bar');
  $(bar).attr('style', 'width:0%;');
  progress_bar.appendChild(bar);
  percent_disp = document.createElement('div');
  $(percent_disp).attr('class', 'percent_display');
  $(percent_disp).text('%');
  progress_bar.appendChild(percent_disp);
  file_quota.appendChild(progress_bar);
  misc.appendChild(file_quota);
  holder.appendChild(misc);
  files = document.createElement('div');
  $(files).attr('class', 'span12 user_files');
  files_header = document.createElement('div');
  $(files_header).attr('class', 'header');
  $(files_header).text('Your files:');
  files.appendChild(files_header);
  files_table = document.createElement('table');
  $(files_table).attr('class', 'table files_table table-striped table-condensed');
  $(files_table).attr('caption', 'A table listing all your files');
  table_header = document.createElement('thead');
  $(table_header).html('<tr><td>File name</td><td>Mime type</td><td>Size</td><td>Event name</td><td>Event date</td><td>Get file</td><td>Delete file</td></tr>');
  table_body = document.createElement('tbody');
  $(table_body).attr('class', 'files_table_body');
  files_table.appendChild(table_header);
  files_table.appendChild(table_body);
  files.appendChild(files_table);
  holder.appendChild(files);
  request_avatar();
  mark_selected();
  bind_events();
  populate_with_files();
  return get_quota_usage();
};

get_quota_usage = function() {
  return $.ajax({
    url: script_root + '_get_quota',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      var percent_disp, progress, progress_bar;
      progress_bar = $('#file_quota_progress div.bar')[0];
      percent_disp = $('#file_quota_progress div.percent_display')[0];
      progress = data.used / data.quota * 100;
      $(percent_disp).text("" + (Math.round(progress)) + "%");
      return $(progress_bar).animate({
        width: "" + progress + "%"
      });
    },
    error: function(data) {
      return console.log('blah');
    }
  });
};

populate_with_files = function() {
  var delete_button, delete_button_wrapper, event_date, event_name, file, file_mimetype, file_name, file_size, get_button, get_button_wrapper, table_body, table_row, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    table_body = $('.files_table_body')[0];
    table_row = document.createElement('tr');
    $(table_row).attr('data-id', file.id);
    file_name = document.createElement('td');
    $(file_name).text(file.filename);
    file_mimetype = document.createElement('td');
    $(file_mimetype).text(file.mimetype);
    file_size = document.createElement('td');
    $(file_size).text(get_nice_size(file.size));
    event_name = document.createElement('td');
    $(event_name).text(file.event_name);
    event_date = document.createElement('td');
    $(event_date).text(file.event_date.format_nicely());
    get_button_wrapper = document.createElement('td');
    get_button = document.createElement('button');
    $(get_button).attr('class', 'btn btn-success btn-small');
    $(get_button).attr('data-id', file.id);
    $(get_button).text('Get this file!');
    $(get_button).bind('click', function(event) {
      return get_file($(this).attr('data-id'));
    });
    get_button_wrapper.appendChild(get_button);
    delete_button_wrapper = document.createElement('td');
    delete_button = document.createElement('button');
    $(delete_button).attr('class', 'btn btn-danger btn-small');
    $(delete_button).attr('data-id', file.id);
    $(delete_button).text('Remove this file');
    $(delete_button).bind('click', function(event) {
      return delete_file($(this).attr('data-id'));
    });
    delete_button_wrapper.appendChild(delete_button);
    table_row.appendChild(file_name);
    table_row.appendChild(file_mimetype);
    table_row.appendChild(file_size);
    table_row.appendChild(event_name);
    table_row.appendChild(event_date);
    table_row.appendChild(get_button_wrapper);
    table_row.appendChild(delete_button_wrapper);
    _results.push(table_body.appendChild(table_row));
  }
  return _results;
};

get_file = function(file_id) {
  var frame;
  frame = document.createElement('iframe');
  $(frame).attr('width', 1);
  $(frame).attr('height', 1);
  $(frame).attr('frameborder', 0);
  $(frame).attr('src', "" + script_root + "/get_file/" + file_id);
  return $('body')[0].appendChild(frame);
};

delete_file = function(file_id) {
  return $.ajax({
    url: "" + script_root + "/_delete_file/" + file_id,
    type: 'DELETE',
    dataType: 'json',
    success: function(data) {
      var table_row;
      table_row = $("tr[data-id=" + data.file_id + "]")[0];
      return $(table_row).hide('highlight', function() {
        var table_body;
        table_body = $('.files_table_body')[0];
        table_body.removeChild(this);
        return get_quota_usage();
      });
    },
    error: function(data) {
      return console.log('oh snap');
    }
  });
};

mark_selected = function() {
  var currently_selected, holder, offset_left, offset_top, opposite, selection_marker;
  selection_marker = document.createElement('div');
  $(selection_marker).attr('class', 'selection_marker');
  holder = document.getElementById('colour_picker_body');
  currently_selected = $(".colour_body[data-id=" + current_colour + "]")[0];
  offset_left = currently_selected.offsetLeft;
  offset_top = currently_selected.offsetTop;
  offset_left -= 5;
  offset_top -= 5;
  opposite = return_opposite($(currently_selected).css('background-color'));
  $(selection_marker).attr('style', ("left:" + offset_left + "px;top:" + offset_top + "px;") + ("background-color:" + opposite));
  return holder.appendChild(selection_marker);
};

request_avatar = function() {
  var thumb;
  thumb = $('#avatar_thumbnail')[0];
  return $.ajax({
    url: script_root + '_avatar_get',
    type: 'POST',
    dataType: 'json',
    data: {
      get: 'True'
    },
    success: function(data) {
      var img;
      if (data.status) {
        img = document.createElement('img');
        $(img).attr('class', 'thumb');
        img.src = 'data:' + data.mimetype + ';base64,' + data.file;
        thumb.appendChild(img);
        return status_notify(thumb, 'success');
      }
    },
    error: function(data) {
      return status_notify(thumb, 'error');
    }
  });
};

bind_events = function() {
  var dropbox, thumbnail;
  $('#send_button').bind('click', function(event) {
    event.preventDefault();
    return $('#file_input').click();
  });
  $('#delete_button').bind('click', function(event) {
    return delete_avatar();
  });
  $('#file_input').bind('change', function(event) {
    return send_file(this.files);
  });
  $('.colour_body').each(function(iter, obj) {
    return $(obj).bind('click', function(event) {
      var color, offset_left, offset_top;
      offset_left = this.offsetLeft;
      offset_top = this.offsetTop;
      color = return_opposite($(this).css('background-color'));
      offset_left -= 5;
      offset_top -= 5;
      $('.selection_marker').stop().animate({
        top: offset_top,
        left: offset_left,
        'background-color': color
      }, 250);
      return save_colour(this);
    });
  });
  dropbox = document.getElementById('file_dropbox');
  thumbnail = document.getElementById('avatar_thumbnail');
  dropbox.addEventListener('drop', dropbox_drop, false);
  thumbnail.addEventListener('drop', dropbox_drop, false);
  $('#avatar_thumbnail').bind('dragenter', function(event) {
    return event.preventDefault();
  });
  $('#avatar_thumbnail').bind('dragover', function(event) {
    return event.preventDefault();
  });
  $('#file_dropbox').bind('dragenter', function(event) {
    return event.preventDefault();
  });
  return $('#file_dropbox').bind('dragover', function(event) {
    return event.preventDefault();
  });
};

delete_avatar = function() {
  var thumb;
  thumb = $('#avatar_thumbnail')[0];
  return $.ajax({
    url: script_root + '_avatar_delete',
    type: 'POST',
    dataType: 'json',
    data: {
      "delete": 'True'
    },
    success: function(data) {
      if ($('img.thumb').is(':visible')) {
        $('img.thumb').hide('scale');
        return status_notify(thumb, 'success');
      }
    },
    error: function(data) {
      return status_notify(thumb, 'error');
    }
  });
};

dropbox_drop = function(event) {
  var dropbox, file, files, image_type, img, reader, thumbnail;
  event.preventDefault();
  files = event.dataTransfer.files;
  file = files[0];
  dropbox = document.getElementById('file_dropbox');
  thumbnail = document.getElementById('avatar_thumbnail');
  image_type = /image.*/;
  if (!file.type.match(image_type)) {
    avatar_alert('The file you want to upload is not an image!');
    return 0;
  }
  if (file.size > _this.max_image_size) {
    avatar_alert('The file you want to upload is too large');
    return 0;
  }
  img = document.createElement('img');
  $(img).attr('class', 'thumb');
  $(img).hide();
  img.file = file;
  if (thumbnail.children.length > 0) {
    thumbnail.removeChild(thumbnail.children[0]);
  }
  thumbnail.appendChild(img);
  reader = new FileReader();
  reader.onload = (function(aImg) {
    return function(e) {
      aImg.src = e.target.result;
      return ($(aImg).delay(200)).show('scale');
    };
  })(img);
  reader.readAsDataURL(file);
  return send_file(files);
};

avatar_alert = function(message) {
  var alert, close_button, message_wrapper;
  alert = document.createElement('div');
  $(alert).attr('class', 'alert');
  close_button = document.createElement('button');
  $(close_button).attr('class', 'close');
  $(close_button).attr('data-dismiss', 'alert');
  $(close_button).text('x');
  message_wrapper = document.createElement('div');
  $(message_wrapper).text(message);
  alert.appendChild(close_button);
  alert.appendChild(message_wrapper);
  return $('#avatar_alert')[0].appendChild(alert);
};

send_file = function(files) {
  var fd, image_type, thumb;
  image_type = /image.*/;
  if (!files[0].type.match(image_type)) {
    avatar_alert('The file you want to upload is not an image!');
    return 0;
  }
  if (files[0].size > this.max_image_size) {
    avatar_alert('The file you want to upload is too large');
    return 0;
  }
  fd = new FormData();
  fd.append('avatar', files[0]);
  thumb = $('#avatar_thumbnail')[0];
  return $.ajax({
    url: script_root + '_avatar_save',
    type: 'POST',
    processData: false,
    contentType: false,
    data: fd,
    success: function(data) {
      return status_notify(thumb, 'success');
    },
    error: function(data) {
      status_notify(thumb, 'error');
      return $('img.thumb').hide('scale');
    }
  });
};

save_colour = function(what) {
  var colour_id;
  colour_id = $(what).attr('data-id');
  return $.ajax({
    url: script_root + '/_colour_save',
    type: 'POST',
    dataType: 'json',
    data: {
      colour: colour_id
    },
    success: function(data) {
      var current_colour;
      if (data.result !== 1) {
        status_notify(what, 'error');
        return rollback_colour_change();
      } else {
        status_notify(what, 'success');
        return current_colour = colour_id;
      }
    },
    error: function() {
      status_notify(what, 'error');
      return rollback_colour_change();
    }
  });
};

sort_colours = function() {
  var edges, high, low, pivot, stack, _results;
  low = 0;
  high = colours.length - 1;
  pivot = 0;
  stack = new Stack();
  stack.push(new Pair(0, -1));
  _results = [];
  while (!stack.is_empty()) {
    while (low <= high) {
      pivot = partition(low, high);
      stack.push(new Pair(pivot + 1, high));
      high = pivot - 1;
    }
    edges = stack.pop();
    low = edges.first;
    _results.push(high = edges.second);
  }
  return _results;
};

partition = function(low, high) {
  var i, left, out, pivot, ret, right, _i, _j, _k, _ref, _ref1;
  if (low === high) {
    return low;
  }
  pivot = parseInt(Math.floor(Math.random() * (high - low + 1) + low));
  left = new Array();
  right = new Array();
  out = new Array(this.colours.length);
  for (i = _i = low; low <= high ? _i <= high : _i >= high; i = low <= high ? ++_i : --_i) {
    if (i !== pivot) {
      if (score_colour(this.colours[i]['colour'], this.colours[pivot]['colour'])) {
        left.push(this.colours[i]);
      } else {
        right.push(this.colours[i]);
      }
    }
  }
  left.push(this.colours[pivot]);
  ret = left.length - 1 + low;
  for (i = _j = 0, _ref = right.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
    left.push(right[i]);
  }
  for (i = _k = 0, _ref1 = this.colours.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
    if (i < low || i > high) {
      out[i] = this.colours[i];
    } else {
      out[i] = left[i - low];
    }
  }
  this.colours = out;
  return ret;
};

score_colour = function(colour, vertex) {
  var hue1, hue2, sat1, sat2, val1, val2, _ref, _ref1;
  _ref = rgb2hsv(colour), hue1 = _ref[0], sat1 = _ref[1], val1 = _ref[2];
  _ref1 = rgb2hsv(vertex), hue2 = _ref1[0], sat2 = _ref1[1], val2 = _ref1[2];
  if (hue1 < hue2) {
    return true;
  } else {
    if (hue2 < hue1) {
      return false;
    }
    if (sat1 < sat2) {
      return true;
    } else {
      if (sat2 < sat1) {
        return false;
      }
      if (val1 < val2) {
        return true;
      }
      return false;
    }
  }
};

Pair = (function() {

  function Pair(first, second) {
    this.first = first;
    this.second = second;
  }

  Pair.prototype.first = function() {
    return this.first;
  };

  Pair.prototype.second = function() {
    return this.second;
  };

  return Pair;

})();

Stack = (function() {

  function Stack() {
    this.stack = [];
  }

  Stack.prototype.push = function(element) {
    return this.stack.push(element);
  };

  Stack.prototype.pop = function() {
    var ret;
    if (this.stack.length > 0) {
      ret = this.stack[this.stack.length - 1];
      this.stack.splice(-1, 1);
      return ret;
    } else {
      return -1;
    }
  };

  Stack.prototype.is_empty = function() {
    if (this.stack.length > 0) {
      return 0;
    }
    return 1;
  };

  return Stack;

})();

update_progress = function(event) {
  var percent;
  if (event.lengthComputable) {
    percent = event.loaded / event.total;
    return console.log(percent + '%');
  } else {
    return console.log('error computing length');
  }
};

rollback_colour_change = function() {
  var color, colour, offset_left, offset_top;
  colour = $(".colour_body[data-id='" + current_colour + "']")[0];
  offset_left = colour.offsetLeft;
  offset_top = colour.offsetTop;
  color = return_opposite($(colour).css('background-color'));
  offset_left -= 5;
  offset_top -= 5;
  return $('.selection_marker').stop().animate({
    top: offset_top,
    left: offset_left,
    'background-color': color
  }, 250);
};

bootstrap = function() {
  return setup_structure();
};

$(document).ready(function() {
  return bootstrap();
});
