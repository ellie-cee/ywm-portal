from django.db import models
from datetime import datetime,timedelta
import random

# Create your models here.

class UserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=64,db_index=True)
    
    class Meta:
        db_table = "user_permission"

class User(models.Model):
    
    id = models.BigAutoField(primary_key=True)
    name = models.TextField(default="No Name")
    email = models.EmailField(db_index=True)
    permissions = models.ManyToManyField(UserPermissions)
    
    def hasPermission(self,permission):
        
        if self.permissions.filter(name=permission)>0:
            return True
        return False
    def createAuth(self):
        auth = AuthRequest(
            user=self,
            expires=datetime.now()+timedelta(minutes=60),
            code=AuthRequest.generateCode()
        )
    class Meta:
        db_table="ywm_user"

class AuthRequest(models.Model):
    
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    code = models.CharField(max_length=64,db_index=True)
    expires = models.DateTimeField()
    
    @staticmethod
    def generateCode():
        return "".join([str(random.randint(0,9)) for x in range(6)])
    
    class Meta:
        db_table="auth_request"