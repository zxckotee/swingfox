#!/bin/bash

# Скрипт для генерации самоподписанных SSL сертификатов для разработки

echo "Генерация SSL сертификатов для разработки..."

# Создаем конфигурационный файл для сертификата
cat > localhost.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=RU
ST=Moscow
L=Moscow
O=SwingFox Development
OU=Development Team
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Генерируем приватный ключ
echo "Создание приватного ключа..."
openssl genrsa -out localhost.key 2048

# Генерируем сертификат
echo "Создание сертификата..."
openssl req -new -x509 -key localhost.key -out localhost.crt -days 365 -config localhost.conf -extensions v3_req

# Проверяем созданные файлы
echo ""
echo "Созданные файлы:"
ls -la localhost.*

echo ""
echo "✅ SSL сертификаты успешно созданы!"
echo ""
echo "Сертификат действителен для:"
echo "  - localhost"
echo "  - *.localhost"
echo "  - 127.0.0.1"
echo "  - ::1"
echo ""
echo "Срок действия: 365 дней"
echo ""
echo "Для использования в Docker контейнерах файлы будут автоматически"
echo "подключены как volumes в docker-compose.yml"