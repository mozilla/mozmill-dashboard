from django import http
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from grow.readdb import report_to_es

import jingo
import simplejson as json

@csrf_exempt
def report(request):
    if request.method=="POST":
        report_to_es(request.raw_post_data)

    return HttpResponse('Hello World')
