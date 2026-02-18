from decimal import Decimal
import sys
import uuid
from jmespath import search as jpath
import json
from dict_recursive_update import recursive_update
import logging
from django.db import models
from django.forms.models import model_to_dict
from datetime import datetime,date

logger = logging.getLogger(__name__)




class SearchableDict:
    def __init__(self,data):
        if data is None:
            return None
        for k in data.keys():
            if not hasattr(self,k):
                setattr(self,k,data[k])
        self.data = data
    def search(self,path,default=None):
        ret =  jpath(path,self.data)
        if ret is None:
            return default
        return ret
    def has(self,key):
        return hasattr(self,key)
    def get(self,key,default=None):
        if hasattr(self,key) and getattr(self,key) is not None:
            return getattr(self,key)
        else:
            return default
    def valueOf(self,key):
        ret = self.get(key)
        if ret is dict and self.search(f"{key}.refName"):
            return self.search(f"{key}.refName")
        else:
            return ret
    def dump(self,printIt=True):
        if printIt:
            logger.info(json.dumps(self.data,indent=1))
            
        else:
            return self.data
    def set(self,key,value):
        paths = list(reversed(key.split(".")))
        if len(paths)>1:
            object = value
            for k in paths:
                object = {k:object}
            self.data = recursive_update(self.data,object)
        else:
            self.data[key] = value
    def getAsSearchable(self,key,default={}):
        val = self.search(key)
        if isinstance(val,list):
            return [SearchableDict(x) for x in val]
        if isinstance(val,dict):
            return SearchableDict(val)
        if val is None:
            return None
        return val
    
    def append(self,key,value):
        myValue = self.search(key,[])
        myValue.append(value)
        self.set(key,myValue)
        return
        if key not in self.data:
            self.data[key] = value
        elif type(self.data[key]) is not list:
            self.data[key] = [self.data[key],value]
        else:
            self.data[key].append(value)
    @staticmethod
    def fromList(list):
        return [SearchableDict(x) for x in list]
    def dumpField(self,path):
        ret = self.search(path)
        if ret is None:
            pass
        else:
            if isinstance(ret,dict) or isinstance(ret,list):
                logger.info(json.dumps(ret,indent=1))
                
            else:
                logger.info(ret)
def modelToJson(model):
    return model_to_dict(model)|{"id":str(model.id)}
def jsonify(value):
        if isinstance(value,models.Model):
            return jsonify(modelToJson(value))
        elif isinstance(value,dict):
            ret = {}
            for key,value in value.items():
                if isinstance(value,uuid.UUID):
                    ret[key] = str(value)
                else:
                    ret[key] = jsonify(value)
            return ret
        elif isinstance(value,list):
            return [jsonify(x) for x in value]
        else:
            return value
        
class Data:
    @staticmethod
    def jsonify(value):
        if isinstance(value,dict):
            ret = {}
            for key,value in value.items():
                if isinstance(value,Decimal):
                    ret[key] = float(value)
                elif isinstance(value,datetime):
                    ret[key] = value.strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(value,date):
                    ret[key] = value.strftime("%Y-%m-%d")
                elif hasattr(value,'dict'):
                    return value.data
                else:
                    ret[key] = Data.jsonify(value)
            return ret
        elif isinstance(value,list):
            return [Data.jsonify(x) for x in value]
        elif isinstance(value,SearchableDict):
            return value.data
        else:
            return value
