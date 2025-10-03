import json
from django.shortcuts import render
from home.views import jsonResponse,getJsonPayload,logJson
from ywm_auth.decorators import requiresLogin
from themes.models import ThemeCollection,ThemeFile
from shopify_app.models import ShopifySite
from shopify_app.graphql import GqlReturn
from file_processor.models import FileProcessor
from jmespath import search as jpath

import logging

logger = logging.Logger(__name__)

# Create your views here.


def renderDeploy(request,options):
    return render(
        request,
        "deploy.html",
        options   
    )
def defaultCollectionId():
    return str(ThemeCollection.objects.first().id)
def shopList():
    return [{"name":shop.shopName,"shopId":str(shop.id)} for shop in ShopifySite.objects.all()]

def deployPayload(files=[],shopId=""):
    return {
        "collectionId":defaultCollectionId(),
        "shopId":shopId,
        "files":json.dumps(filesList(files)),
        "explicitFiles":json.dumps(files),
        "shops":json.dumps(shopList()),
    }
def filesList(incomingFiles):
    return [
        str(file.id) for file in ThemeFile.objects.exclude(id__in=incomingFiles).filter(isCommonFile=True).all()
    ]+incomingFiles
    
@requiresLogin
def home(request):
    return renderDeploy(
        request,
        deployPayload()
    )
@requiresLogin
def fileSet(request):
    return renderDeploy(
        request,
        deployPayload(request.POST._getlist("fileId"))
    )
@requiresLogin
def shopDeploy(request,shopId):
    return renderDeploy(
        request,
        deployPayload(shopId=shopId)
    )
    
@requiresLogin
def executeDeployment(request):
    payload = getJsonPayload(request)
    shopifySite = ShopifySite.objects.get(id=jpath("shop.id",payload))
    themeId = jpath("theme.id",payload)
    type = payload.get("type")
    
    if type == "file":
        file = ThemeFile.objects.get(id=jpath("file.id",payload))
        ret = shopifySite.deployFile(
            file=file,
            themeId=jpath("theme.id",payload)
        )
        return jsonResponse({
            "message":"Deployed",
            "data":ret.data,
            
        })
    elif type ==  "processor":
        processor = FileProcessor.objects.get(id=jpath("processor.id",payload))
        ret = processor.apply(shopId=str(shopifySite.id),themeId=themeId)
        if isinstance(ret,GqlReturn):    
            return jsonResponse(
                {
                    "message":"Successfully applied",
                    "data":ret.data
                }
            )
        else:
            return jsonResponse(
                ret,
                404
            )
    return jsonResponse(
        {
            "message":"Not found"
        },
        404
    )
            
