import array
from sets import Set

from django.http import Http404, HttpResponseRedirect
from django.shortcuts import render_to_response
from couchdb import Server
from couchdb.http import ResourceNotFound

#COUCHDB_SERVER = "http://127.0.0.1:5984"
COUCHDB_SERVER = "http://brasstacks.mozilla.com/couchdb"

SERVER = Server(getattr(settings,'COUCHDB_SERVER'))
  

def index(request):
    docs = SERVER['mozmill']

    # Retrieve branches, and platforms
    results = docs.view('topFailures/failures',
                        descending=True,
                        group=True,
                        group_level=3)

    data = {}
    data['branches'] = { }
    data['platforms'] = { }
    data['results'] = { }

    for row in results.rows:
        (branch, platform, path) = row.key
  
        try: data["branches"][branch] = {}
        except: pass
  
        try: data["platforms"][platform] = 0
        except: pass

    for row in results.rows:
        current = data['results']
  
        (branch, platform, path) = row.key
        value = row.value
  
        if not branch in current:
            current[branch] = { }
  
        if not path in current[branch]:
            current[branch][path] = { }

        try:
            current[branch][path][platform] += value
        except:
            current[branch][path] = data['platforms'].copy()
            current[branch][path][platform] = value

    return render_to_response('dashboard/index.html',{'data': data})
