from django.shortcuts import render
from .models import ThemeFile,ThemeCollection
from home.views import jsonResponse,getJsonPayload
import mimetypes
from ywm_auth.decorators import requiresLogin

# Create your views here.

@requiresLogin
def home(request):
    collectionId = ThemeCollection.objects.values_list("id")[0][0]
    return render(
        request,
        "files.html",
        {
            "collectionId":collectionId
        }   
    )
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
    
    