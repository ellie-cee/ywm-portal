import uuid
from django.db import models
from shopify_app.graphql import GraphQL,GraphQlIterable
from shopify_app.models import ShopifySite

# Create your models here.

class RuleType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    name = models.CharField(max_length=255)
    class Meta:
        db_table = "ruleType"
    
    def __str__(self):
        return self.name
        

class FileProcessorRule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    ruleName = models.CharField(max_length=255)
    ruleType = models.ForeignKey(to=RuleType,on_delete=models.CASCADE)
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
            return None
        match self.ruleType.name:
            case "SearchAndReplace":
                themeFileContents = self.applySearchAndReplace()
                
        if themeFileContents is not None:
            
            shopifySite.deployFile(
                themeId = themeId,
                fileName=self.filePath,
                fileContents=themeFileContents
            )
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
            return None
        updatedFileContents = None
        if config.get("applicationStrategy")=="ALL":
            updatedFileContents =  fileContents.replace(config.get("searchFor"),config.get("replaceWith"))
        else:
            updatedFileContents = fileContents.replace(config.get("searchFor"),config.get("replaceWith"),count=1)
            
        if deploymentSignature is not None:
            updatedFileContents = f"{updatedFileContents}\n{deploymentSignature}"
            
        return updatedFileContents

    
    def __str__(self):
        return self.ruleName
    
    class Meta:
        db_table = "fileProcessorRule"
    
    
