from django.contrib import admin
from django.urls import path
from . import views 

urlpatterns = [
    path("rules/config",views.getConfig),
    path("rules/active",views.activeRules),
    path("rules/get/<str:ruleId>",views.getRule),
    path("rules",views.indexPage),
    path("rules/delete/<str:ruleId>",views.delete),
    path("rules/upsert",views.upsert)
]