from gevent.wsgi import WSGIServer
from cal import app

http_server = WSGIServer(('', 6666), app)
http_server.serve_forever()
