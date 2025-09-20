from django.db import models
from shopify_app.models import ShopifySite
from datetime import datetime
from django.forms.models import model_to_dict
import uuid

# Create your models here.

class ThemeFileUpload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    themeId = models.CharField(max_length=255)
    site = models.ForeignKey(ShopifySite,on_delete=models.CASCADE,db_index=True)
    uploadDate = models.DateTimeField(default=datetime.now)
    content = models.TextField()
    contentType = models.CharField(max_length=64)
    
    
    class Meta:
        db_table="themeFileUpload"
        
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
    class Meta:
        db_table = "themeCollection"

class ThemeFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    folder = models.CharField(max_length=255,db_index=True)
    fileName = models.CharField(max_length=255,db_index=True)
    contents = models.TextField(default="")
    updated = models.DateTimeField(default=datetime.now)
    contentType = models.CharField(max_length=128)
    uploads = models.ManyToManyField(ThemeFileUpload)
    binaryFile = models.BooleanField(default=False,null=True)
    collection = models.ForeignKey(ThemeCollection,db_index=True,on_delete=models.CASCADE,default=uuid.uuid4,related_name="files")
    
    def toDict(self):
        fileDetails = model_to_dict(self)
        del fileDetails["updated"]
        fileDetails["id"] = str(self.id)
        fileDetails["collection"] = str(self.collection.id)
        return fileDetails
    
    
    
    def push(self,themeId):
        
        pass
    
    class Meta:
        db_table = "themeFile"
        

    
