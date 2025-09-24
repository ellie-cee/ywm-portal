from django.contrib import admin
from ywm_auth.models import User
from home.models import SiteNav

# Register your models here.

admin.site.register(User)
admin.site.register(SiteNav)
