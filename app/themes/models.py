from django.db import models
from datetime import datetime
from django.forms.models import model_to_dict
import uuid
import base64

# Create your models here.
        
class ThemeCollection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    name = models.CharField(default="Dawn",max_length=255)
    
    def fileTree(self):
        fileList = {}
        for file in self.files.order_by("folder").all():
            fileDict = file.toDict()
            if file.folder not in fileList:
                fileList[file.folder] = [fileDict]
            else:
                fileList[file.folder].append(fileDict)
        return [{"folder":folder,"files":contents} for folder,contents in fileList.items()]
    def __str__(self):
        return self.name
    class Meta:
        db_table = "themeCollection"

class ThemeFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    folder = models.CharField(max_length=255,db_index=True)
    fileName = models.CharField(max_length=255,db_index=True)
    contents = models.TextField(default="")
    updated = models.DateTimeField(default=datetime.now)
    contentType = models.CharField(max_length=128)
    binaryFile = models.BooleanField(default=False,null=True)
    collection = models.ForeignKey(ThemeCollection,db_index=True,on_delete=models.CASCADE,default=uuid.uuid4,related_name="files")
    
    def toDict(self):
        fileDetails = model_to_dict(self)
        del fileDetails["updated"]
        fileDetails["id"] = str(self.id)
        fileDetails["collection"] = str(self.collection.id)
        return fileDetails
    def base64Encoded(self):
        if "base64" in self.contents:
            return self.contents
        return base64.b64encode(self.contents.encode("utf-8")).decode("ascii")
    
    def __str__(self):
        return f"{self.folder}/{self.name}"
    def push(self,themeId):
        
        pass
    
    class Meta:
        db_table = "themeFile"
        

    
