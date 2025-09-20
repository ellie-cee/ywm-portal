
import logging
from .models import ThemeCollection


logger = logging.getLogger(__name__)
def themesList(request):
    ret =  {
        "themeList":[{"id":str(theme.id),"name":theme.name} for theme in ThemeCollection.objects.order_by("name").all()]
    }
    
    
    return ret
    
