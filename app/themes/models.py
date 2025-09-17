from django.db import models
from home.models import BaseModel
from shopify_app.models import ShopifySite
import datetime

# Create your models here.

class ThemeFileUpload(BaseModel):
    
    themeId = models.CharField(max_length=255)
    site = models.ForeignKey(ShopifySite,on_delete=models.CASCADE,db_index=True)
    uploadDate = models.DateTimeField(default=datetime.now)
    content = models.TextField()
    contentType = models.CharField(max_length=64)

class ThemeFile(BaseModel):
    
    folder = models.CharField(max_length=255,db_index=True)
    path = models.CharField(max_length=255,db_index=True)
    contents = models.TextField(default="")
    updated = models.DateTimeField(default=datetime.now)
    contentType = models.CharField(max_length=128)
    uploads = models.ManyToManyField(ThemeFileUpload)
    
    def push(self,themeId):
        
        pass
    
    class Meta:
        db_table = "themeFile"
        

    
