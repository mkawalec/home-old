from __future__ import division

from flask import (Flask, request,  redirect, url_for, abort,
                   render_template, flash, jsonify, send_file, g,
                   Response, session)
from werkzeug import secure_filename

from functools import wraps

from contextlib import closing
import psycopg2
from hashlib import sha256

from qrencode import Encoder
from StringIO import StringIO
from base64 import b64encode

from datetime import timedelta, datetime

from cStringIO import StringIO

import re

from PIL import Image

from glob import glob
import os

import mimetypes

from random import randint


SECRET_KEY = 'adsdfnjw4rwd332'
SALT = 'sdfj323rf'
PERMANENT_SESSION_LIFETIME = timedelta(days=60)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
MAX_CONTENT_LENGTH = 400 * 1024 * 1024

app = Flask(__name__)
app.config.from_object(__name__)

def connect_db():
    return psycopg2.connect("dbname=homepage user=postgres")

@app.before_request
def before_request():
    g.db = connect_db()
    g.db.set_client_encoding('UTF8')
    g.db_cursor = g.db.cursor()


@app.teardown_request
def teardown_request(exception):
    g.db_cursor.close()
    g.db.close()


def query_db(query, args=(), one=False):
    cursor = g.db_cursor
    try:
        cursor.execute(query, args)
    except psycopg2.IntegrityError:
        ## Constraints not met
        g.db.rollback()
        return -1

    g.db.commit()

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

def exists_in(obj, obj_set, column):
    for ob in obj_set:
        if str(ob[column]) == str(obj):
            return True
    return False

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

# Returns the x and y size of an image will have after keeping the aspect
# ratio
def get_size(bb,size):
    width = bb[2]-bb[0]
    height = bb[3]-bb[1]
    mult = 1
    if width > height:
        mult = size/width
    else: 
        mult = size/height
    return (int(width*mult), int(height*mult))

def gen_filename(number=10):
    filename = ''
    chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
             'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w', 'x',
             'y', 'q', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
             'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T',
             'U', 'W', 'Q', 'X', 'Y', 'Z', '1', '2', '3', '4', '5',
             '6', '7', '8', '9', '0']
    
    for i in range(number):
        filename += chars[randint(0, len(chars)-1)]

    return filename

## Sends to the client a StringIO object not analysing
## its contents in any way - it will be base64
## encoded before sending
def send_base64(what):
    what.seek(0)
    ret = b64encode(what.getvalue())
    
    headers = {}
    headers['Content-Type'] = 'application/base64'
    
    return Response(ret,headers=headers, mimetype='application/base64', 
            direct_passthrough=True, status='200 OK')


# TODO - this should differentiate between standard and ajax function
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            flash('You must be logged in to access this place', 'info')
            return redirect(url_for('login', next=request.path))
        elif session['logged_in'] == False:
            flash('You must be logged in to access this place', 'info')
            return redirect(url_for('login', next=request.path))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/piles')
@login_required
def piles():
    piles = query_db('SELECT name,id FROM pile_descs WHERE owner=%s',
            [session['uid']])
    for pile in piles:
        pile['members'] = query_db('SELECT member,x,y FROM piles WHERE '
                                   'owner=%s AND pile_num=%s',
                                   [session['uid'], pile['id']])
    return render_template('piles.html', piles=piles)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = query_db('SELECT * FROM users WHERE uname=%s',
                [request.form['uname']], one=True)
        if user is None:
            flash('No such user.', 'error')
        elif user['passwd'] == (
                sha256(request.form['passwd'] + 
                    app.config['SALT']).hexdigest()):
                    session['logged_in'] = True
                    session['uname'] = request.form['uname']
                    session['uid'] = user['id']
                    flash('You were logged in, %s' % session['uname'], 'success')
                    
                    next = request.form['next']
                    if not next or next == 'None':
                        return redirect(url_for('home')) 
                    else:
                        return redirect(next)
        else:
            flash('Wrong password.', 'error')

    next = None if not 'next' in request.args else request.args['next']
    return render_template('login.html', next=next)

@app.route('/logout')
@login_required
def logout():
    if 'logged_in' in session:
        if session['logged_in']:
            del session['logged_in']
            del session['uname']
            del session['uid']
            flash('Succesfully logged out', 'success')

            return redirect(url_for('home'))

    flash('Something went wrong when logging you out', 'error')
    
    return redirect(url_for('home'))

@app.route('/account_details')
@login_required
def account():
    return render_template('home.html')

@app.route('/add_user', methods=['GET', 'POST'])
@login_required
def add_user():
    if request.method == 'POST':
        ret = query_db('INSERT INTO users (uname, passwd) VALUES (%s, %s)',
                [request.form['uname'], sha256(request.form['passwd'] + 
                                        app.config['SALT']).hexdigest()])
        if ret == 1:
            flash('New user has been added!', 'success')
        elif ret == -1:
            flash('This username already exists!', 'error')
        else:
            flash('There was an error adding this person!', 'error')
    
    users = query_db('SELECT uname FROM users ORDER BY id ASC')
    return render_template('add_user.html', users=users)

@app.route('/calendar')
@login_required
def calendar():
    ## Get the events
    events = query_db("(SELECT e.id,e.timestamp,e.date,e.location,"
                      "e.duration,e.name,e.description,e.owner,"
                      "c.border,c.colour FROM events e, colours c, "
                      "users u, attendees a WHERE c.id=u.colour AND "
                      "a.event=e.id AND u.id=e.owner AND a.person=%s) "
                      "UNION (SELECT e.id,e.timestamp,"
                      "e.date,e.location,e.duration,e.name,e.description,"
                      "e.owner,c.border,c.colour FROM events e, colours c, "
                      "users u WHERE c.id=u.colour AND u.id=e.owner AND "
                      "u.id=%s)",
                      [session['uid'], session['uid']])
    
    ## And the disk quota
    used_quota = query_db('SELECT SUM(size) FROM event_files WHERE '
                          'uploaded_by=%s', [session['uid']], one=True)['sum']
    quota = query_db('SELECT file_quota FROM users WHERE id=%s',
                     [session['uid']], one=True)['file_quota']

    ## For each of the events, get the list of the attendees
    for event in events:
        event['attendees'] = query_db('SELECT u.id, u.uname '
                                      'FROM users u, attendees a '
                                      'WHERE a.person = u.id AND '
                                      'a.event = %s', [event['id']])
        event['owner'] = query_db('SELECT u.id, u.uname '
                                  'FROM users u, events e '
                                  'WHERE e.owner = u.id AND '
                                  'e.id = %s', [event['id']], one=True)
    
    # Get user colours
    colours = query_db('SELECT c.colour,c.border FROM colours c, users u '
                       'WHERE u.colour = c.id AND u.id=%s',
                       [session['uid']], one=True)
    return render_template('calendar.html',events=events,
                           colours=colours, quota=str(quota),
                           used_quota=str(used_quota))

# User settings page
@app.route('/settings')
@login_required
def settings():
    colours = query_db("SELECT id,border,colour FROM "
                       "colours WHERE owner=%s OR owner='10'",
                       [session['uid']])
    current = query_db("SELECT colour FROM users WHERE id=%s",
            [session['uid']], one=True)['colour']
    user_files = query_db('SELECT f.filename,f.mimetype,f.size,f.id,e.name,e.date '
                          'FROM event_files f, events e, users u '
                          'WHERE u.id=%s AND f.uploaded_by=u.id AND '
                          'e.id=f.event',[session['uid']])
    print user_files

    return render_template('settings.html', colours=colours, 
                           current=current, user_files=user_files)

# Changes the email for the current user
@app.route('/_change_email', methods=['POST'])
@login_required
def change_email():
    ret = query_db("UPDATE users SET email=%s WHERE id=%s",
                   [request.form['new_email'],session['uid']])
    return jsonify(result=ret)

# Changes the password for the current user
@app.route('/_change_password', methods=['POST'])
@login_required
def change_password():
    old_pass = query_db('SELECT passwd FROM users WHERE id=%s',
                        [session['uid']], one=True)['passwd']
    if sha256(request.form['old_pass']+app.config['SALT']).hexdigest()!=old_pass:
        return jsonify(different_pass=True)

    ret = query_db('UPDATE users SET passwd=%s WHERE id=%s',
            [sha256(request.form['new_pass'] + app.config['SALT']).hexdigest(),
             session['uid']])
    return jsonify(result=ret)


# Get the current avatar image
@app.route('/_avatar_get', methods=['POST'])
@login_required
def get_avatar():
    has_avatar = query_db('SELECT has_thumbnail FROM users WHERE id=%s',
            [session['uid']], one=True)['has_thumbnail']
    if has_avatar:
        filename = query_db('SELECT avatar FROM users WHERE id=%s',
                            [session['uid']],one=True)['avatar']
        if not filename:
            return jsonify({'status': False})

        avatar = open(filename)
        (mimetype, enc) = mimetypes.guess_type(filename)

        avatar = b64encode(avatar.read())
        return jsonify({'file':avatar,'status': True, 'mimetype':mimetype})
    return jsonify({'status': False})

# Get all the data needed for a pile member display
@app.route('/_pile_get', methods=['POST'])
@login_required
def get_pile():
    has_avatar = query_db('SELECT has_thumbnail FROM users WHERE id=%s',
            [session['uid']], one=True)['has_thumbnail']
    avatar = None
    mimetype = None
    status = True

    if has_avatar:
        filename = query_db('SELECT avatar_thumb FROM users WHERE id=%s',
                        [request.form['id']],one=True)['avatar_thumb']
        if filename:
            avatar = open(filename)
            (mimetype, enc) = mimetypes.guess_type(filename)

            avatar = b64encode(avatar.read())

    colour = query_db('SELECT c.colour,c.border FROM colours c,users u '
                      'WHERE u.id=%s AND u.colour=c.id',
                      [request.form['id']], one=True)
    if not avatar:
        status = False
    return jsonify({'file':avatar, 'status':status,'mimetype':mimetype,
                    'colour':colour['colour'],'border':colour['border'],
                    'id':request.form['id']})

# Update avatar
@app.route('/_avatar_save', methods=['POST'])
@login_required
def save_avatar():
    avatar = request.files['avatar']
    extension = re.search('\..*', str(avatar.filename)).group(0)
    filename = 'static/avatars/' + str(session['uid']) 
    avatar.save(filename + extension)
    avatar = Image.open(filename + extension)
    avatar = avatar.resize(get_size(avatar.getbbox(), 200), Image.ANTIALIAS)
    avatar.save(filename + extension)

    # Generate a thumbnail
    avatar = Image.open(filename + extension)
    avatar = avatar.resize(get_size(avatar.getbbox(),40))
    avatar.save(filename + '-thumb' + extension)
    
    ret = query_db('UPDATE users SET has_thumbnail=TRUE,avatar=%s,avatar_thumb=%s '
                   'WHERE id=%s',
                   [filename+extension, 
                    filename+'-thumb'+extension,
                    session['uid']])

    return jsonify(result=ret)

# Sends a file quota for a logged in user
@app.route('/_get_quota')
@login_required
def get_quota():
    used_quota = query_db('SELECT SUM(size) FROM event_files WHERE '
                          'uploaded_by=%s', [session['uid']], one=True)['sum']
    quota = query_db('SELECT file_quota FROM users WHERE id=%s',
                     [session['uid']], one=True)['file_quota']
    return jsonify(used=str(used_quota), quota=str(quota))


# Receive a file
@app.route('/_save_file/<int:event_id>/<timestamp>', methods=['POST'])
@login_required
def save_file(event_id, timestamp):
    # A check of users quota
    used_quota = query_db('SELECT SUM(size) FROM event_files WHERE '
                          'uploaded_by=%s', [session['uid']], one=True)['sum']
    quota = query_db('SELECT file_quota FROM users WHERE id=%s',
                     [session['uid']], one=True)['file_quota']
    stream = request.files['file'].stream
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(0)

    if int(used_quota)+int(size) > int(quota):
        # The total size exceeds the quota!
        return jsonify(quota_exceeded=True,timestamp=timestamp)

    event_file = request.files['file']
    real_filename = event_file.filename
    extension = ''

    if str(event_file.filename).find('.') != -1:
        extension = re.search('\..*', str(event_file.filename)).group(0)
        real_filename = re.search('.*\.',str(event_file.filename)).group(0)[:-1]
    filename = gen_filename()

    # Checking if the file already exists
    try:
        with open('static/event-files/'+filename+extension) as f:
            filename = gen_filename()
    except IOError:
        pass

    event_file.save('static/event-files/'+filename+extension)
    size = os.path.getsize('static/event-files/'+filename+extension)
    (mimetype, enc) = mimetypes.guess_type('static/event-files/'+filename+extension)

    ret = query_db('INSERT INTO event_files (event,file,filename,'
                   'uploaded_by,mimetype,size) VALUES (%s,%s,%s,%s,%s,%s)',
                   [event_id, 'static/event-files/'+filename+extension,
                    real_filename,session['uid'],mimetype,size])
    file_id = query_db('SELECT id FROM event_files WHERE event=%s AND file=%s',
                       [event_id, 'static/event-files/'+filename+extension],
                       one=True)['id']

    return jsonify(result=ret, file_id=file_id, 
                   timestamp=timestamp, quota=str(quota),
                   used_quota=str(used_quota))

# Send a file to a user
@app.route('/get_file/<int:file_id>')
@login_required
def get_file(file_id):
    data = query_db('SELECT file,filename,mimetype FROM event_files WHERE id=%s',
                    [file_id], one=True)
    path = data['file']
    
    filename = data['filename']
    if str(path).find('.') != -1:
        filename = data['filename'] + re.search('\..*', str(path)).group(0)

    return send_file(path,as_attachment=True,
                     attachment_filename=filename)

# Delete a file
@app.route('/_delete_file/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    path = query_db('SELECT file FROM event_files WHERE id=%s',
                    [file_id], one=True)['file']
    os.remove(path)

    ret = query_db('DELETE FROM event_files WHERE id=%s', [file_id])
    
    used_quota = query_db('SELECT SUM(size) FROM event_files WHERE '
                          'uploaded_by=%s', [session['uid']], one=True)['sum']
    quota = query_db('SELECT file_quota FROM users WHERE id=%s',
                     [session['uid']], one=True)['file_quota']
    return jsonify(result=ret, file_id=file_id,
                   quota=str(quota), used_quota=str(used_quota))

@app.route('/_get_filelist/<int:event_id>')
@login_required
def get_filelist(event_id):
    event_files = query_db('SELECT id,filename,mimetype FROM event_files '
                        'WHERE event=%s', [event_id])
    return jsonify(files=event_files, event_id=event_id)

# Get a thumbnail for an image
@app.route('/_get_thumbnail/<int:file_id>/<int:x>/<int:y>')
@login_required
def get_thumbnail(file_id, x, y):
    filename = query_db('SELECT id,file,mimetype,filename FROM '
                        'event_files WHERE id=%s', [file_id], one=True)

    thumb = Image.open(filename['file'])
    # TODO do a nice resize
    (width, height) = get_size(thumb.getbbox(),x)
    thumb = thumb.resize((width,height))
    thumb_data = StringIO()
    thumb.save(thumb_data, "JPEG")
    thumb = b64encode(thumb_data.getvalue())

    return jsonify(thumb=thumb, file_id=file_id, 
                   mimetype=filename['mimetype'], filename=filename['filename'],
                   height=height, filename_id=filename['id'])

@app.route('/_get_icon/<int:file_id>/<int:x>/<int:y>')
@login_required
def get_icon(file_id, x, y):
    data = query_db('SELECT id,file,filename FROM event_files WHERE id=%s',
                        [file_id], one=True)
    mimetype = re.search('\..*',str(data['file'])).group(0)[1:]
    icon_mimetype = 'image/png'
    icon = StringIO()

    try:
        with open('static/mimetypes/'+mimetype+'.png', 'r') as f:
            tmp = Image.open('static/mimetypes/'+mimetype+'.png')
            tmp = tmp.resize((x, y))
            tmp.save(icon, 'PNG')
    except IOError:
        tmp = Image.open('static/mimetypes/mime_ascii.png')
        tmp = tmp.resize((x, y))
        tmp.save(icon, 'PNG')

    icon = b64encode(icon.getvalue())
    return jsonify(thumb=icon, file_id=file_id, 
                   mimetype=icon_mimetype, filename=data['filename'],
                   filename_id=data['id'])

@app.route('/_get_icon_by_mimetype', methods=['POST'])
@login_required
def get_icon_by_mimetype():
    mimetype = request.form['mimetype']
    x = int(request.form['x'])
    y = int(request.form['y'])
    icon_mimetype = 'image/png'
    icon = StringIO()

    try:
        with open('static/mimetypes/'+mimetype+'.png', 'r') as f:
            tmp = Image.open('static/mimetypes/'+mimetype+'.png')
            tmp = tmp.resize((x, y))
            tmp.save(icon, 'PNG')
    except IOError:
        tmp = Image.open('static/mimetypes/mime_ascii.png')
        tmp = tmp.resize((x, y))
        tmp.save(icon, 'PNG')

    icon = b64encode(icon.getvalue())
    return jsonify(thumb=icon, timestamp=request.form['timestamp'], 
                   mimetype=icon_mimetype)

# Delete user's avatar
@app.route('/_avatar_delete', methods=['POST'])
@login_required
def delete_avatar():
    ret = True
    has_avatar = query_db('SELECT has_thumbnail FROM users WHERE id=%s',
            [session['uid']], one=True)['has_thumbnail']
    if has_avatar:
        for avatar in glob('static/avatars/'+str(session['uid'])+'.*'):
            os.remove(avatar)

        ret = query_db('UPDATE users SET has_thumbnail=FALSE WHERE id=%s',
                [session['uid']])

    return jsonify(result=ret)

# Saves colours
@app.route('/_colour_save', methods=['POST'])
@login_required
def save_colour():
    ret = query_db('UPDATE users SET colour=%s WHERE id=%s',
            [request.form['colour'], session['uid']])
    return jsonify(result=ret)


# Permission checking required
@app.route('/_event_save', methods=['POST'])
def save_event():
    ret = query_db('UPDATE events SET name=%s, location=%s, '
                'description=%s, date=%s, duration=%s ' 
                'WHERE id=%s',
                [request.form['name'], 
                request.form['location'],
                request.form['description'],
                request.form['date'],
                request.form['duration'],
                request.form['id']])
    return jsonify(result=ret)

# Create an event
@app.route('/_event_create', methods=['POST'])
def create_event():
    ret = query_db('INSERT INTO events (name,location,description,'
                   'date,duration,owner) VALUES (%s,%s,%s,%s,%s,%s)',
                   [request.form['name'],
                   request.form['location'],
                   request.form['description'],
                   request.form['date'],
                   request.form['duration'],
                   session['uid']])
    event_id = query_db('SELECT id FROM events WHERE name=%s AND '
                        'location=%s AND description=%s AND '
                        'date=%s AND duration=%s AND owner=%s',
                        [request.form['name'],
                        request.form['location'],
                        request.form['description'],
                        request.form['date'],
                        request.form['duration'],
                        session['uid']],one=True)['id']
    return jsonify(event_id=event_id,name=request.form['name'],
                   location=request.form['location'],
                   description=request.form['description'],
                   date=request.form['date'],
                   duration=request.form['duration'])
# Deletes an event
@app.route('/_event_delete/<int:which>', methods=['DELETE'])
def delete_event(which):
    files = query_db('SELECT file FROM event_files WHERE event=%s',[which])
    for file in files:
        os.remove(file['file'])
    
    ret = query_db('DELETE FROM event_files WHERE event=%s', [which])
    ret = query_db('DELETE FROM attendees WHERE event=%s', [which])
    ret = query_db('DELETE FROM events WHERE id=%s', [which])
    return jsonify(data=ret,which=which)

# Modifies and attendant list
@app.route('/_modify_attendant/<int:event_id>/<int:user_id>', 
           methods=['DELETE'])
def modify_attendant(event_id, user_id):
    if request.method == 'DELETE':
        ret = query_db('DELETE FROM attendees WHERE person=%s AND event=%s',
                       [user_id, event_id])
        return jsonify(result=ret)
    return jsonify(result=False)

# Save or delete the piles
@app.route('/_piles_save', methods=['POST'])
def save_piles():
    ret = ""
    if request.form['pile_num'] == '-1':
        ret = query_db('DELETE FROM piles WHERE '
                       'owner=%s AND member=%s',
                       [session['uid'], request.form['member']])
    else:
        ret = query_db('BEGIN; '
                       'DELETE FROM piles WHERE '
                       'owner=%s AND member=%s;'
                       'INSERT INTO piles (owner,member,pile_num,x,y) VALUES '
                       '(%s, %s, %s, %s, %s); '
                       'COMMIT;',
                       [session['uid'], 
                        request.form['member'],
                        session['uid'],
                        request.form['member'],
                        request.form['pile_num'],
                        request.form['x'],
                        request.form['y']])
    return jsonify(result=ret)

# Search for the users and return it as json
@app.route('/_get_users')
def search_for_users():
    ret = query_db('SELECT id, uname, in_pile(%s, id) '
                   'FROM users WHERE uname LIKE %s '
                   'ORDER BY in_pile ASC LIMIT 7',
                   [session['uid'], request.args.get('query', '')])
    return jsonify(result=ret)

@app.route('/_get_event_qr/<int:event_id>')
def event_qr(event_id):
    enc = Encoder()
    qr_raw_data = query_db('SELECT name,location,date,duration '
                           'FROM events WHERE id=%s',
                           [event_id], one=True)

    # end date is being set
    end_date =  timedelta(0,0,0,0,qr_raw_data['duration'])
    end_date += qr_raw_data['date']
    
    qr_data = 'BEGIN:VEVENT' + '\nSUMMARY:' + qr_raw_data['name'] + '\nLOCATION:' + qr_raw_data['location'] + '\nDTSTART:' + qr_raw_data['date'].isoformat() + '\nDTEND:' + end_date.isoformat() + '\nEND:VEVENT'
    
    im = enc.encode(qr_data, {'width': 305, 'version':10})
    output = StringIO()
    im.save(output, format='PNG')

    return send_base64(output)

app.run(debug=True)
