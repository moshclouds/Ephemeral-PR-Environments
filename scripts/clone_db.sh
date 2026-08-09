#!/bin/bash
set -e

SERVICE_NAME=$1
PR_NUMBER=$2

if [ -z "$SERVICE_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <SERVICE_NAME> <PR_NUMBER>"
  exit 1
fi

COMPOSE_CMD="docker compose -f infra/docker-compose.staging.yml"

echo "Cloning database for $SERVICE_NAME (PR #$PR_NUMBER)..."

case "$SERVICE_NAME" in
  order-service)
    TARGET_DB="order_db_pr_${PR_NUMBER}"
    echo "Creating Postgres DB: $TARGET_DB"
    $COMPOSE_CMD exec -T postgres-db psql -U ${POSTGRES_USER:-user} -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
    $COMPOSE_CMD exec -T postgres-db psql -U ${POSTGRES_USER:-user} -d postgres -c "CREATE DATABASE ${TARGET_DB};"
    echo "Copying staging data to $TARGET_DB..."
    $COMPOSE_CMD exec -T postgres-db pg_dump -U ${POSTGRES_USER:-user} order_db | $COMPOSE_CMD exec -i postgres-db psql -U ${POSTGRES_USER:-user} -d ${TARGET_DB}
    echo "Successfully cloned Postgres DB to ${TARGET_DB}"
    ;;
  inventory-service)
    TARGET_DB="inventory_db_pr_${PR_NUMBER}"
    echo "Creating MySQL DB: $TARGET_DB"
    $COMPOSE_CMD exec -T mysql-db mysql -u${MYSQL_USER:-root} -p${MYSQL_PASSWORD:-password} -e "DROP DATABASE IF EXISTS ${TARGET_DB}; CREATE DATABASE ${TARGET_DB};"
    echo "Copying staging data to $TARGET_DB..."
    $COMPOSE_CMD exec -T mysql-db mysqldump -u${MYSQL_USER:-root} -p${MYSQL_PASSWORD:-password} inventory_db | $COMPOSE_CMD exec -i mysql-db mysql -u${MYSQL_USER:-root} -p${MYSQL_PASSWORD:-password} $TARGET_DB
    echo "Successfully cloned MySQL DB to ${TARGET_DB}"
    ;;
  notification-service)
    TARGET_DB="notification_db_pr_${PR_NUMBER}"
    echo "Creating MongoDB Database: $TARGET_DB"
    $COMPOSE_CMD exec -T mongo-db mongosh --eval "db.getSiblingDB('${TARGET_DB}').dropDatabase()"
    echo "Copying staging data to $TARGET_DB..."
    $COMPOSE_CMD exec -T mongo-db mongodump --db=notification_db --archive | $COMPOSE_CMD exec -i mongo-db mongorestore --archive --nsFrom="notification_db.*" --nsTo="${TARGET_DB}.*"
    echo "Successfully cloned MongoDB to ${TARGET_DB}"
    ;;
  *)
    echo "Service $SERVICE_NAME does not require database cloning or is unrecognized."
    ;;
esac
