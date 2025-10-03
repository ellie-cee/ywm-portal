from django.shortcuts import render
from .models import RuleType,FileProcessorRule
from home.views import jsonResponse,getJsonPayload
from django.forms.models import model_to_dict
from home.shared import jsonify
from ywm_auth.decorators import requiresLogin


# Create your views here.

def getRuleTypes():
    return [{"id":str(ruleType.id),"name":ruleType.name} for ruleType in RuleType.objects.all()]

@requiresLogin
def getConfig(request):
    return jsonResponse(
        {   "object":{},
            "data":{
                "ruleTypes":getRuleTypes()    
            }
        }
    )
@requiresLogin
def activeRules(request):
    currentPage = request.GET.get("page")
    if currentPage is None:
        currentPage = 1
    recordCount = FileProcessorRule.objects.count()
    return jsonResponse(
        {
            "rules":jsonify(list(FileProcessorRule.objects.all()))
        }
    )
@requiresLogin
def indexPage(request):
    
    return render(
        request,
        "rules.html",
        {}
    )
@requiresLogin
def getRule(request,ruleId):
    rule = FileProcessorRule.objects.get(id=ruleId)
    if rule is None:
        return jsonResponse(
            {"message":"No rule exists"},
            404
        )
    return jsonResponse(
        {
            "object":jsonify(rule),
            "data":{
                "ruleTypes":getRuleTypes()
            }
        }
    )
@requiresLogin
def upsert(request):
    payload = getJsonPayload(request)
    
    rule = None
    if payload.get("objectId") is None:
        rule = FileProcessorRule()
    else:
        rule = FileProcessorRule.objects.get(id=payload.get("objectId"))
    
    rule.ruleName = payload.get("ruleName")
    rule.ruleType = RuleType.objects.get(id=payload.get("ruleType"))
    rule.filePath = payload.get("filePath")
    rule.configuration = payload.get("configuration")
    rule.save()
    print(jsonify(rule))
    return jsonResponse(
        {
            "objectId":str(rule.id),
            "object":jsonify(rule)
        },
        200
    )
def delete(request,ruleId):
    try:
        rule = FileProcessorRule.objects.get(id=ruleId)
        rule.delete()
        return jsonResponse(
            {"message":f"Deleted rule {rule.ruleName}"},
            200
        )
    except:
        return jsonResponse(
            {"message":f"Invalid rule"},
            404
        )
    
    
    
    