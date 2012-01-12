import urllib
import urllib2
import logging

from django.contrib.auth.models import User
from django.utils import simplejson as json

# TODO: This should be a setting.
VERIFICATION_SERVER = 'https://browserid.org/verify'

class BrowserIdBackend(object):
    supports_object_permissions = False
    supports_anonymous_user = False

    def authenticate(self, assertion=None, host=None, port=None):
        #TODO Host should probably be grabbed from somewhere more intelegent. Right now the computer thinks that host is "horse" which is understandable but will need to change
        qs = urllib.urlencode({'assertion': assertion,
                               'audience': '%s:%s' % (host, port)})
        print qs
        # TODO: this won't verify the server cert, because Python is
        # odd. For more info, see: 
        #
        #   https://github.com/mozilla/browserid/issues/40

        response = urllib2.urlopen('%s?%s' % (VERIFICATION_SERVER, qs))
        result = json.loads(response.read())
        if result['status'] == 'okay':
            email = result['email']
            try:
                user = User.objects.get(username=email)
            except User.DoesNotExist:
                user = User(username=email, password='nonexistent')
                user.save()
            return user
        logging.error("user login failed: %s" % repr(result))
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
