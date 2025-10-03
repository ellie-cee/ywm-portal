import uuid
from django.db import models
from shopify_app.graphql import GraphQL,GraphQlIterable
from shopify_app.models import ShopifySite
import logging
from home.shared import jsonify

logger = logging.Logger(__name__)

# Create your models here.

class ProcessorType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255)
    class Meta:
        db_table = "processorType"
    
    def __str__(self):
        return self.name
        

class FileProcessor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    processorName = models.CharField(max_length=255)
    processorType = models.ForeignKey(to=ProcessorType,on_delete=models.CASCADE,default="56921d76-7228-4673-96f5-aed3ac0bdc28")
    filePath = models.CharField(max_length=255)
    configuration = models.JSONField()
    applicationStrategy = models.TextChoices("ONCE","ALL")
    
    def apply(self,shopId=None,themeId=None):
        shopifySite = ShopifySite.objects.get(id=shopId)
        themeFile = shopifySite.getThemeFile(
            themeId=themeId,
            fileName=self.filePath,
        )
        themeFileContents = None
        if themeFile is None:
            return {"error":f"{self.filePath} does not exist in the selected theme","data":{}}
        match self.processorType.slug:
            case "search-and-replace":
                themeFileContents = self.applySearchAndReplace(themeFile.search("body.content"))
                
        if themeFileContents is not None:
            if isinstance(themeFileContents,dict):
                return {
                   "warning":f"{self.processorName} as already been applied to {self.filePath}",
                   "data":{}
                }
            else:
                ret = shopifySite.deployFile(
                    themeId = themeId,
                    fileName=self.filePath,
                    fileContents=themeFileContents
                )
                return ret
        return {
            "error":f"{self.processorName} can not be proccessed",
            "data":{}
        }
    def appliedSignature(self):
        match(self.filePath.split(".")[-1].lower()):
            case "js":
                return f"/* deployment signature {str(self.id)} */"
            case "css":
                return f"/* deployment signature {str(self.id)} */"
            case "html":
                return f"<!-- deployment signature {str(self.id)} -->"
            case "liquid":
                return "{%comment%}"+f" deployment signature {str(self.id)}"+"{% endcomment %}"
                
    def applySearchAndReplace(self,fileContents=""):
        config:dict = self.configuration
        deploymentSignature = self.appliedSignature()
        
        if deploymentSignature in fileContents:
            return {
                "error":f"{self.processorName} as already been applied to {self.filePath}"
            }
        updatedFileContents = None
        if config.get("applicationStrategy")=="ALL":
            updatedFileContents =  fileContents.replace(config.get("searchFor"),config.get("replaceWith"))
        else:
            updatedFileContents = fileContents.replace(config.get("searchFor"),config.get("replaceWith"),1)
            
        if deploymentSignature is not None:            
            updatedFileContents = f"{updatedFileContents}\n{deploymentSignature}"
        return updatedFileContents

    
    def __str__(self):
        return self.processorName
    
    class Meta:
        db_table = "fileProcessor"
    
    
