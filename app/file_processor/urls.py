from django.contrib import admin
from django.urls import path
from . import views 

urlpatterns = [
    path("fileProcessors/config",views.getConfig),
    path("fileProcessors/active",views.activeProcessors),
    path("fileProcessors/get/<str:processorId>",views.getProcessor),
    path("fileProcessors",views.indexPage),
    path("fileProcessors/delete/<str:processorId>",views.delete),
    path("fileProcessors/upsert",views.upsert),
    path("fileProcessors/test",views.testProcessor)
]