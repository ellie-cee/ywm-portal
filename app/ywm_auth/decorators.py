import os
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from django.core import serializers
from home.models import ShopifySite
from django.shortcuts import render,redirect

def loggedIn(fn):
    def wrapper(request, *args, **kwargs):
        
        userSession = request.session["userDetails"]
        if userSession is None:
            return render(request,"login.html")
        
        if os.getenv("SHOPIFY_TOKEN") is not None:
            return fn(request, *args, **kwargs)
        elif not hasattr(request, 'session') or 'shopify' not in request.session:
            if "shop" in request.GET:
                return views.authenticate(request)
            else:    
                request.session['return_to'] = request.get_full_path()
                return redirect(reverse(views.login))
        elif "shop" in request.GET and request.GET["shop"]!=request.session["shopify"]["shop_url"]:
            request.session['return_to'] = request.get_full_path()
            return views.authenticate(request)
        
        return fn(request, *args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper
