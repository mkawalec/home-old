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


SECRET_KEY = 'adsdfnjw4rwd332'
SALT = 'sdfj323rf'
PERMANENT_SESSION_LIFETIME = timedelta(days=60)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])
MAX_CONTENT_LENGTH = 40 * 1024 * 1024

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
            flash('No such user.', 'info')
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

    next = None if not request.args['next'] else request.args['next']
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
    events = query_db("SELECT * FROM events")
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

    return render_template('calendar.html',events=events)

# User settings page
@app.route('/settings')
@login_required
def settings():
    colours = query_db("SELECT id,border,colour FROM "
                       "colours WHERE owner=%s OR owner='10'",
                       [session['uid']])
    current = query_db("SELECT colour FROM users WHERE id=%s",
            [session['uid']], one=True)['colour']
    return render_template('settings.html', colours=colours, current=current)


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

@app.route('/_get_event_qr')
def event_qr():
    enc = Encoder()
    qr_raw_data = query_db('SELECT name,location,date,duration '
                           'FROM events WHERE id=%s',
                           [request.args.get('id')], one=True)

    # TODO: Duration needs adding here
    qr_data = 'BEGIN:VEVENT' + '\nSUMMARY:' + qr_raw_data['name'] + '\nLOCATION:' + qr_raw_data['location'] + '\nDTSTAMP:' + qr_raw_data['date'].isoformat() + '\nEND:VEVENT'
    
    im = enc.encode(qr_data, {'width': 305, 'version':10})
    output = StringIO()
    im.save(output, format='PNG')

    return send_base64(output)

app.run(debug=True)
