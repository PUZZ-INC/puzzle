# -*- coding: utf-8 -*-
"""
ClickHouse Analytics для логирования событий пользователей
Интеграция с ClickHouse Cloud
"""

import clickhouse_connect
import logging
from django.conf import settings
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class ClickHouseLogger:
    """
    Класс для работы с ClickHouse аналитикой
    """
    
    def __init__(self):
        """Инициализация клиента ClickHouse"""
        try:
            # Подключение к ClickHouse Cloud
            self.client = clickhouse_connect.get_client(
                host='xoj50zb4vb.us-west-2.aws.clickhouse.cloud',
                port=8443,
                username='default',
                password=getattr(settings, 'CLICKHOUSE_PASSWORD', ''),  # Пароль из настроек
                database='default',
                secure=True  # SSL для Cloud
            )
            logger.info("✅ ClickHouse подключен успешно")
            self._create_tables()
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к ClickHouse: {e}")
            self.client = None

    def _create_tables(self):
        """Создание таблиц в ClickHouse"""
        if not self.client:
            return
            
        try:
            # Основная таблица событий пользователей
            self.client.command('''
                CREATE TABLE IF NOT EXISTS user_events (
                    user_id UInt64,
                    username String,
                    event_type String,
                    email String,
                    ip_address String,
                    user_agent String,
                    timestamp DateTime DEFAULT now(),
                    data String DEFAULT ''
                ) ENGINE = MergeTree()
                ORDER BY (user_id, timestamp)
            ''')
            
            # Материализованное представление для статистики регистраций по дням
            self.client.command('''
                CREATE MATERIALIZED VIEW IF NOT EXISTS registration_stats
                ENGINE = SummingMergeTree()
                ORDER BY date
                AS SELECT
                    toDate(timestamp) as date,
                    count() as registrations
                FROM user_events
                WHERE event_type = 'registration'
                GROUP BY date
            ''')
            
            # Материализованное представление для статистики email доменов
            self.client.command('''
                CREATE MATERIALIZED VIEW IF NOT EXISTS email_domains_stats
                ENGINE = SummingMergeTree()
                ORDER BY domain
                AS SELECT
                    splitByChar('@', email)[2] as domain,
                    count() as users_count
                FROM user_events
                WHERE event_type = 'registration' AND email != ''
                GROUP BY domain
            ''')
            
            logger.info("📊 Таблицы ClickHouse созданы успешно")
            
        except Exception as e:
            logger.error(f"❌ Ошибка создания таблиц ClickHouse: {e}")

    def log_event(self, user_id, username, event_type, email='', ip_address='', user_agent='', data=''):
        """
        Универсальная функция логирования событий
        
        Args:
            user_id: ID пользователя
            username: Имя пользователя
            event_type: Тип события (registration, login, logout, email_sent, email_verified)
            email: Email пользователя
            ip_address: IP адрес
            user_agent: User Agent браузера
            data: Дополнительные данные в JSON формате
        """
        if not self.client:
            logger.warning("⚠️ ClickHouse недоступен, событие не записано")
            return
            
        try:
            self.client.insert('user_events', [
                [user_id, username, event_type, email, ip_address, user_agent, datetime.now(), data]
            ])
            logger.info(f"📝 Событие '{event_type}' для пользователя '{username}' записано в ClickHouse")
            
        except Exception as e:
            logger.error(f"❌ Ошибка записи в ClickHouse: {e}")

    def log_registration(self, user_id, username, email, ip_address='', user_agent=''):
        """Логирование регистрации пользователя"""
        self.log_event(
            user_id=user_id,
            username=username,
            event_type='registration',
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            data=json.dumps({'source': 'django_registration'})
        )

    def log_login(self, user_id, username, ip_address='', user_agent=''):
        """Логирование входа пользователя"""
        self.log_event(
            user_id=user_id,
            username=username,
            event_type='login',
            ip_address=ip_address,
            user_agent=user_agent,
            data=json.dumps({'source': 'django_login'})
        )

    def log_logout(self, user_id, username, ip_address='', user_agent=''):
        """Логирование выхода пользователя"""
        self.log_event(
            user_id=user_id,
            username=username,
            event_type='logout',
            ip_address=ip_address,
            user_agent=user_agent,
            data=json.dumps({'source': 'django_logout'})
        )

    def log_email_sent(self, user_id, username, email, email_type):
        """Логирование отправки email"""
        self.log_event(
            user_id=user_id,
            username=username,
            event_type='email_sent',
            email=email,
            data=json.dumps({'email_type': email_type, 'source': 'django_email'})
        )

    def log_email_verified(self, user_id, username, email):
        """Логирование подтверждения email"""
        self.log_event(
            user_id=user_id,
            username=username,
            event_type='email_verified',
            email=email,
            data=json.dumps({'source': 'django_email_verification'})
        )
    
    def log_profile_update(self, user_id, username, changes, ip_address='', user_agent=''):
        """Логирование изменения профиля - только реальные изменения"""
        try:
            # Формируем описание изменений
            changes_list = []
            for field, new_value in changes.items():
                # Форматируем значение для отображения
                if new_value is not None and new_value != '':
                    if field == 'avatar':
                        # Получаем только имя файла без пути
                        filename = new_value.split('/')[-1] if '/' in new_value else new_value
                        changes_list.append(f"🖼️ загружена аватарка: {filename}")
                    elif field == 'first_name':
                        changes_list.append(f"👤 имя: {new_value}")
                    elif field == 'last_name':
                        changes_list.append(f"👤 фамилия: {new_value}")
                    elif field == 'phone':
                        changes_list.append(f"📞 телефон: {new_value}")
                    elif field == 'city':
                        changes_list.append(f"🏙️ город: {new_value}")
                    elif field == 'birth_date':
                        changes_list.append(f"🎂 дата рождения: {new_value}")
                    else:
                        changes_list.append(f"{field}: {new_value}")
                else:
                    # Если поле очищено
                    if field == 'avatar':
                        changes_list.append(f"🖼️ удалена аватарка")
                    elif field == 'first_name':
                        changes_list.append(f"👤 очищено имя")
                    elif field == 'last_name':
                        changes_list.append(f"👤 очищена фамилия")
                    elif field == 'phone':
                        changes_list.append(f"📞 очищен телефон")
                    elif field == 'city':
                        changes_list.append(f"🏙️ очищен город")
                    elif field == 'birth_date':
                        changes_list.append(f"🎂 очищена дата рождения")
                    else:
                        changes_list.append(f"очищено {field}")
            
            changes_description = ' • '.join(changes_list) if changes_list else 'профиль обновлен'
            
            self.log_event(
                user_id=user_id,
                username=username,
                event_type='profile_update',
                ip_address=ip_address,
                user_agent=user_agent,
                data=changes_description
            )
            logger.info(f"Логировано изменение профиля для пользователя {username}: {changes_description}")
        except Exception as e:
            logger.error(f"Ошибка логирования изменения профиля: {e}")

    def get_registration_stats(self, days=30):
        """Получение статистики регистраций за последние дни - ПРЯМОЙ ЗАПРОС"""
        if not self.client:
            return []
            
        try:
            # Прямой запрос к основной таблице вместо материализованного представления
            result = self.client.query(f'''
                SELECT 
                    toDate(timestamp) as date,
                    count() as registrations
                FROM user_events
                WHERE event_type = 'registration' 
                    AND timestamp >= today() - {days}
                GROUP BY date
                ORDER BY date DESC
            ''')
            return result.result_rows
        except Exception as e:
            logger.error(f"Ошибка получения статистики регистраций: {e}")
            return []

    def get_unique_users_stats(self):
        """Получение статистики уникальных пользователей по логину и email"""
        if not self.client:
            return {'unique_usernames': 0, 'unique_emails': 0}
            
        try:
            # Количество уникальных логинов (пользователей)
            unique_usernames_result = self.client.query('''
                SELECT uniq(username) as unique_usernames
                FROM user_events
                WHERE event_type = 'registration'
                    AND username != ''
            ''')
            unique_usernames = unique_usernames_result.result_rows[0][0] if unique_usernames_result.result_rows else 0
            
            # Количество уникальных email адресов
            unique_emails_result = self.client.query('''
                SELECT uniq(email) as unique_emails
                FROM user_events
                WHERE event_type = 'registration'
                    AND email != ''
                    AND email != 'null'
            ''')
            unique_emails = unique_emails_result.result_rows[0][0] if unique_emails_result.result_rows else 0
            
            return {
                'unique_usernames': unique_usernames,
                'unique_emails': unique_emails
            }
        except Exception as e:
            logger.error(f"Ошибка получения статистики уникальных пользователей: {e}")
            return {'unique_usernames': 0, 'unique_emails': 0}

    def get_recent_events(self, limit=100):
        """Получение последних событий"""
        if not self.client:
            return []
            
        try:
            result = self.client.query(f'''
                SELECT user_id, username, event_type, email, timestamp, data
                FROM user_events
                ORDER BY timestamp DESC
                LIMIT {limit}
            ''')
            return result.result_rows
        except Exception as e:
            logger.error(f"Ошибка получения событий: {e}")
            return []

    def get_user_stats(self):
        """Получение общей статистики пользователей"""
        if not self.client:
            return {}
            
        try:
            # Общее количество событий
            total_events = self.client.query('SELECT count() FROM user_events').result_rows[0][0]
            
            # Количество уникальных пользователей
            unique_users = self.client.query('SELECT uniq(user_id) FROM user_events WHERE user_id > 0').result_rows[0][0]
            
            # Количество регистраций
            registrations = self.client.query("SELECT count() FROM user_events WHERE event_type = 'registration'").result_rows[0][0]
            
            # Количество логинов
            logins = self.client.query("SELECT count() FROM user_events WHERE event_type = 'login'").result_rows[0][0]
            
            return {
                'total_events': total_events,
                'unique_users': unique_users,
                'registrations': registrations,
                'logins': logins
            }
        except Exception as e:
            logger.error(f"Ошибка получения общей статистики: {e}")
            return {}


# Глобальный экземпляр логгера
clickhouse_logger = ClickHouseLogger()

# Удобные функции для использования в views
def log_registration(user_id, username, email, ip_address='', user_agent=''):
    """Удобная функция для логирования регистрации"""
    clickhouse_logger.log_registration(user_id, username, email, ip_address, user_agent)

def log_login(user_id, username, ip_address='', user_agent=''):
    """Удобная функция для логирования входа"""
    clickhouse_logger.log_login(user_id, username, ip_address, user_agent)

def log_logout(user_id, username, ip_address='', user_agent=''):
    """Удобная функция для логирования выхода"""
    clickhouse_logger.log_logout(user_id, username, ip_address, user_agent)

def log_email_sent(user_id, username, email, email_type):
    """Удобная функция для логирования отправки email"""
    clickhouse_logger.log_email_sent(user_id, username, email, email_type)

def log_email_verified(user_id, username, email):
    """Удобная функция для логирования подтверждения email"""
    clickhouse_logger.log_email_verified(user_id, username, email)

def log_profile_update(user_id, username, changes, ip_address='', user_agent=''):
    """Удобная функция для логирования изменения профиля"""
    clickhouse_logger.log_profile_update(user_id, username, changes, ip_address, user_agent)