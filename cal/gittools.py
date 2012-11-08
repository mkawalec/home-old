from markdown import markdown
import subprocess
from StringIO import StringIO
from time import strptime
from dateutil.parser import parse
from glob import glob
import datetime

import psycopg2

posts_location = '/home/michal/build/posts/'
connection = psycopg2.connect('dbname=homepage user=postgres')
connection.set_client_encoding('UTF8')
cursor = connection.cursor()

def disconnect_db():
    cursor.close()
    connection.close()

def query_db(query, args=(), one=False):
    try:
        cursor.execute(query, args)
    except psycopg2.IntegrityError:
        ## Constraints not met
        connection.rollback()
        return -1

    connection.commit()

    try:
        rv = [
            dict((cursor.description[idx][0], value)
                 for idx, value in enumerate(row)
                ) for row in cursor.fetchall()]

    except psycopg2.ProgrammingError:
        #print 'Nothing to fetch'
        return 1
    except:
        return 0

    return (rv[0] if rv else None) if one else rv


# Get the post and its metadata
def get_post(text):
    lines = text.split('\n')
    title = ''
    title_i = None

    for i, line in enumerate(lines):
        t_line = line.strip()
        if t_line.find('Title') != -1:
            index = t_line.find('=', t_line.find('Title')+5)
            title = (t_line[index+1:]).strip()           
            title_i = i

        elif t_line.find('Tags') != -1:
            index = t_line.find('=', t_line.find('Tags')+4)
            t_line = t_line[index+1:]
            tags = [tag.strip() for tag in t_line.split(',')]
            lines.pop(title_i)
            lines.pop(i-1)

            # Join the lines together
            l = ''
            for tmp_line in lines:
                l += tmp_line +'\n'
            return (title, tags, markdown(l))

# Get metadata
def get_meta(filename):
    command = ['git log ' + filename]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True, cwd=posts_location)
    process.wait()
    result = process.communicate()[0]
    
    ret = [[], '', '']

    for line in result.split('\n'):
        if line.find('commit') != -1:
            ret[0].append((line[line.find('commit')+6:]).strip())
        if line.find('Author:') != -1:
            if len(ret[1]) == 0:
                ret[1] = (line[line.find('Author:')+7:]).strip()
        if line.find('Date:') != -1:
            if not isinstance(ret[2], datetime.datetime):
                ret[2] = (line[line.find('Date:')+5:]).strip()
                ret[2] = parse(ret[2])
    return ret


# Parse a file with a given filename for markdown
def parse_file(filename):
    try:
        with open(filename, 'r') as f:
            (title, tags, post) = get_post(f.read())
            (commits, author, time) = get_meta(filename)
            return (title, tags, post, commits, author, time)
    except IOError:
        return -1

# Pick out the author id from the author string
def get_author_id(author):
    start = author.find('<')+1
    end = author.find('>')

    author_id = query_db('SELECT id FROM users WHERE email=%s',
                         [author[start:end]], one=True)['id']
    return author_id

# Updatest the posts in the db
# TODO: Parallelise
# TODO: Remove posts removed from git
def update():
    # Update the git
    update = ['git pull']
    process = subprocess.Popen(update, shell=True, cwd=posts_location)
    process.wait()

    # Get the posts 
    posts = glob(posts_location + '*/post.mkd')
    for post in posts:
        (title, tags, post, commits, author, time) = parse_file(post)
        query = 'SELECT id FROM blog_post WHERE '
        
        for commit in commits:
            query += "commit_id='"+commit+"' OR "
       
        post_id = query_db(query[:-4],one=True)
        author_id = get_author_id(str(author))
        if post_id != None:
            post_id = post_id['id']
            # Now we can update an existing post
            # TODO all in one query
            print 'updating'
            query_db('UPDATE blog_post SET edit_timestamp=%s, commit_id=%s, '
                     'title=%s, contents=%s, author=%s WHERE id=%s',
                     [time, commits[0], title, post, author_id, post_id])
        else:
            print 'inserting'
            # Insert the post to the db
            query_db('INSERT INTO blog_post (commit_id,author,timestamp,'
                     'edit_timestamp,title,contents) VALUES '
                     '(%s,%s,%s,%s,%s,%s)',
                     [commits[0], author_id, time, time, title, post])
            post_id = query_db('SELECT id FROM blog_post WHERE commit_id=%s',
                               [commits[0]], one=True)['id']

        # And redo the tags
        query_db('DELETE FROM post_tags WHERE post=%s', [post_id])
        for tag in tags:
            query_db('INSERT INTO post_tags (post, tag) VALUES '
                     '(%s, %s)', [post_id, tag])
            
    # Disconnect from db
    disconnect_db()


if __name__ == '__main__':
    update()
