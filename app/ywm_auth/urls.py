from django.contrib import admin
from django.urls import path
import views 

urlpatterns = [
    path('login/', views.login),
    path('resend',)
]
