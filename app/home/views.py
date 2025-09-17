from django.shortcuts import render
from ywm_auth.decorators import requiresLogin

# Create your views here.

@requiresLogin()
def dashboard(request):
    return render(
        request,
        "dashboard.html",
        {}
    )



