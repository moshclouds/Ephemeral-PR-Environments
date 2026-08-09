#!/bin/bash
set -e

SERVICE_NAME=$1
PR_NUMBER=$2

if [ -z "$SERVICE_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <SERVICE_NAME> <PR_NUMBER>"
  exit 1
fi

COMPOSE_CMD="docker compose -f infra/docker-compose.staging.yml --env-file $HOME/Ephemeral-PR-Environments/infra/.env"

echo "Cleaning up database for $SERVICE_NAME (PR #$PR_NUMBER)..."

case "$SERVICE_NAME" in
  order-service)
    TARGET_DB="order_db_pr_${PR_NUMBER}"
    echo "Dropping Postgres DB: $TARGET_DB"
    $COMPOSE_CMD exec -T postgres-db psql -U ${POSTGRES_USER:-user} -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
    echo "Successfully cleaned up Postgres DB"
    ;;
  inventory-service)
    TARGET_DB="inventory_db_pr_${PR_NUMBER}"
    echo "Dropping MySQL DB: $TARGET_DB"
    $COMPOSE_CMD exec -T mysql-db mysql -u${MYSQL_USER:-root} -p${MYSQL_PASSWORD:-password} -e "DROP DATABASE IF EXISTS ${TARGET_DB};"
    echo "Successfully cleaned up MySQL DB"
    ;;
  notification-service)
    TARGET_DB="notification_db_pr_${PR_NUMBER}"
    echo "Dropping MongoDB Database: $TARGET_DB"
    $COMPOSE_CMD exec -T mongo-db mongosh --eval "db.getSiblingDB('${TARGET_DB}').dropDatabase()"
    echo "Successfully cleaned up MongoDB"
    ;;
  *)
    echo "Service $SERVICE_NAME does not require database cleanup or is unrecognized."
    ;;
esac
