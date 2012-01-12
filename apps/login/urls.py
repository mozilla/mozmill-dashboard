from django.conf.urls.defaults import *

urlpatterns = patterns('login.views',
   url(r'logout/$', 'logout_view'),
   url(r'verify_login/$', 'verify_login'),
   url(r'login/$', 'login_form'),
)
urlpatterns += patterns('login.views',
   url(r'profile/$', 'home', name='login.home'),
)
