"""
Утилиты для отправки email с кодами подтверждения
Адаптировано из mail_sender для Django
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from django.conf import settings

# Конфигурация email (как в mail_sender)
SMTP_SERVER = "smtp.yandex.ru"  # Для Яндекс
SMTP_PORT = 587
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'pilotleo2015@yandex.ru')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', 'ehlcrdogtevdpsre')

def send_verification_code(user_email, verification_code, username):
    """
    Отправляет код подтверждения на email пользователя
    
    Args:
        user_email (str): Email получателя
        verification_code (str): 4-значный код подтверждения
        username (str): Логин пользователя
    
    Returns:
        bool: True если отправка успешна, False если ошибка
    """
    try:
        # Отладочная информация (как в mail_sender)
        print(f"🔍 Отладка: Отправка кода {verification_code} на {user_email}")
        print(f"📧 Email отправителя: {SENDER_EMAIL}")
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = user_email
        msg['Subject'] = 'Код подтверждения регистрации'
        
        # HTML письмо с красивым дизайном (адаптированный из mail_sender)
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6a11cb; text-align: center;">🔐 Подтверждение регистрации</h2>
                
                <div style="background: linear-gradient(135deg, #6a11cb, #2575fc); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                    <h3>Добро пожаловать, {username}!</h3>
                    <p>Для завершения регистрации введите код подтверждения</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
                    <h2 style="color: #6a11cb; font-size: 3rem; letter-spacing: 10px; margin: 0;">
                        {verification_code}
                    </h2>
                    <p style="color: #666; margin-top: 15px;">Ваш код подтверждения</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <p><strong>⏰ Внимание:</strong> Код действителен в течение 15 минут.</p>
                    <p><strong>🔒 Безопасность:</strong> Никому не сообщайте этот код!</p>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin-top: 15px;">
                    <p><strong>💡 Что дальше?</strong></p>
                    <p>1. Вернитесь на страницу регистрации</p>
                    <p>2. Введите полученный код</p>
                    <p>3. Наслаждайтесь сервисом!</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666;">
                    <p>С уважением,<br>Команда нашего сервиса</p>
                    <p style="font-size: 0.9rem; color: #999;">
                        Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Отправляем email (точно как в mail_sender)
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, user_email, text)
        server.quit()
        
        print(f"✅ Email успешно отправлен на {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка отправки email: {str(e)}")
        return False

def send_welcome_email(user_email, username, password):
    """
    Отправляет приветственное письмо после успешной регистрации
    
    Args:
        user_email (str): Email получателя
        username (str): Логин пользователя
        password (int): Пароль пользователя
    
    Returns:
        bool: True если отправка успешна, False если ошибка
    """
    try:
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = user_email
        msg['Subject'] = 'Добро пожаловать! Регистрация завершена'
        
        # HTML письмо
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #28a745; text-align: center;">🎉 Регистрация завершена!</h2>
                
                <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                    <h3>Поздравляем, {username}!</h3>
                    <p>Ваш аккаунт успешно создан и подтвержден</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h4>🔐 Ваши данные для входа:</h4>
                    <p><strong>Логин:</strong> {username}</p>
                    <p><strong>Email:</strong> {user_email}</p>
                    <p><strong>Пароль:</strong> {password}</p>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                    <p><strong>🚀 Что дальше?</strong></p>
                    <p>Теперь вы можете войти в систему и пользоваться всеми возможностями нашего сервиса! http://127.0.0.1:8001/</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666;">
                    <p>С уважением,<br>Команда нашего сервиса</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Отправляем email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, user_email, text)
        server.quit()
        
        print(f"✅ Приветственное письмо отправлено на {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка отправки приветственного письма: {str(e)}")
        return False