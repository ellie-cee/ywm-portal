import os
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from django.core import serializers
from shopify_app.models import ShopifySite
from django.shortcuts import render,redirect
import logging

logger = logging.Logger(__name__)

x = """
def requiresLogin(request,permissionsRequired=None):
    def decorator(fn):
        print(fn)
        def wrapper(request, *args, **kwargs):

            userSession = request.session.get("userDetails")
            if userSession is None:
                return render(request,"login.html")
            userPermissions = userSession.get("permissions")
            if permissionsRequired is not None:
                for permission in permissionsRequired:
                    if permissionsRequired not in userPermissions:
                        return render(
                            request,
                            "base/noperms.html",
                            {}
                        )
            return fn(request, *args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper
    return decorator
"""

def requiresLogin(fn):
    print(fn)
    def wrapper(request, *args, **kwargs):
        userSession = request.session.get("userDetails")
        if userSession is None:
            return render(request,"login.html")
        userPermissions = userSession.get("permissions")
        return fn(request, *args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper