from gevent.wsgi import WSGIServer
from cal import app

if __name__ == '__main__':
    # Comment the following two lines if you intend to
    # run the app in the debug mode (which is probably the
    # only thing you should be doing at this stage)
    http_server = WSGIServer(('', 6666), app)
    http_server.serve_forever()

    # and uncomment this for debug
    # app.run(debug=True)

