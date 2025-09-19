from django.shortcuts import render
from ywm_auth.decorators import requiresLogin
from django.http import HttpResponse
import json
import logging

logger = logging.Logger(__name__)


# Create your views here.

@requiresLogin()
def dashboard(request):
    logger.error(request.session.get("userDetails"))
    return render(
        request,
        "dashboard.html",
        {}
    )
def jsonResponse(payload,status=200):
    payload["status"] = status
    return HttpResponse(
        json.dumps(payload),
        content_type="application/json",
        status=status
    )
def getJsonPayload(request):
    return json.loads(request.body.decode("utf-8"))
