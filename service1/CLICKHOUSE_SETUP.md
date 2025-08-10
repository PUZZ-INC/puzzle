# 🚀 Настройка ClickHouse Cloud для Django проекта

## ✅ Что уже готово:

1. **ClickHouse драйвер установлен** (`clickhouse-connect`)
2. **Интеграция с Django готова** - все файлы созданы
3. **Аналитическая система настроена** - таблицы, views, логирование

## 🔧 Что нужно сделать:

### 1. Добавить пароль ClickHouse в настройки

Откройте файл `service1_project/settings.py` и найдите строку:

```python
CLICKHOUSE_PASSWORD = ''  # Добавь сюда свой пароль от ClickHouse Cloud
```

Замените на:
```python
CLICKHOUSE_PASSWORD = 'ваш_реальный_пароль_из_clickhouse_cloud'
```

### 2. Настройка DBeaver для ClickHouse Cloud

**Параметры подключения:**
```
Host: xoj50zb4vb.us-west-2.aws.clickhouse.cloud
Port: 8443
Database: default
Username: default
Password: [ваш_пароль]
SSL: ✅ ВКЛЮЧЕН (обязательно!)
```

**В DBeaver:**
1. New Connection → ClickHouse
2. Заполнить данные выше
3. **Driver Properties** → **ssl** = `true`
4. Test Connection

### 3. Проверка работы

После добавления пароля:

1. **Перезапустить Django сервер:**
   ```bash
   C:\Users\pilot\AppData\Local\Programs\Python\Python313\python.exe manage.py runserver 8001
   ```

2. **Зайти в профиль пользователя** → **"Аналитика ClickHouse"**

3. **Проверить логи:**
   - Файл `clickhouse.log` в корне проекта
   - Консоль Django сервера

## 📊 Что будет логироваться в ClickHouse:

- ✅ **Регистрации пользователей** (с IP, User-Agent)
- ✅ **Входы/выходы** (login/logout)
- ✅ **Отправка email** (коды подтверждения, приветственные письма)
- ✅ **Подтверждение email**
- ✅ **Статистика по дням и доменам**

## 🔍 Просмотр данных в DBeaver:

После подключения к ClickHouse выполните запросы:

```sql
-- Все события пользователей
SELECT * FROM user_events ORDER BY timestamp DESC LIMIT 100;

-- Статистика регистраций по дням
SELECT * FROM registration_stats ORDER BY date DESC;

-- Популярные email домены
SELECT * FROM email_domains_stats ORDER BY users_count DESC;

-- События за последний час
SELECT user_id, username, event_type, timestamp 
FROM user_events 
WHERE timestamp >= now() - INTERVAL 1 HOUR 
ORDER BY timestamp DESC;
```

## ⚡ Автоматическое создание таблиц:

Таблицы создаются автоматически при первом запуске Django с правильным паролем ClickHouse.

**Структура таблиц:**
- `user_events` - основная таблица событий
- `registration_stats` - материализованное представление статистики регистраций
- `email_domains_stats` - материализованное представление доменов email

## 🚨 Решение проблем:

**Если не работает подключение:**
1. Проверьте пароль в `settings.py`
2. Убедитесь что SSL включен в DBeaver
3. Проверьте логи в `clickhouse.log`

**Если нет данных в аналитике:**
1. Зарегистрируйте нового пользователя
2. Войдите/выйдите несколько раз
3. Данные появятся в реальном времени

## 🎉 Готово!

После настройки пароля у вас будет:
- ✅ Полная интеграция ClickHouse с Django
- ✅ Реальное время аналитика в веб-интерфейсе
- ✅ Возможность анализа данных в DBeaver
- ✅ Логирование всех действий пользователей

**Ваша SQLite база данных остается основной** - ClickHouse используется только для аналитики! 📈