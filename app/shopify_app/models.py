import os
import sys
from django.db import models
from .graphql import GraphQL
from .queries import authorizedScopes
import shopify

# Create your models here.

class AppScopes(models.Model):
    id = models.BigAutoField(primary_key=True)
    scopeName = models.CharField(max_length=255)
    
    class Meta:
        db_table = "required_scopes"

class ShopifySite(models.Model):
    
    id = models.BigAutoField(primary_key=True)
    shopName = models.CharField(max_length=255)
    shopDomain = models.CharField(max_length=128,db_index=True)
    authToken = models.CharField(max_length=255)
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
    def missingScopes(self):
        installedScopes = authorizedScopes(self.appKey)
        missingScopes = []
        for requiredScope in AppScopes.objects.all():
            if requiredScope.scopeName not in installedScopes:
                missingScopes.append(requiredScope.scopeName)
        return missingScopes
    
    class Meta:
        db_table="shopify_site"
        