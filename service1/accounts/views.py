from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import HttpResponse
from .models import SimpleUser, EmailVerification
from .email_utils import send_verification_code, send_welcome_email
from .clickhouse_analytics import (
    log_registration, log_login, log_logout,
    log_email_sent, log_email_verified, log_profile_update,
    clickhouse_logger
)
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
import json
import re
import os
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse

# Функция для отображения и обработки формы логина
def login_view(request):
    """
    Обрабатывает GET и POST запросы для страницы авторизации
    
    GET - показывает форму логина
    POST - проверяет логин/пароль и создает сессию
    """
    
    # Проверяем, авторизован ли уже пользователь
    if request.session.get('user_id'):
        # Если да - перенаправляем на главную страницу
        return redirect('home')
    
    # Если это POST запрос (отправка формы)
    if request.method == 'POST':
        # Получаем данные из формы
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        # Проверяем, что поля не пустые
        if not username or not password:
            messages.error(request, 'Введите логин и пароль!')
            return render(request, 'accounts/login.html', {
                'username': username,
                'form_errors': 'Введите логин и пароль!'
            })
        
        try:
            # Ищем пользователя в базе данных по логину
            user = SimpleUser.objects.get(username=username, is_active=True)
            
            # Проверяем пароль (простое сравнение строк)
            if user.check_password(password):
                # Пароль верный! Создаем сессию
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                
                # Показываем сообщение об успешном входе
                messages.success(request, f'Добро пожаловать, {user.username}!')
                
                # Логируем вход в ClickHouse
                log_login(
                    user_id=user.id,
                    username=user.username,
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                # Перенаправляем на главную страницу
                return redirect('home')
            else:
                # Пароль неверный
                messages.error(request, 'Неверный логин или пароль!')
                
        except SimpleUser.DoesNotExist:
            # Пользователь не найден
            messages.error(request, 'Неверный логин или пароль!')
    
    # Показываем форму логина (для GET запроса или при ошибках)
    return render(request, 'accounts/login.html')


# Функция для отображения профиля пользователя
def profile_view(request):
    """
    Показывает подробную информацию о пользователе в его профиле
    """
    
    # Проверяем, авторизован ли пользователь
    user_id = request.session.get('user_id')
    if not user_id:
        # Если нет - перенаправляем на страницу логина
        messages.warning(request, 'Сначала войдите в систему!')
        return redirect('accounts:login')
    
    try:
        # Получаем данные пользователя из базы
        user = SimpleUser.objects.get(id=user_id, is_active=True)
        
        # Показываем личный кабинет
        return render(request, 'accounts/profile.html', {
            'user': user
        })
        
    except SimpleUser.DoesNotExist:
        # Пользователь не найден или заблокирован
        # Удаляем сессию
        request.session.flush()
        messages.error(request, 'Пользователь не найден!')
        return redirect('accounts:login')


# Функция для выхода из системы
def logout_view(request):
    """
    Завершает сессию пользователя и перенаправляет на страницу логина
    """
    
    # Получаем данные пользователя для логирования
    user_id = request.session.get('user_id')
    username = request.session.get('username', 'Пользователь')
    
    # Логируем выход в ClickHouse (до удаления сессии)
    if user_id and username:
        log_logout(
            user_id=user_id,
            username=username,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    
    # Удаляем все данные сессии
    request.session.flush()
    
    # Показываем сообщение о выходе
    messages.info(request, f'До свидания, {username}!')
    
    # Перенаправляем на страницу логина
    return redirect('accounts:login')


# Функция для регистрации новых пользователей
def register_view(request):
    """
    Обрабатывает GET и POST запросы для регистрации пользователей
    
    GET - показывает форму регистрации
    POST - создает нового пользователя и авторизует его
    """
    
    # Проверяем, авторизован ли уже пользователь
    if request.session.get('user_id'):
        # Если да - перенаправляем на главную страницу
        return redirect('home')
    
    # Если это POST запрос (отправка формы регистрации)
    if request.method == 'POST':
        # Получаем данные из формы
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')
        email = request.POST.get('email', '').strip()
        
        # Список ошибок валидации
        errors = []
        
        # Проверяем логин (Python валидация)
        if not username:
            errors.append('Введите логин!')
        elif len(username) < 3:
            errors.append('Логин должен быть не менее 3 символов!')
        elif len(username) > 150:
            errors.append('Логин должен быть не более 150 символов!')
        elif not username.replace('_', '').replace('-', '').isalnum():
            errors.append('Логин может содержать только буквы, цифры, дефис и подчеркивание!')
        
        # Проверяем пароль (Python валидация)
        if not password:
            errors.append('Введите пароль!')
        elif len(password) < 3:
            errors.append('Пароль должен быть не менее 3 символов!')
        elif len(password) > 128:
            errors.append('Пароль слишком длинный (максимум 128 символов)!')
        
        # Проверяем подтверждение пароля (Python валидация)
        if not password_confirm:
            errors.append('Подтвердите пароль!')
        elif password != password_confirm:
            errors.append('Пароли не совпадают!')
        
        # Проверяем email - теперь он ОБЯЗАТЕЛЬНЫЙ для подтверждения
        if not email:
            errors.append('Введите email адрес для подтверждения регистрации!')
        elif '@' not in email or '.' not in email.split('@')[-1]:
            errors.append('Введите корректный email адрес!')
        
        # Проверяем уникальность логина (Python валидация с базой данных)
        if username and SimpleUser.objects.filter(username=username).exists():
            errors.append('Пользователь с таким логином уже существует!')
        
        # Если есть ошибки - показываем их
        if errors:
            return render(request, 'accounts/register.html', {
                'username': username,
                'email': email,
                'errors': errors
            })
        
        # Если ошибок нет - отправляем код подтверждения на email
        try:
            # Удаляем старые неподтвержденные коды для этого email
            EmailVerification.objects.filter(
                email=email, 
                is_verified=False
            ).delete()
            
            # Генерируем новый код подтверждения
            verification_code = EmailVerification.generate_code()
            
            # Создаем запись о коде подтверждения
            verification = EmailVerification.objects.create(
                email=email,
                code=verification_code,
                temp_username=username,
                temp_password=password
            )
            
            # Отправляем код на email
            if send_verification_code(email, verification_code, username):
                # Сохраняем ID верификации в сессии для следующего шага
                request.session['verification_id'] = verification.id
                
                # Логируем отправку email в ClickHouse
                log_email_sent(0, username, email, 'verification_code')
                
                # Показываем сообщение об отправке кода
                messages.success(request, f'Код подтверждения отправлен на {email}! Проверьте почту.')
                
                # Перенаправляем на страницу ввода кода
                return redirect('accounts:verify_email')
            else:
                # Ошибка отправки email
                verification.delete()  # Удаляем неиспользованный код
                errors.append('Ошибка отправки email. Проверьте правильность адреса.')
                
        except Exception as e:
            # Если произошла ошибка при создании кода
            messages.error(request, f'Ошибка при регистрации: {str(e)}')
    
    # Показываем форму регистрации (для GET запроса или при ошибках)
    return render(request, 'accounts/register.html')


# Функция для подтверждения email кода
def verify_email_view(request):
    """
    Обрабатывает ввод и проверку 4-значного кода подтверждения email
    """
    
    # Проверяем, есть ли ID верификации в сессии
    verification_id = request.session.get('verification_id')
    if not verification_id:
        messages.error(request, 'Сессия истекла. Начните регистрацию заново.')
        return redirect('accounts:register')
    
    try:
        # Получаем запись о верификации
        verification = EmailVerification.objects.get(
            id=verification_id,
            is_verified=False
        )
        
        # Проверяем, не истек ли код
        if verification.is_expired():
            messages.error(request, 'Код подтверждения истек. Зарегистрируйтесь заново.')
            verification.delete()
            del request.session['verification_id']
            return redirect('accounts:register')
            
    except EmailVerification.DoesNotExist:
        messages.error(request, 'Код подтверждения не найден. Зарегистрируйтесь заново.')
        return redirect('accounts:register')
    
    # Если это POST запрос (отправка кода)
    if request.method == 'POST':
        entered_code = request.POST.get('code', '').strip()
        
        # Проверяем код
        if not entered_code:
            messages.error(request, 'Введите код подтверждения!')
        elif len(entered_code) != 4 or not entered_code.isdigit():
            messages.error(request, 'Код должен состоять из 4 цифр!')
        elif verification.is_valid(entered_code):
            # Код правильный! Создаем пользователя
            try:
                # Создаем пользователя из временных данных
                new_user = SimpleUser.objects.create(
                    username=verification.temp_username,
                    password=verification.temp_password,
                    email=verification.email
                )
                
                # Отмечаем код как подтвержденный
                verification.is_verified = True
                verification.save()
                
                # Отправляем приветственное письмо
                send_welcome_email(verification.email, verification.temp_username, verification.temp_password)
                
                # Авторизуем пользователя
                request.session['user_id'] = new_user.id
                request.session['username'] = new_user.username
                
                # Логируем успешную регистрацию и подтверждение email в ClickHouse
                log_registration(
                    user_id=new_user.id,
                    username=new_user.username,
                    email=new_user.email,
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                log_email_verified(new_user.id, new_user.username, new_user.email)
                
                # Удаляем ID верификации из сессии
                del request.session['verification_id']
                
                # Показываем сообщение об успешной регистрации
                messages.success(request, f'Добро пожаловать, {new_user.username}! Email подтвержден, регистрация завершена!')
                
                # Перенаправляем на главную страницу
                return redirect('home')
                
            except Exception as e:
                messages.error(request, f'Ошибка при создании аккаунта: {str(e)}')
        else:
            # Неправильный код
            messages.error(request, 'Неправильный код подтверждения!')
    
    # Показываем страницу ввода кода
    return render(request, 'accounts/verify_email.html', {
        'email': verification.email,
        'username': verification.temp_username,
        'expires_at': verification.expires_at
    })


def analytics_view(request):
    """
    Страница аналитики ClickHouse
    """
    # Проверяем авторизацию
    if not request.session.get('user_id'):
        messages.warning(request, 'Войдите для просмотра аналитики!')
        return redirect('accounts:login')
    
    # Получаем данные пользователя
    try:
        user = SimpleUser.objects.get(id=request.session.get('user_id'))
    except SimpleUser.DoesNotExist:
        # Если пользователь не найден, очищаем сессию
        request.session.flush()
        return redirect('accounts:login')
    
    # Получаем данные из ClickHouse
    registration_stats = clickhouse_logger.get_registration_stats(30)
    unique_users_stats = clickhouse_logger.get_unique_users_stats()
    recent_events = clickhouse_logger.get_recent_events(50)
    user_stats = clickhouse_logger.get_user_stats()  # Новая общая статистика
    
    # Проверяем подключение к ClickHouse
    clickhouse_connected = clickhouse_logger.client is not None
    clickhouse_host = getattr(clickhouse_logger, 'client', None)
    if clickhouse_host:
        clickhouse_host = 'xoj50zb4vb.us-west-2.aws.clickhouse.cloud'
    
    return render(request, 'accounts/analytics.html', {
        'user': user,  # Добавляем данные пользователя
        'registration_stats': registration_stats,
        'unique_users_stats': unique_users_stats,
        'recent_events': recent_events,
        'user_stats': user_stats,  # Добавляем общую статистику
        'clickhouse_connected': clickhouse_connected,
        'clickhouse_host': clickhouse_host
    })


def home_view(request):
    """
    Главная страница сайта - показывает заглушку "Тут скоро что-то будет"
    """
    # Проверяем авторизацию
    if not request.session.get('user_id'):
        return redirect('accounts:login')
    
    # Получаем данные пользователя
    try:
        user = SimpleUser.objects.get(id=request.session.get('user_id'))
    except SimpleUser.DoesNotExist:
        # Если пользователь не найден, очищаем сессию
        request.session.flush()
        return redirect('accounts:login')
    
    return render(request, 'accounts/home.html', {'user': user})


def edit_profile_view(request):
    """
    Страница редактирования профиля пользователя
    """
    # Проверяем авторизацию
    if not request.session.get('user_id'):
        messages.warning(request, 'Войдите для редактирования профиля!')
        return redirect('accounts:login')
    
    # Получаем данные пользователя
    try:
        user = SimpleUser.objects.get(id=request.session.get('user_id'))
    except SimpleUser.DoesNotExist:
        # Если пользователь не найден, очищаем сессию
        request.session.flush()
        return redirect('accounts:login')
    
    if request.method == 'POST':
        # Обрабатываем форму редактирования
        try:
            # Сохраняем старые значения для сравнения
            old_values = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'city': user.city,
                'birth_date': user.birth_date,
                'avatar': user.avatar.name if user.avatar else None
            }
            
            # Обновляем основные поля
            user.first_name = request.POST.get('first_name', '').strip()
            user.last_name = request.POST.get('last_name', '').strip()
            user.phone = request.POST.get('phone', '').strip()
            user.city = request.POST.get('city', '').strip()
            
            # Обрабатываем дату рождения
            birth_date = request.POST.get('birth_date', '').strip()
            if birth_date:
                from datetime import datetime
                try:
                    user.birth_date = datetime.strptime(birth_date, '%Y-%m-%d').date()
                except ValueError:
                    user.birth_date = None
            else:
                user.birth_date = None
            
            # Обрабатываем аватарку
            if 'avatar' in request.FILES:
                avatar_file = request.FILES['avatar']
                
                # Проверяем размер файла (максимум 5 МБ)
                if avatar_file.size > 5 * 1024 * 1024:
                    messages.error(request, 'Размер файла не должен превышать 5 МБ!')
                    return render(request, 'accounts/edit_profile.html', {'user': user})
                
                # Проверяем тип файла
                allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                if avatar_file.content_type not in allowed_types:
                    messages.error(request, 'Разрешены только изображения (JPEG, PNG, GIF)!')
                    return render(request, 'accounts/edit_profile.html', {'user': user})
                
                user.avatar = avatar_file
            
            # Сохраняем изменения
            user.save()
            
            # Определяем что именно изменилось
            new_values = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'city': user.city,
                'birth_date': user.birth_date,
                'avatar': user.avatar.name if user.avatar else None
            }
            
            # Находим только измененные поля
            changes = {}
            for field, new_value in new_values.items():
                old_value = old_values[field]
                
                # Приводим к строковому виду для сравнения
                old_str = str(old_value) if old_value is not None else ''
                new_str = str(new_value) if new_value is not None else ''
                
                # Если значения отличаются - добавляем в изменения
                if old_str != new_str:
                    if field == 'birth_date':
                        changes[field] = str(new_value) if new_value else None
                    else:
                        changes[field] = new_value
            
            # Логируем только если есть реальные изменения
            if changes:
                # Получаем IP и User-Agent
                ip_address = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0] or request.META.get('REMOTE_ADDR', '')
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                log_profile_update(
                    user_id=user.id,
                    username=user.username,
                    changes=changes,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            
            messages.success(request, 'Профиль успешно обновлен!')
            return redirect('accounts:profile')
            
        except Exception as e:
            messages.error(request, f'Ошибка при сохранении профиля: {str(e)}')
    
    # Показываем форму редактирования
    return render(request, 'accounts/edit_profile.html', {'user': user})


def puzzle_game_view(request):
    """Представление для перехода на игру Пятнашки с данными пользователя"""
    # Проверяем, авторизован ли пользователь через нашу систему
    user_id = request.session.get('user_id')
    if not user_id:
        # Если нет - перенаправляем на страницу логина
        messages.warning(request, 'Сначала войдите в систему!')
        return redirect('accounts:login')
    
    try:
        # Получаем данные пользователя из нашей базы
        user = SimpleUser.objects.get(id=user_id, is_active=True)
        
        # Формируем URL для игры с параметрами пользователя
        game_url = f"http://localhost:3000?username={user.username}"
        
        if user.email:
            game_url += f"&email={user.email}"
        
        # Добавляем аватарку, если она есть
        if user.avatar:
            # Формируем полный URL для аватара
            avatar_url = request.build_absolute_uri(user.avatar.url)
            game_url += f"&avatar={avatar_url}"
        
        return redirect(game_url)
        
    except SimpleUser.DoesNotExist:
        # Пользователь не найден - очищаем сессию и перенаправляем на логин
        request.session.flush()
        messages.error(request, 'Пользователь не найден!')
        return redirect('accounts:login')


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def upload_image_api(request):
    """API для загрузки изображений для игры"""
    
    # Добавляем логирование для отладки
    print(f"DEBUG: Получен запрос {request.method} от {request.META.get('HTTP_ORIGIN', 'unknown origin')}")
    print(f"DEBUG: Заголовки запроса: {dict(request.headers)}")
    
    # Обработка OPTIONS запроса для CORS preflight
    if request.method == "OPTIONS":
        print("DEBUG: Обрабатываем OPTIONS запрос")
        response = JsonResponse({})
        origin = request.META.get('HTTP_ORIGIN', '*')
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With"
        print(f"DEBUG: CORS заголовки установлены для origin: {origin}")
        return response
    
    try:
        print("DEBUG: Обрабатываем POST запрос")
        # Проверяем, авторизован ли пользователь
        user_id = request.session.get('user_id')
        print(f"DEBUG: user_id из сессии: {user_id}")
        if not user_id:
            print("DEBUG: Пользователь не авторизован")
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        # Получаем файл из запроса
        if 'image' not in request.FILES:
            return JsonResponse({'error': 'No image file provided'}, status=400)
        
        image_file = request.FILES['image']
        
        # Проверяем размер файла (максимум 10 МБ)
        if image_file.size > 10 * 1024 * 1024:
            return JsonResponse({'error': 'File size too large. Maximum 10MB allowed.'}, status=400)
        
        # Проверяем тип файла
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return JsonResponse({'error': 'Invalid file type. Only JPEG, PNG, GIF, WebP allowed.'}, status=400)
        
        # Создаем уникальное имя файла
        import uuid
        file_extension = os.path.splitext(image_file.name)[1]
        unique_filename = f"game_images/{uuid.uuid4()}{file_extension}"
        
        # Сохраняем файл
        file_path = os.path.join(settings.MEDIA_ROOT, unique_filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'wb+') as destination:
            for chunk in image_file.chunks():
                destination.write(chunk)
        
        # Возвращаем URL для загруженного изображения
        image_url = request.build_absolute_uri(settings.MEDIA_URL + unique_filename)
        
        # Добавляем CORS заголовки
        response = JsonResponse({
            'success': True,
            'image_url': image_url,
            'filename': unique_filename
        })
        
        # Устанавливаем CORS заголовки
        response["Access-Control-Allow-Origin"] = request.META.get('HTTP_ORIGIN', '*')
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With"
        
        return response
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
