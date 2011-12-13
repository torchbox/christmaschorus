from fabric.api import *

env.hosts = ['sysadmin@sing.torchbox.com']

def deploy():
	with cd('/usr/local/django/christmaschorus/'):
		sudo('git pull', user="christmaschorus")
		sudo('PYTHONPATH=/usr/local/django/virtualenvs/christmaschorus/lib/python2.6/site-packages:$PYTHONPATH ./manage.py syncdb', user="christmaschorus")
		sudo('PYTHONPATH=/usr/local/django/virtualenvs/christmaschorus/lib/python2.6/site-packages:$PYTHONPATH ./manage.py migrate', user="christmaschorus")
		sudo('PYTHONPATH=/usr/local/django/virtualenvs/christmaschorus/lib/python2.6/site-packages:$PYTHONPATH ./manage.py collectstatic --noinput', user="christmaschorus")
