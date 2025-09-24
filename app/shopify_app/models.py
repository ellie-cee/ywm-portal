import os
import sys
from django.db import models
from home.models import IdAware
from .graphql import GraphQL
from .queries import authorizedScopes
from datetime import datetime
from themes.models import ThemeFile
import shopify

import uuid

# Create your models here.

class AppScopes(models.Model,IdAware):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    scopeName = models.CharField(max_length=255)
    
    class Meta:
        db_table = "required_scopes"

class ShopifySite(models.Model,IdAware):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    shopName = models.CharField(max_length=255)
    shopDomain = models.CharField(max_length=128,db_index=True)
    authToken = models.CharField(max_length=255)
    contactEmail = models.EmailField(default="email@email.com",null=True)
    contactName = models.TextField(default="",null=True)
    shopUrl = models.TextField(default="",null=True)
    appKey = models.CharField(max_length=255)
    
    
    @staticmethod
    def load(domain):
        try:
            profile = ShopifySite.objects.get(shopifyDomain=domain)
            profile.startSession()
        except:
            print(f"Unable to load profile {domain}",file=sys.stderr)
            return None
        
    def startSession(self):
        shopify.ShopifyResource.activate_session(
            shopify.Session(
                f"{self.shopDomain}.myshopify.com/admin",
                os.environ.get("API_VERSION"),
                self.authToken
            )
        )
    def validCredentials(self):
        self.startSession()
        shop = GraphQL().run(
            """
            query {
                shop {
                    contactEmail
                    url
                    shopOwnerName
                }
                
            }
            """,
            {}
        
        )
        shop.dump()
        if shop.isUnauthorized():
            return False
        self.contactEmail = shop.search("data.shop.contactEmail")
        self.contactName = shop.search("data.shop.shopOwnerName")
        self.shopUrl = shop.search("data.shop.url")
        return True
        
    def getMissingScopes(self):
        self.startSession()
        installedScopes = authorizedScopes(self.appKey)
        missingScopes = []
        for requiredScope in AppScopes.objects.all():
            if requiredScope.scopeName not in installedScopes:
                missingScopes.append(requiredScope.scopeName)
        return missingScopes
    
    def getThemes(self):
        self.startSession()
        themes = GraphQL().run(
            """
            query getThemes($after:String) {
                themes(first:100,after:$after) {
                    nodes {
                        id
                        name
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
            """,
            {
                "after":None
            }
        )
        return [{"name":x.get("name"),"id":x.get("id")} for x in themes.nodes("data.themes")]
    def deployFile(self,file:ThemeFile=None,themeId=None):
        self.startSession()
        return GraphQL().run(
            """
            mutation themeFilesUpsert($files: [OnlineStoreThemeFilesUpsertFileInput!]!, $themeId: ID!) {
                themeFilesUpsert(files: $files, themeId: $themeId) {
                    upsertedThemeFiles {
                        filename
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
            """,
            {
                "themeId":themeId,
                "files":[
                    {
                        "filename":f"{file.folder}/{file.fileName}",
                        "body":{
                            "type":"BASE64",
                            "value":file.base64Encoded()
                        }
                    }
                ]
            }
        )
    
    class Meta:
        db_table="shopify_site"
    
class ThemeFileUpload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    themeId = models.CharField(max_length=255)
    site = models.ForeignKey(ShopifySite,on_delete=models.CASCADE,db_index=True)
    uploadDate = models.DateTimeField(default=datetime.now)
    content = models.TextField()
    contentType = models.CharField(max_length=64)
    
    
    class Meta:
        db_table="themeFileUpload"