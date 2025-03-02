from django.urls import path
from .views import register, login, protected_view

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('protected/', protected_view),
]
