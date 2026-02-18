import os
from django.shortcuts import render
from ywm_auth.decorators import requiresLogin
from django.http import HttpResponse
from .models import SiteNav
import json
import logging
from django.conf import settings
from django.core.serializers import serialize
from django.forms.models import model_to_dict
from .shared import Data

logger = logging.Logger(__name__)

# Create your views here.

@requiresLogin
def dashboard(request):
    
    
    
    return render(
        request,
        "dashboard.html",
        {}
    )
def logJson(payload):
    logger.error(
        json.dumps(payload,indent=1)
    )
def jsonResponse(payload,status=200):
    payload["status"] = status
    return HttpResponse(
        json.dumps(Data.jsonify(payload)),
        content_type="application/json",
        status=status
    )
def getJsonPayload(request):
    return json.loads(request.body.decode("utf-8"))

def throwerror(request):
    x = 24332/0