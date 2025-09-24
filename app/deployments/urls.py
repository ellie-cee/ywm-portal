from django.contrib import admin
from django.urls import path
from . import views 

urlpatterns = [
    path("deploy",views.home),
    path("deploy/files",views.fileSet),
]