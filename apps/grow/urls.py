from django.conf.urls.defaults import *


urlpatterns = patterns('grow.views',
    url(r'^report/$', 'report', name='grow.report'),
)
