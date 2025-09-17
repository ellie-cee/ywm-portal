from django.shortcuts import render,redirect

from .models import User,AuthRequest
from datetime import datetime

# Create your views here.

def login(request):
    postContent = request.POST.dict()
    try:
        user = User.objects.filter(email=postContent.get("email")).first()
        auth = user.createAuth()
        request.session["AUTHORIZATION_REQUEST"] = auth.id
        censoredEmail = f"{postContent.get('email')[0:2]}****@{postContent.split('@')[-1]}"
        return render(
            request,
            "code.html",
            {
                "censoredEmail":censoredEmail
            }
        )
    except:
        return render(
            request,
            "login.html",
            {
                "error":"That user does not exsit"
            }
        )
def getActiveRequest(request):
    priorRequestId = request.session["AUTHORIZATION_REQUEST"]
    if priorRequestId is not None:
        return AuthRequest.objects.get(id=priorRequestId)
    return None

def validate(request):
    
    activeRequest = getActiveRequest(request)
    code = request.POST["authCode"]
    if not activeRequest.match(code):
        return render(
            request,
            "code.html",
            {
                "error":"Invalid code"
            }
        )
    if activeRequest.isExpired():
        return render(
            request,
            "code.html",
            {
                "error":"Code is expired"
            }
        )
    activeUser = activeRequest.user
    request.session["userDetails"] = {
        "name":activeUser.name,
        "id":activeUser.id,
        "email":activeUser.email,
        "permissions":[x.name for x in activeUser.permissions]
    }
    priorRequestId = request.session["AUTHORIZATION_REQUEST"]
    activeRequest.delete()
    
    return redirect("/")
            
def resend(request):
    priorRequestId = request.session["AUTHORIZATION_REQUEST"]
    if priorRequestId is not None:
        authRequest = AuthRequest.objects.get(priorRequestId)
        authRequest.delete()
    return login(request)
    pass
    