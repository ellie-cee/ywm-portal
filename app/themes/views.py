import json
from django.shortcuts import render
import pytz
from .models import ThemeFile,ThemeCollection
from home.views import jsonResponse,getJsonPayload
import mimetypes
from datetime import datetime
from ywm_auth.decorators import requiresLogin

# Create your views here.

@requiresLogin
def home(request):
    collectionId = getFirstThemeId()
    return render(
        request,
        "files.html",
        {
            "collectionId":collectionId,
        }   
    )
    
def getFirstThemeId():
    try:
        return ThemeCollection.objects.values_list("id")[0][0]
    except:
        collection = ThemeCollection(name="Default Collection")
        collection.save()
        return str(collection.id)
        
@requiresLogin
def showFiles(request,collectionId):
    collection:ThemeCollection = ThemeCollection.objects.get(id=collectionId)
    return jsonResponse(
        {
            "files":collection.fileTree(),
            "collectionId":collectionId
        },
        200   
    )
@requiresLogin
def loadFile(request,fileId):
    
    file = ThemeFile.objects.get(id=fileId)
    print(json.dumps(file.toDict(),indent=1))
    return jsonResponse(
        file.toDict(),
        status=200
    )
@requiresLogin
def deleteFile(request,fileId):
    themeFile = ThemeFile.objects.get(id=fileId)
    themeFile.delete()
    return jsonResponse(
        {
            "message":f"{themeFile.fileName} deleted",
        },
        200
    )
@requiresLogin
def upsert(request):
    payload = getJsonPayload(request)
    created = False
    file = None
    fileId = payload.get("objectId")
    if fileId is None:
        file = ThemeFile()
        created = True
    else:
        file = ThemeFile.objects.get(id=fileId)
        
    mimetype,encoding = mimetypes.guess_type(payload.get("fileName"))
    file.contentType = mimetype
    if file.contentType is None:
        if ".liquid" in payload.get("fileName"):
            file.contentType = "application/liquid"
        else:
            file.contentType = "text/plain"
    
    file.fileName = payload.get("fileName")
    file.folder = payload.get("folder")
    file.contents = payload.get("contents")
    file.githubLink = payload.get("githubLink")
    file.isCommonFile = payload.get("isCommonFile") is not None
    file.updated = datetime.now(tz=pytz.UTC)
    file.binaryFile = False
    file.collection = ThemeCollection.objects.get(id=payload.get("collectionId"))
    file.save()
    
    
    return jsonResponse(
        {
            "created":created,
            "fileContents":file.toDict()
        },
        200
    )
    
    