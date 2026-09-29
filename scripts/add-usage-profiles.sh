#!/bin/bash
cd /opt/nestfind/backend
export PGPASSWORD=$(sed -n 's/^DB_PASSWORD=//p' .env)
psql -h 127.0.0.1 -U immo -d immo_db -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS usage_profiles TEXT[] DEFAULT '{}';"
psql -h 127.0.0.1 -U immo -d immo_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name='usage_profiles';"
