from django.conf.urls.defaults import *

urlpatterns = patterns('mozmill_dashboard.dashboard.views',
    (r'^doc/(?P<id>\w+)/', 'detail'),
    (r'^$', 'index'), 
)
