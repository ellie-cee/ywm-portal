from django.contrib import admin
from django.urls import path
from . import views 

urlpatterns = [
    path("shops",views.index),
    path("shops/create",views.create),
    path("shops/load/<str:shopId>",views.loadSite),
    path("shops/delete/<str:shopId>",views.deleteSite),
    path("shops/upsert",views.upsertSite),
    path("shops/recheck/<str:shopId>",views.recheckScopes),
    path("shops/list",views.listSites),
    path("shops/themes",views.listThemes)
]
