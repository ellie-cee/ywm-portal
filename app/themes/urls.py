from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('files', views.home),
    path('files/inCollection/<str:collectionId>',views.showFiles),
    path('files/load/<str:fileId>',views.loadFile),
    path('files/upsert',views.upsert),
    path('files/folders/<str:collectionId>',views.showFiles),
    path('files/delete/<str:fileId>',views.deleteFile),
    
]
