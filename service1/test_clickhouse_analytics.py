#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Тестирование ClickHouse аналитики
"""

import os
import sys
import django

# Настройка Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'service1_project.settings')
django.setup()

from accounts.clickhouse_analytics import clickhouse_logger

def test_clickhouse_connection():
    """Тестирование подключения к ClickHouse"""
    print("🔍 Тестирование ClickHouse аналитики...")
    
    if not clickhouse_logger.client:
        print("❌ ClickHouse не подключен!")
        return False
    
    print("✅ ClickHouse подключен успешно!")
    
    # Тестируем получение статистики
    try:
        print("\n📊 Общая статистика:")
        user_stats = clickhouse_logger.get_user_stats()
        for key, value in user_stats.items():
            print(f"  {key}: {value}")
        
        print("\n📈 Последние события:")
        recent_events = clickhouse_logger.get_recent_events(5)
        for event in recent_events:
            print(f"  {event}")
        
        print("\n📅 Регистрации по дням:")
        registration_stats = clickhouse_logger.get_registration_stats(7)
        for stat in registration_stats:
            print(f"  {stat}")
        
        print("\n👥 Уникальные пользователи:")
        unique_users_stats = clickhouse_logger.get_unique_users_stats()
        print(f"  По логину: {unique_users_stats['unique_usernames']}")
        print(f"  По email: {unique_users_stats['unique_emails']}")
            
        print("\n🎉 Все тесты прошли успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False

if __name__ == "__main__":
    test_clickhouse_connection()