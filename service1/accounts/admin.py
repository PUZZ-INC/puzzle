from django.contrib import admin
from .models import SimpleUser, EmailVerification

# Регистрируем модель SimpleUser в админке Django
@admin.register(SimpleUser)
class SimpleUserAdmin(admin.ModelAdmin):
    """
    Настройки отображения модели SimpleUser в админке
    """
    
    # Поля, которые показываются в списке пользователей
    list_display = ('username', 'email', 'is_active', 'created_at')
    
    # Поля, по которым можно фильтровать
    list_filter = ('is_active', 'created_at')
    
    # Поля, по которым можно искать
    search_fields = ('username', 'email')
    
    # Поля, которые можно редактировать прямо в списке
    list_editable = ('is_active',)
    
    # Поля только для чтения
    readonly_fields = ('created_at',)
    
    # Группировка полей при редактировании
    fieldsets = (
        ('Основная информация', {
            'fields': ('username', 'password', 'email')
        }),
        ('Настройки', {
            'fields': ('is_active', 'created_at')
        }),
    )
    
    # Сортировка по умолчанию
    ordering = ('-created_at',)


# Регистрируем модель EmailVerification в админке Django
@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    """
    Настройки отображения модели EmailVerification в админке
    """
    
    # Поля, которые показываются в списке
    list_display = ('email', 'temp_username', 'code', 'is_verified', 'is_expired_display', 'created_at')
    
    # Поля, по которым можно фильтровать
    list_filter = ('is_verified', 'created_at', 'expires_at')
    
    # Поля, по которым можно искать
    search_fields = ('email', 'temp_username', 'code')
    
    # Поля только для чтения
    readonly_fields = ('created_at', 'expires_at', 'is_expired_display')
    
    # Группировка полей при редактировании
    fieldsets = (
        ('Основная информация', {
            'fields': ('email', 'code', 'is_verified')
        }),
        ('Временные данные пользователя', {
            'fields': ('temp_username', 'temp_password')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'expires_at', 'is_expired_display')
        }),
    )
    
    # Сортировка по умолчанию
    ordering = ('-created_at',)
    
    def is_expired_display(self, obj):
        """Отображение статуса истечения кода"""
        return obj.is_expired()
    is_expired_display.short_description = 'Код истек'
    is_expired_display.boolean = True
