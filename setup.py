from setuptools import setup

setup(
    name='Strona mamy',
    version='0.001',
    long_description=__doc__,
    packages=['mama'],
    include_package_data=True,
    zip_safe=False,
    install_requires=['Flask', 'Flask-babel', 'gevent', 'psycopg2']
)

