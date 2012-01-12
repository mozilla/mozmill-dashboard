def parse_results(request,tests):
    results = []
    try:
        request.GET['status']
    except KeyError:
        status='failed'
    else:
        status=request.GET['status']


    for test in tests:
        result = {}
        result['test']=test['name']
        result['filename']=test['filename']

        #the following is an algorithm to parse out the status and information field. It also filters the results. Good luck.
        if (test['failed']>0) and (status in ['failed','all']):
            result['status']='failed'
            print result['status']
            result['information'] = test['fails'][0]['exception']['message']
            results.append(result)
            continue

        try:
            test['skipped']
        except:
            pass
        else:
            result['status']='skipped'
            result['information'] = test['skipped_reason']
            if status in ['skipped','all']:
                results.append(result)
            continue

        #make sure that we have the right amount of passes and failes and make sure that there is a filter that allows for passes
        if (test['failed']==0) and (test['passed']>=0) and (status in ['passed','all']):
            result['status']='passed'
            results.append(result)
            continue
    return results

