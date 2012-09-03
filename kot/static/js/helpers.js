// Generated by CoffeeScript 1.3.3
var decimal_to_hex, get_offsets, hex, hexDigits, hex_to_decimal, return_opposite, rgb2hex, status_notify;

get_offsets = function(element) {
  var offset;
  offset = [element.offsetLeft, element.offsetTop];
  while (element = element.offsetParent) {
    offset[0] += element.offsetLeft;
    offset[1] += element.offsetTop;
  }
  return offset;
};

status_notify = function(object, what) {
  var bg_color, border_color;
  bg_color = $(object).css('background-color');
  border_color = "";
  if (($(object).css('border-color')).length > 0) {
    border_color = $(object).css('border-color');
  } else {
    border_color = ((($(object).attr('style')).match(/border-color:(#[0-9A-F]{6})|(rgb\((\d+),\s*(\d+),\s*(\d+)\))/))[0].match(/#([0-9A-F]{6})|(rgb\((\d+),\s*(\d+),\s*(\d+)\))/))[0];
    console.log(border_color);
  }
  switch (what) {
    case "success":
      return ($(object).stop().animate({
        'background-color': '#99EE99',
        'border-color': '#EAFF00'
      }, 500)).animate({
        'background-color': bg_color,
        'border-color': border_color
      }, 500);
    case "error":
      ($(object).stop().animate({
        'background-color': '#EE9999',
        'border-color': '#EE0000'
      }, 500)).animate({
        'background-color': bg_color,
        'border-color': border_color
      }, 500);
      return console.log('error, error');
  }
};

decimal_to_hex = function(decimal) {
  var hex;
  hex = decimal.toString(16);
  if (hex.length === 1) {
    hex = '0' + hex;
  }
  return hex;
};

hex_to_decimal = function(hex) {
  return parseInt(hex, 16);
};

return_opposite = function(colour) {
  colour = rgb2hex(colour);
  return '#' + (decimal_to_hex(255 - hex_to_decimal(colour.substr(0, 2)))).toString() + (decimal_to_hex(255 - hex_to_decimal(colour.substr(2, 2)))).toString() + (decimal_to_hex(255 - hex_to_decimal(colour.substr(4, 2)))).toString();
};

rgb2hex = function(rgb) {
  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return (hex(rgb[1])) + (hex(rgb[2])) + (hex(rgb[3]));
};

hex = function(x) {
  if (isNaN(x)) {
    return "00";
  } else {
    return hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
  }
};

hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");