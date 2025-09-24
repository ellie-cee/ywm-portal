import traceback
from django.shortcuts import render
from django.forms.models import model_to_dict

from home.views import jsonResponse,getJsonPayload
from ywm_auth.decorators import requiresLogin
from .models import ShopifySite

# Create your views here.

def checkLogin(request):
    pass
def checkPermissions(request):
    pass

@requiresLogin
def index(request):
    return render(
        request,
        "siteform.html",
        {
            "shops":ShopifySite.objects.order_by("shopName").all()
        }
    )
@requiresLogin
def create(request):
    return render(
        request,
        "siteform.html",
        {}
    )
@requiresLogin
def upsertSite(request):
    payload = getJsonPayload(request)
    
    shop = None
    shopId = payload.get("shopId")
    if shopId is not None and shopId!="":
        shop = ShopifySite.objects.get(id=payload.get("shopId"))
    else:
        try:
            shop = ShopifySite.objects.get(shopDomain=payload.get("shopDomain"))
        except:
            shop = ShopifySite()
        shop.shopDomain = payload.get("shopDomain")
    shop.appKey = payload.get("appKey")
    shop.authToken = payload.get("authToken")
    shop.shopName = payload.get("shopName")
    
    credientialsValid = shop.validCredentials()
    if not credientialsValid:
        return jsonResponse(
            model_to_dict(shop),
            status=401
        )
    else:
       shop.save()
    return checkScopes(request,shopifySite=shop)

@requiresLogin
def recheckScopes(request,shopId):
    shopifySite = ShopifySite.objects.get(id=shopId)
    return checkScopes(request,shopifySite=shopifySite)

@requiresLogin
def checkScopes(request,shopifySite=None):
    if shopifySite is None:
        payload = getJsonPayload(request)
        shopifySite = ShopifySite.objects.get(payload.get("shopId"))
    
    missingScopes = shopifySite.getMissingScopes()
    if len(missingScopes)>0:
        return jsonResponse(
            {
                "shop":model_to_dict(shopifySite),
                "scopesMissing":missingScopes,
            },
            status=404
        )
    return jsonResponse(
        {
            "shop":model_to_dict(shopifySite),
            "shopId":str(shopifySite.id)
        },
        status=200
    )
@requiresLogin
def loadSite(request,shopId):
    
    try:
        shopifySite = ShopifySite.objects.get(id=shopId)
        return jsonResponse(
            model_to_dict(shopifySite),
            200
        )
    except:
        traceback.print_exc()
        return jsonResponse(
            {"message":"Not found"},
            404
        )
@requiresLogin
def deleteSite(request,shopId):
    try:
        ShopifySite.objects.get(id=shopId).delete()
    except:
        traceback.print_exc()
        pass
    return jsonResponse(
        {"message":"deleted"},
        200
    )
@requiresLogin
def listSites(request):
    return jsonResponse(
        {
            "shopList":[{"id":shop.getId(),"shopName":shop.shopName} for shop in ShopifySite.objects.all()]
        },
        200
    )
    
@requiresLogin
def listThemes(request,shopId):
    shopifySite = ShopifySite.objects.get(id=shopId)
    return jsonResponse(
        {
            "themeList":[{"themeId":theme.get("id"),"name":theme.get("name")} for theme in shopifySite.getThemes()]
        },
        200
    )
    

