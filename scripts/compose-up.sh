#!/bin/bash
# Start API + PostgreSQL (postgres starts via depends_on)

docker compose up api --build -d

