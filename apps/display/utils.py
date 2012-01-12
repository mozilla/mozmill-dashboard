def filter_request(request,es_object,key,name,options):
    #foo
    try:
        request.GET[key]
    except:
        return

    if request.GET[key]=='all':
		return

    if request.GET[key] in options:
        es_object.add_filter_term({name:request.GET[key]})
    else:
	raise


