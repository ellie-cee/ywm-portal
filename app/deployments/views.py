import json
from django.shortcuts import render
from home.views import jsonResponse,getJsonPayload,logJson
from ywm_auth.decorators import requiresLogin
from themes.models import ThemeCollection,ThemeFile
from shopify_app.models import ShopifySite
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
    shopifySite = ShopifySite.objects.get(id=payload.get("shopId"))
    file = ThemeFile.objects.get(id=payload.get("fileId"))
    
    ret = shopifySite.deployFile(
        file=file,
        themeId=payload.get("themeId")
    )
    return jsonResponse(
        ret.data
    )
    
