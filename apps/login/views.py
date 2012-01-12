"""Example views. Feel free to delete this app."""

from django import http
from django.http import HttpResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import jingo

BROWSERID_INCLUDE_SCRIPT = 'https://browserid.org/include.js'


def home(request):
    return HttpResponse('O HAI %s' % (request.user))

@login_required
def logout_view(request):
    logout(request)
    return HttpResponse('You are now logged out.')

def login_form(request):
    if request.user.is_authenticated():
        return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
    c = RequestContext(request)
    return render_to_response(
        'browserid_login.html',
        {
            'browserid_include_script': BROWSERID_INCLUDE_SCRIPT
        },
        context_instance=c
        )

@require_POST
def verify_login(request):
    user = authenticate(assertion=request.POST['assertion'],
                        host=request.META['SERVER_NAME'],
                        port=request.META['SERVER_PORT'])

    print 5*'\n'
    if user is not None:
        if user.is_active:
            login(request, user)
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
        else:
            return HttpResponse('your account is disabled.')
    else:
        return HttpResponse('access denied')
