import re
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
    tested = models.BooleanField(default=False)
    
    def apply(self,shopId=None,themeId=None,isTest=False):
        shopifySite = ShopifySite.objects.get(id=shopId)
        themeFile = shopifySite.getThemeFile(
            themeId=themeId,
            fileName=self.filePath,
        )
        
        themeFileContents = None
        if themeFile is None:
            return {
                "error":f"{self.filePath} does not exist in the selected theme",
                "data":{},
                "code":"NOTFOUND"
            }
        slug = self.processorType.slug 
        
        if slug == "search-and-replace":
            themeFileContents = self.applySearchAndReplace(themeFile.search("body.content"),isTest=isTest)
                
        if themeFileContents is not None:
            if isinstance(themeFileContents,dict):
                return {
                   "warning":f"{self.processorName} as already been applied to {self.filePath}",
                   "code":"APPLIED",
                   "data":{}
                }
            else:
                if not isTest:
                    ret = shopifySite.deployFile(
                        themeId = themeId,
                        fileName=self.filePath,
                        fileContents=themeFileContents
                    )
                else:
                    
                    return {
                        "objectId":self.id,
                        "code":"SUCCESS",
                        "data":{
                            "original":themeFile.search("body.content"),
                            "processed":themeFileContents
                        }
                    }
                return ret
        return {
            "error":f"{self.processorName} can not be proccessed",
            "code":"UNPROCESSABLE",
            "data":{}
        }
    def appliedSignature(self):
        extension = self.filePath.split(".")[-1].lower()
        if extension=="js":
            return f"/* deployment signature {str(self.id)} */"
        elif extension=="css":
            return f"/* deployment signature {str(self.id)} */"
        elif extension=="html":
            return f"<!-- deployment signature {str(self.id)} -->"
        elif extension=="liquid":
            return "{%comment%}"+f" deployment signature {str(self.id)}"+"{% endcomment %}"
                
    def applySearchAndReplace(self,fileContents="",isTest=False):
        config:dict = self.configuration
        deploymentSignature = self.appliedSignature()
        
        if deploymentSignature in fileContents:
            return {
                "error":f"{self.processorName} as already been applied to {self.filePath}"
            }
        updatedFileContents = None
        reString = re.sub(r'(%\}|\}\}|>)(?:\s+|\s*[*]\s*)(\{%|\{\{|<)',r'\1.*?\2',config.get("searchFor").strip().replace("|",r"\|").replace(r".",r"\."))
        pattern = re.compile(reString,flags=re.DOTALL)
      
        updatedFileContents = pattern.sub(config.get("replaceWith"),fileContents)
            
        if deploymentSignature is not None and not isTest:            
            updatedFileContents = f"{updatedFileContents}\n{deploymentSignature}"
        return updatedFileContents

    
    def __str__(self):
        return self.processorName
    
    class Meta:
        db_table = "fileProcessor"
    
    
