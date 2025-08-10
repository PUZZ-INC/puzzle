from django.urls import path
from . import views

# Пространство имен для URL-ов нашего приложения
app_name = 'accounts'

# Список маршрутов (URL-ов) нашего приложения
urlpatterns = [
    # Страница логина: /accounts/login/
    path('login/', views.login_view, name='login'),
    
    # Страница регистрации: /accounts/register/
    path('register/', views.register_view, name='register'),
    
    # Страница подтверждения email: /accounts/verify-email/
    path('verify-email/', views.verify_email_view, name='verify_email'),
    
    # Профиль пользователя: /accounts/profile/
    path('profile/', views.profile_view, name='profile'),
    
    # Редактирование профиля: /accounts/profile/edit/
    path('profile/edit/', views.edit_profile_view, name='edit_profile'),
    
    # Аналитика ClickHouse: /accounts/analytics/
    path('analytics/', views.analytics_view, name='analytics'),
    
    # Выход из системы: /accounts/logout/
    path('logout/', views.logout_view, name='logout'),
    
    # Главная страница приложения: /accounts/
    path('', views.login_view, name='home'),
    
    # API для загрузки изображений: /accounts/api/upload-image/
    path('api/upload-image/', views.upload_image_api, name='upload_image_api'),
]