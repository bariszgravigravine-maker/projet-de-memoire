#!/bin/bash
cd /opt/nestfind/backend
export PGPASSWORD=$(sed -n 's/^DB_PASSWORD=//p' .env)
psql -h 127.0.0.1 -U immo -d immo_db -c "SELECT role, COUNT(*) FROM users GROUP BY role;"
psql -h 127.0.0.1 -U immo -d immo_db -c "SELECT email, first_name, last_name, role, status FROM users WHERE role='ADMIN';"
