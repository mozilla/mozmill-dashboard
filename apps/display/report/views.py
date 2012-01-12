import jingo
import simplejson as json
from copy import deepcopy
from django import http
from django.http import HttpResponse, HttpResponseForbidden

from display.queries import reports, Report #, grab_facet_response, grab_operating_systems, grabber 
from display.report.utils import parse_results

BYTE_IN_MB=1048576.0

def mb_convert(byte):
    return int(round(byte/BYTE_IN_MB))



def report(request,_id):
    report=Report().grab(_id)
    report = report['_source']
    results = []
    data = {
        "id":_id,
        "app_name":report['application_name'],
        "app_version":report['application_version'],
        "platform_version":report['platform_version'],
        "app_locale":report['application_locale'],
        "platform_buildId":report['platform_buildid'],
        "system":report['system_info']['system'],
        "system_version":report['system_info']['version'],
        "service_pack":report['system_info']['service_pack'],
        "cpu":report['system_info']['processor'],
        "time_start":report['time_start'],
        "time_end":report['time_end'],
        "passed":report['tests_passed'],
        "failed":report['tests_failed'],
        "skipped":report['tests_skipped'],
        "report_type":report['report_type'],
        'results':[],
    }

    #Make sure that there are no stupid argument
    try:
        request.GET['status']
    except:
        pass
    else:
        if not request.GET['status'] in ['all','failed','passed','skipped']:
            return HttpResponseForbidden()

    data['results'] = parse_results(request,report['results'],)

    if data['report_type']=='firefox-functional':
        return jingo.render(request, 'display/report/functional.html', data)
    elif data['report_type']=='firefox-update':
        return update(request,data,report)
    elif data['report_type']=='firefox-endurance':
        return endurance(request,data,report)
    else:
        return HttpResponse(data['report_type']+" report view not implemented ... yet")

def endurance(request,data,report):
    data['mozmill_version']=report['mozmill_version']
    data['app_sourcestamp']=report['platform_repository']+'/rev/'+report['platform_changeset']
    data['extensions']=[]
    data['themes']=[]
    data['plugins']=[]
    for addon in report['addons']:
        if addon['type']=='extension':
            data['extensions'].append(addon)
        elif addon['type']=='theme':
            data['themes'].append(addon)
        elif addon['type']=='plugin':
            data['plugins'].append(addon)


    data['delay']=report['endurance']['delay']
    data['iterations']=report['endurance']['iterations']
    data['microIterations']=report['endurance']['micro_iterations']
    data['restart']=report['endurance']['restart']
    data['testCount']=len(report['endurance']['results'])

    data['checkpointCount']=0 
    for result in report['endurance']['results']:
        for iteration in result['iterations']:
            data['checkpointCount']+=len(iteration['checkpoints'])

    data['checkpointsPerTest']='https://github.com/highriseo/Mozmill-Dashboard-4.0/issues/7'

    for stattype in ['allocated','mapped','explicit','resident']:
        try:
            mem_report=report['endurance']['stats'][stattype]
        except KeyError:
            pass
        else:
            data[stattype]={}
            for stat in ['min','max','average']:
                data[stattype][stat]=int(round(mem_report[stat]/BYTE_IN_MB))

    data['memresult']={}
    for stattype in ['allocated','mapped','explicit','resident']:
        data['memresult'][stattype]=[]

    for result in report['endurance']['results']:
        for iteration in result['iterations']:
            for checkpoint in iteration['checkpoints']:
                for stattype in ['allocated','mapped','explicit','resident']:
                    try:
                        checkpoint[stattype]
                    except:
                        pass
                    else:
                        data['memresult'][stattype].append({
                            'memory':int(round(checkpoint[stattype]/BYTE_IN_MB)),
                            'testFile':result['testFile'],
                            'testMethod':result['testMethod'],
                        })

                pass

    data['testresult']=[]
    for stattype in ['allocated','mapped','explicit','resident']:
        #See if this statype exists in the data (this assumes that if it exists in the first it will exist in all)
        try:
            report['endurance']['results'][0]['stats'][stattype]
        except (IndexError, KeyError):
            continue
        else:
            #If so, create an array to be rendered and start adding to it
            series_object= {}
            series_object['points']=[]
            series_object['name']=stattype #This song and dance is to allow for a DRY template
            for test in report['endurance']['results']:
                series_object['points'].append({
                    'memory':int(round(test['stats'][stattype]['average']/BYTE_IN_MB)),
                    'testFile':test['testFile'],
                    'testMethod':test['testMethod'],
                })

            data['testresult'].append(series_object)


    data['testresult_table']={}
    data['testresult_table']['tests']=[]
    for result in report['endurance']['results']:
        for stattype in ['allocated','mapped','explicit','resident']:
            try:
                result['stats'][stattype]
            except:
                continue
            else:
                data['testresult_table'][stattype]=True
                data['testresult_table']['tests'].append({
                    stattype:True,
                    'min':mb_convert(result['stats'][stattype]['min']),
                    'max':mb_convert(result['stats'][stattype]['max']),
                    'average':mb_convert(result['stats'][stattype]['average']),
                    'testFile':result['testFile'],
                    'testMethod':result['testMethod'],
                })


                


    return jingo.render(request, 'display/report/endurance.html', data)


def update(request,data,report):

    try:
        update=report['updates'][0]
    except IndexError:
        data['update_results']=False
        return jingo.render(request, 'display/report/update.html', data)
    else:
        data['update_results']=True

    data['pre']={
        'user_agent':update['build_pre']['user_agent'],
        'locale':update['build_pre']['locale'],
        'buildid':update['build_pre']['buildid'],
        'url_aus':update['build_pre']['url_aus'],
    }
    data['post']={
        'user_agent':update['build_post']['user_agent'],
        'locale':update['build_post']['locale'],
        'buildid':update['build_post']['buildid'],
        'url_aus':update['build_post']['url_aus'],
    }


    data['channel']=update['patch']['channel']
    data['url_mirror']=update['patch']['url_mirror']
    data['size']=update['patch']['size']
    data['download_duration']=update['patch']['download_duration']
    data['type']=update['patch']['type']
    data['disabled_addons']=update['build_post']['disabled_addons']


    if update['success']:
        data['pass_fail']='Pass'
    else:
        data['pass_fail']='Fail'

    if update['patch']['is_complete']:
        data['complete']='complete'
    else:
        data['complete']='partial'

    if update['fallback']:
        data['fallback']='fallback'
    else:
        data['fallback']='direct'


    return jingo.render(request, 'display/report/update.html', data)


