from fabric.api import *

# the user to use for the remote commands
env.user = 'flask'
# the servers where the commands are executed
env.hosts = ['bazzle.me']

def pack():
    # create a new source distribution as tarball
    local('python setup.py sdist --formats=gztar', capture=False)

def deploy():
    # figure out the release name and version
    dist = local('python setup.py --fullname', capture=True).strip()
    # upload the source tarball to the temporary folder on the server
    put('dist/%s.tar.gz' % dist, '/tmp/mama.tar.gz')
    # create a place where we can unzip the tarball, then enter
    # that directory and unzip it
    run('mkdir /tmp/mama-site')
    with cd('/tmp/mama-site'):
        run('tar xzf /tmp/mama.tar.gz')
        # now setup the package with our virtual environment's
        # python interpreter
        run('cd Strona* && /home/flask/www/mama/env/bin/python setup.py install')
    # now that all is set up, delete the folder again
    run('rm -rf /tmp/mama* /tmp/mama.tar.gz')
    # and finally touch the .wsgi file so that mod_wsgi triggers
    # a reload of the application
    #run('touch /var/www/yourapplication.wsgi')
