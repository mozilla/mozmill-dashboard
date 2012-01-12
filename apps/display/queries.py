#!/usr/bin/env python

import simplejson as json
import datetime
from httplib2 import Http
from django.conf import settings

def format_date(date):
    return "%s-%s-%s"%(date.year,date.month,date.day)
    
class ES_wrapper:
    query = {
        "query": {
            "bool":{
                "must" : [
                ]
            }
        },
    }

    filters=[]
    from_date="2011-01-16"
    to_date="2011-01-19"
    
    def __init__(self):
        today = datetime.date.today()
        delta = datetime.timedelta(days=-3)
        three_ago = today+delta

        self.to_date = format_date(today)
        self.from_date = format_date(three_ago)

    def __execute__(self):
        self.update_query()
        return self.__grabber__(self.query)
        
    def __grabber__(self, query, _id=False):
        h=Http()
        server=settings.ELASTICSEARCH
        if _id:
            server+=_id
        else:
            server+='_search'
        
        resp, content = h.request(server, "GET", json.dumps(query))
        if resp['status']=='200':
            return json.loads(content)
            #return facets
        else:#TODO: Should maybe throw a real exeption on this guy
            raise Exception("Elasticsearch hates you (and your children)")
    
            return {'response':resp['status']}     
        
    ###Filter Manuplation
    def add_filter_term(self, requirement):
        self.filters.append({"text":requirement})

    def clear_filters(self):
        self.filters = []
        
        
       
        
#You want to use these docs to figure out whats going on
#http://www.elasticsearch.org/guide/reference/api/search/facets/
#This is a subclassing specifically for Facets (like the top failure view)
class Facets(ES_wrapper):    
    def __init__(self):
        ES_wrapper.__init__(self)
        size = 50
        self.query['facets']={
            "topfail" : { 
                "terms" : {
                    "field" : "failed_function",
                    "size" : size,
                },
                "facet_filter" : {
                    "range": {
                        "time_upload":{
                            "from":"2011-01-16",
                            "to":"2011-01-19",
                        }
                    } 
                }  
            }
        }
        
    def update_query(self):
        if len(self.filters)==0:
            self.query['query']={'match_all':{}}
        else:
            self.query['query']={'bool':{'must':self.filters}}

        self.query['facets']['topfail']['facet_filter']['range']['time_upload']['from']=self.from_date
        self.query['facets']['topfail']['facet_filter']['range']['time_upload']['to']=self.to_date

    #Sets the field that is being counted. It is probably going to be "failed_function" or "passed_function"
    def set_field(self,field):
        self.query['facets']['topfail']['terms']['field']=field
        
    #go and get the reports
    def __execute__(self):
        self.update_query()
        return self.__grabber__(self.query)
        
    def return_facets(self):
        return self.__execute__()['facets']['topfail']['terms']

class reports(ES_wrapper):
    def __init__(self):
        ES_wrapper.__init__(self)
        self.query['size']=50
        self.query['filter']={
            "range":{
                "time_upload":{
                    "from":"2011-01-16",
                    "to":"2011-01-19"
                } 
            }
        }
        
    ###OUT PUT
    def dump(self):
        self.update_query()
        return json.dumps(self.query)
        
    def update_query(self):
        if len(self.filters)==0:
            self.query['query']={'match_all':{}}
        else:
            self.query['query']={'bool':{'must':self.filters}}

        self.query['filter']['range']['time_upload']['from']=str(self.from_date)
        self.query['filter']['range']['time_upload']['to']=str(self.to_date)

    def return_reports(self):
        hits = self.__execute__()['hits']['hits']
        results=[]

        for hit in hits:
            hit = hit['_source']
            result={
                'date':hit['time_upload'],
                'version':hit['application_version'],
                'build':hit['platform_buildid'],
                'locale':hit['application_locale'],
                'cpu':hit['system_info']['processor'],
                'platform':hit['system_info']['system'],
                'platform_version':hit['system_info']['version'],
                'pass':hit['tests_passed'],
                'skip':hit['tests_skipped'],
                'fail':hit['tests_failed'],
                'id':hit['_id'],
            }
            try:
                result['preVersion']=hit['updates'][0]['build_pre']['version']
                result['postVersion']=hit['updates'][0]['build_post']['version']
            except (IndexError, KeyError):
                result['preVersion']=result['version']
                result['postVersion']='NA'


            results.append(result)

        return results
        
        
class Report(ES_wrapper):
    def __init__(self):
        pass
        
    def grab(self,id):
        return self.__grabber__('',id)
           
'''
def grab_operating_systems(query):
    content = grabber(query)
    result=[]
    for term in content['facets']['tag']['terms']:
        result.append(term['term'])
    return result

def grab_facet_response(query):
    content = grabber(query)
    result=[]
    for term in content['facets']['tag']['terms']:
        result.append({'name':term['term'],'failures':term['count']})
    return result 
'''     

