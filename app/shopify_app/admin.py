from django.contrib import admin
from ywm_auth.models import User
from home.models import SiteNav
from ywm_auth.models import UserPermissions
from themes.models import ThemeCollection

# Register your models here.

admin.site.register(User)
admin.site.register(SiteNav)
admin.site.register(UserPermissions)
admin.site.register(ThemeCollection)

