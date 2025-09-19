import uuid
from django.db import models


# Create your models here.

class BaseModel(models.Model):
    pass

class SiteNav(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,null=False)
    permission = models.CharField(max_length=64)
    url = models.CharField(max_length=255,default="/")
    label = models.CharField(max_length=255)
    
    class Meta:
        db_table="sitenav"