from fastapi import APIRouter

from apps.realtime import views

router = APIRouter()

router.add_api_websocket_route("/ws/readings", views.readings_ws)
