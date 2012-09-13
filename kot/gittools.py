from markdown import markdown
import subprocess
from StringIO import StringIO
from time import strptime
from dateutil.parser import parse

# Get the post and its metadata
def get_post(text):
    lines = text.split('\n')
    title = ''
    for i, line in enumerate(lines):
        t_line = line.strip()
        if t_line.find('Title') != -1:
            index = t_line.find('=', t_line.find('Title')+5)
            title = (t_line[index+1:]).strip()            

        elif t_line.find('Tags') != -1:
            index = t_line.find('=', t_line.find('Tags')+4)
            t_line = t_line[index+1:]
            tags = [tag.strip() for tag in t_line.split(',')]
            lines.pop(i)

            # Join the lines together
            l = ''
            for tmp_line in lines:
                l += tmp_line +'\n'
            return (title, tags, markdown(l))

# Get metadata
def get_meta(filename):
    command = ['git', 'log', filename]
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    process.wait()
    result = process.communicate()[0]
    
    ret = ['', '', '']

    for line in result.split('\n'):
        if line.find('commit') != -1:
            ret[0] = (line[line.find('commit')+6:]).strip()
        if line.find('Author:') != -1:
            ret[1] = (line[line.find('Author:')+7:]).strip()
        if line.find('Date:') != -1:
            ret[2] = (line[line.find('Date:')+5:]).strip()
            ret[2] = parse(ret[2])
            return ret


# Parse a file with a given filename for markdown
def parse_file(filename):
    try:
        with open(filename, 'r') as f:
            (title, tags, lines) = get_post(f.read())
            (commit, author, time) = get_meta(filename)
    except IOError:
        print "The filename %s doesn't exist", filename

