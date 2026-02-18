import os
import sys
from django.db import models
import requests
from home.models import IdAware
from .graphql import GraphQL
from .queries import authorizedScopes
from datetime import datetime
from themes.models import ThemeFile
import shopify
import logging
import base64
from datetime import datetime,timedelta
import pytz

logger = logging.Logger(__file__)

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
    accessToken = models.CharField(max_length=255)
    accessTokenExpires = models.DateTimeField(auto_now_add=True)
    contactEmail = models.EmailField(default="email@email.com",null=True)
    shopifyClientSecret = models.CharField(default="",null=True,max_length=255)
    contactName = models.TextField(default="",null=True)
    shopUrl = models.TextField(default="",null=True)
    shopifyClientId = models.CharField(max_length=255)


    
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
                self.token()
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
        installedScopes = authorizedScopes(self.shopifyClientId)
        missingScopes = []
        for requiredScope in AppScopes.objects.all():
            if requiredScope.scopeName not in installedScopes:
                missingScopes.append(requiredScope.scopeName)
        return missingScopes
    
    def getThemeFile(self,themeId,fileName):
        self.startSession()
        
        fileResults = GraphQL().run(
            """
            query getThemeFile($themeId:ID!,$fileNames:[String!]) {
                theme(id: $themeId) {
                    id
                    name
                    role
                    files(filenames: $fileNames, first: 1) {
                        nodes {
                            body {
                            ... on OnlineStoreThemeFileBodyText {
                                content
                            }
                        }
                    }
                    }
                }
            }
            """,
            {
                "themeId":themeId,
                "fileNames":[fileName]
                
            }
        )
        try:
            return fileResults.nodes("data.theme.files")[0]
        except:
            return None
        
    def getThemes(self):
        self.startSession()
        themes = []
        for group in GraphQL().iterable(
            """
            query getThemes($after:String) {
                themes(first:20,after:$after) {
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
        ):
            for theme in group:
                themes.append(
                    {
                        "name":theme.get("name"),
                        "id":theme.get("id")
                    }    
                )
        return themes
    def deployFile(self,file:ThemeFile=None,themeId=None,fileName=None,fileContents:str=None):
        if file is None:
            if fileName is None or fileContents is None:
                return None
        encodedContent = None
        if file is not None:
            encodedContent = file.base64Encoded()
        else:
            encodedContent = base64.b64encode(fileContents.encode("utf-8")).decode("ascii")
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
                        "filename":f"{file.folder}/{file.fileName}" if file else fileName,
                        "body":{
                            "type":"BASE64",
                            "value":encodedContent
                        }
                    }
                ]
            }
        )
    
    def adminUrl(self,path=""):
        return f"https://{self.shopDomain}.myshopify.com/admin/{path}"
    def token(self):
        now = datetime.now(tz=pytz.UTC)
        if self.accessTokenExpires>now:
            return self.accessToken
        response = requests.post(
            f"{self.adminUrl("oauth/access_token")}",
            headers={
                "Content-Type":"application/x-www-form-urlencoded"
            },
            data={
                "grant_type":"client_credentials",
                "client_id":self.shopifyClientId,
                "client_secret":self.shopifyClientSecret
            }
        )
        print(response.status_code)
        print(response.content)
        grant = response.json()
        self.accessTokenExpires = datetime.now(tz=pytz.UTC)+timedelta(minutes=86390)
        self.accessToken = grant.get("access_token")
        self.save()
        return self.accessToken
    
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