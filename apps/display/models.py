from django.db import models

class Locale(models.Model):
    def __init__(self,locale):
        self.locale = locale
        self.save()
        
    locale = models.CharField(max_length=15)
    
    def __unicode__(self):
        return self.locale
    
class OS(models.Model):
    def __init__(self,OS):
        self.OS = OS
        #self.save()
        
    OS = models.CharField(max_length=15)
    
    def __unicode__(self):
        return self.OS