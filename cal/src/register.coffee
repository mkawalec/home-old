# Notifies the user about her password strength
show_pass_strength = ->
    password1 = $("[name='passwd1']")[0]
    entropy = calculate_entropy password1.value

    pass_strength = $('#pass_strength')
    $(pass_strength).text "It would take #{nicefy(Math.pow(2,entropy-32))} on one standard PC to break your password"

$(document).ready () ->
    $("[name='passwd1']").bind 'keyup', (event) ->
        show_pass_strength()
