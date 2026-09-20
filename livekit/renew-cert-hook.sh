#!/bin/bash
# Deploy-hook certbot : recharger nginx + livekit après renouvellement du cert
nginx -s reload
docker restart livekit 2>/dev/null || true
