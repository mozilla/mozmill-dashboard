import jingo
import simplejson as json
from copy import deepcopy
from django import http
from django.http import HttpResponse, HttpResponseForbidden

from display.queries import reports, Facets, format_date #, grab_facet_response, grab_operating_systems, grabber 
from display.utils import filter_request

##This is a function to deal with adding filters to elastic search in a less general way but without code duplication in the view code
#The name parameter is whatever mozmill decides to call it. the Key is what it is in the request object


def reporter(request,test_type='all',top_fail_view=False):
    #This needs to be dynamic. Unfortunately, performance is aweful if it is queried directly 
    #from elastic search. A cron job to get the result and cache it in the database is probably 
    #the right way to go.
    oses=['all',"windows nt","mac", "linux"]
    locales = ['all','en-US', 'es-ES', 'fr', 'ja-JP-mac', 'zh-TW', 'de', 'ko', 'pl', 'da', 'it']
    data = {
        'current_os':request.GET.get('os','all'),
        'current_locale':request.GET.get('locale','all'),
        'report_type': test_type,
        'operating_systems':oses, 
        'locales':locales,
    }
     
    #queries.Facets and queries.reports have been designed to be polymorphic   
    if top_fail_view:
        es_object=Facets()
    else:
        es_object=reports()
    
    es_object.clear_filters()
    

    es_object.add_filter_term({"report_type": "firefox-%s"%test_type})


    #Adds filters based on get paramaters for elastic search
    filter_request(request,es_object,'os','system',oses)
    filter_request(request,es_object,'locale','application_locale',locales)

    ##If the dates have been set by the request use them, otherwise use the default
    try:
        request.GET['from_date']
        request.GET['to_date']
    except KeyError:
        pass
    else:
        es_object.from_date=request.GET['from_date']
        es_object.to_date=request.GET['to_date']

    data['from_date']=es_object.from_date
    data['to_date']=es_object.to_date
    
    if top_fail_view:
        return render_top_fail(request,es_object,data)
    else:
        return render_reports_view(request,es_object,data)
        
def render_reports_view(request,es_object,data):
    data['reports']=es_object.return_reports()
    test_type=data['report_type']

    if test_type == 'all':
        return jingo.render(request, 'display/reports/reports.html', data)
    elif test_type == 'functional':
        return jingo.render(request, 'display/reports/reports.html', data)
    elif test_type == 'endurance':
        return jingo.render(request, 'display/reports/updateReports.html', data)
    elif report_type == 'update':
        return jingo.render(request, 'display/reports/updateReports.html', data)

def render_top_fail(request,es_object, data):
    data['topfails']=es_object.return_facets()
    return jingo.render(request, 'display/facets/all.html', data)

