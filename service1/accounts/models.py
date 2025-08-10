from django.db import models
from django.utils import timezone
import random
import string

# Простая модель пользователя БЕЗ хеширования паролей (только для обучения!)
class SimpleUser(models.Model):
    # Логин пользователя (уникальный)
    username = models.CharField(
        max_length=150, 
        unique=True, 
        verbose_name="Логин"
    )
    
    # Пароль в ОТКРЫТОМ виде (НЕ БЕЗОПАСНО! Только для обучения)
    password = models.CharField(
        max_length=128, 
        verbose_name="Пароль"
    )
    
    # Email (необязательный)
    email = models.EmailField(
        blank=True, 
        null=True, 
        verbose_name="Email"
    )
    
    # Дата создания аккаунта
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Дата создания"
    )
    
    # Активен ли пользователь
    is_active = models.BooleanField(
        default=True, 
        verbose_name="Активен"
    )
    
    # Дополнительные поля профиля
    first_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Имя"
    )
    
    last_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Фамилия"
    )
    
    bio = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="О себе"
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Телефон"
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name="Аватарка"
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Дата рождения"
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Город"
    )
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        
    def __str__(self):
        return self.username
        
    # Метод для проверки пароля (простое сравнение строк)
    def check_password(self, raw_password):
        """Проверяет, совпадает ли введенный пароль с сохраненным"""
        return self.password == raw_password


# Модель для хранения кодов подтверждения email
class EmailVerification(models.Model):
    # Email, для которого создан код
    email = models.EmailField(
        verbose_name="Email"
    )
    
    # 4-значный код подтверждения
    code = models.CharField(
        max_length=4,
        verbose_name="Код подтверждения"
    )
    
    # Временные данные пользователя до подтверждения
    temp_username = models.CharField(
        max_length=150,
        verbose_name="Временный логин"
    )
    
    temp_password = models.CharField(
        max_length=128,
        verbose_name="Временный пароль"
    )
    
    # Время создания кода
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время создания"
    )
    
    # Время истечения кода (15 минут)
    expires_at = models.DateTimeField(
        verbose_name="Время истечения"
    )
    
    # Подтвержден ли код
    is_verified = models.BooleanField(
        default=False,
        verbose_name="Подтвержден"
    )
    
    class Meta:
        verbose_name = "Код подтверждения Email"
        verbose_name_plural = "Коды подтверждения Email"
        
    def __str__(self):
        return f"{self.email} - {self.code}"
    
    def save(self, *args, **kwargs):
        # Автоматически устанавливаем время истечения (15 минут от создания)
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_code(cls):
        """Генерирует случайный 4-значный код"""
        return ''.join(random.choices(string.digits, k=4))
    
    def is_expired(self):
        """Проверяет, истек ли код"""
        return timezone.now() > self.expires_at
    
    def is_valid(self, entered_code):
        """Проверяет, валиден ли введенный код"""
        return (
            not self.is_expired() and 
            not self.is_verified and 
            self.code == entered_code
        )
