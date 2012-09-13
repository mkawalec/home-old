from markdown import markdown


# Get tags
def get_tags(text):
    lines = text.split('\n')
    for i, line in enumerate(lines):
        t_line = line.strip()
        if line.find('Tags') != -1:
            index = t_line.find('=', t_line.find('Tags')+4)
            t_line = t_line[index+1:]
            tags = [tag.strip() for tag in t_line.split(',')]
            lines.pop(i)

            # Join the lines together
            l = ''
            for tmp_line in lines:
                l += tmp_line +'\n'
            return (tags, l)


# Parse a file with a given filename for markdown
def parse_file(filename):
    try:
        with open(filename, 'r') as f:
            (tags, lines) = get_tags(f.read())
            print tags
            print markdown(lines)
    except IOError:
        print "The filename %s doesn't exist", filename

