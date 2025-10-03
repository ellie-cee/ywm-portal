from django.shortcuts import render
from .models import ProcessorType,FileProcessor
from home.views import jsonResponse,getJsonPayload
from django.forms.models import model_to_dict
from home.shared import jsonify
from ywm_auth.decorators import requiresLogin


# Create your views here.

def getProcessorTypes():
    return [{"id":str(ProcessorType.id),"name":ProcessorType.name} for ProcessorType in ProcessorType.objects.all()]

@requiresLogin
def getConfig(request):
    return jsonResponse(
        {   "object":{},
            "data":{
                "processorTypes":getProcessorTypes()    
            }
        }
    )
@requiresLogin
def activeProcessors(request):
    currentPage = request.GET.get("page")
    if currentPage is None:
        currentPage = 1
    recordCount = FileProcessor.objects.count()
    return jsonResponse(
        {
            "processors":jsonify(list(FileProcessor.objects.all()))
        }
    )
@requiresLogin
def indexPage(request):
    
    return render(
        request,
        "processors.html",
        {}
    )
@requiresLogin
def getProcessor(request,processorId):
    Processor = FileProcessor.objects.get(id=processorId)
    if Processor is None:
        return jsonResponse(
            {"message":"No Processor exists"},
            404
        )
    return jsonResponse(
        {
            "object":jsonify(Processor),
            "data":{
                "processorTypes":getProcessorTypes()
            }
        }
    )
@requiresLogin
def upsert(request):
    payload = getJsonPayload(request)
    
    processor = None
    if payload.get("objectId") is None:
        processor = FileProcessor()
    else:
        processor = FileProcessor.objects.get(id=payload.get("objectId"))
    
    processor.processorName = payload.get("processorName")
    processor.processorType = ProcessorType.objects.get(id=payload.get("processorType"))
    processor.filePath = payload.get("filePath")
    processor.configuration = payload.get("configuration")
    processor.save()
    print(jsonify(processor))
    return jsonResponse(
        {
            "objectId":str(processor.id),
            "object":jsonify(processor)
        },
        200
    )
def delete(request,processorId):
    try:
        processor = FileProcessor.objects.get(id=processorId)
        processor.delete()
        return jsonResponse(
            {"message":f"Deleted Processor {processor.processName}"},
            200
        )
    except:
        return jsonResponse(
            {"message":f"Invalid Processor"},
            404
        )
    
    
    
    