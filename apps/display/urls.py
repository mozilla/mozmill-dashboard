from django.conf.urls.defaults import *

#URL patterns for the reports views
urlpatterns = patterns('display.views',
    url(r'^$', 'reporter', {'test_type':'all'}, name='display.all_reports'),
    url(r'^functional/$', 'reporter', {'test_type':'functional'}, name='display.functional'),
    url(r'^endurance/$', 'reporter', {'test_type':'endurance'}, name='display.endurance'),
    url(r'^update/$', 'reporter', {'test_type':'update'}, name='display.update'),
)

#URL patterns for the fop failures
urlpatterns += patterns('display.views',
    url(r'^topfailures/$', 'reporter', {'test_type':'all','top_fail_view':True},name='display.top_fail'),
    url(r'^all/topfailures/$', 'reporter', {'test_type':'all','top_fail_view':True},name='display.top_fail'),
    url(r'^functional/topfailures/$', 'reporter', {'test_type':'functional','top_fail_view':True}, name='display.functional'),
    url(r'^endurance/topfailures/$', 'reporter', {'test_type':'endurance','top_fail_view':True}, name='display.endurance'),
    url(r'^update/topfailures/$', 'reporter', {'test_type':'update','top_fail_view':True}, name='display.update'),
)

#url patterns for the report view
urlpatterns += patterns('display.report.views',
    url(r'^report/(?P<_id>\w+)$', 'report', name='display.report'),
)

