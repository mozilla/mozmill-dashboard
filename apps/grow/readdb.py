#!/usr/bin/env python

import simplejson as json
import os
from httplib2 import Http

def turnaround(serial_number):
    h = Http()
    resp, content = h.request("http://mozmill-release.brasstacks.mozilla.com/db/%s"%(serial_number), "GET")
    report_to_es(content)

def report_to_es(content):
    h=Http()
    doc = json.loads(content)
    try:    #Let elastic search create its own IDs, get rid of them if couchdb made it
        del doc['_id']
        del doc['_rev']
    except:
        pass

    #Add a search field for passed tests or failed tests
    for (counter,function) in enumerate(doc['results']):
        if function['failed']==0:
            doc['results'][counter]['passed_function'] = function['name']
        else:
            doc['results'][counter]['failed_function'] = function['name']

    post = json.dumps(doc)
    resp, content = h.request('http://localhost:9200/filter2/docc/', "POST", post)


if __name__=="__main__":
    turnaround("843e83a1f8fd17cfe5e63a8bd5c881a9")

