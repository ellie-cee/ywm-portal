import json
from django.shortcuts import render
from home.views import jsonResponse,getJsonPayload,logJson
from ywm_auth.decorators import requiresLogin
from themes.models import ThemeCollection,ThemeFile
from shopify_app.models import ShopifySite
# Create your views here.

@requiresLogin
def home(request):
    collectionId = ThemeCollection.objects.values_list("id")[0][0]
    return render(
        request,
        "deploy.html",
        {
            "collectionId":collectionId,
            "files":json.dumps([]),
            "shops":json.dumps([{"name":shop.shopName,"shopId":str(shop.id)} for shop in ShopifySite.objects.all()]),
        }   
    )
@requiresLogin
def fileSet(request):
    payload = request.POST
    collectionId = ThemeCollection.objects.values_list("id")[0][0]
    return render(
        request,
        "deploy.html",
        {
            "collectionId":collectionId,
            "files":json.dumps(request.POST._getlist("fileId")),
            "shops":json.dumps([{"name":shop.shopName,"shopId":str(shop.id)} for shop in ShopifySite.objects.all()]),
        }   
    )
    
    
