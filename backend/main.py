import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import aws_client
import reservations as res_store
import scheduler
from models import AllowIpRequest, Instance, ReservationRequest, StartStopRequest

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(scheduler.run())
    yield
    task.cancel()


app = FastAPI(title="AWS Server Manager", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/instances", response_model=list[Instance])
def get_instances():
    res_store.cleanup_past_stops()
    raw = aws_client.list_instances()
    result = []
    for inst in raw:
        reservation = res_store.get_for_instance(inst["instance_id"])
        if reservation and reservation.retrying:
            inst["status"] = "retry"
        result.append(Instance(
            **inst,
            reserved_by=reservation.reserved_by if reservation else None,
            scheduled_start=f"{reservation.date} {reservation.start_time}" if reservation else None,
            stop_at=f"{reservation.date} {reservation.stop_time}" if reservation and reservation.stop_time else None,
        ))
    return result


@app.post("/api/instances/{instance_id}/start")
def start_instance(instance_id: str, body: StartStopRequest):
    ok = aws_client.start_instance(instance_id, body.region)
    if not ok:
        raise HTTPException(status_code=503, detail="InsufficientInstanceCapacity")
    return {"status": "starting"}


@app.post("/api/instances/{instance_id}/stop")
def stop_instance(instance_id: str, body: StartStopRequest):
    aws_client.stop_instance(instance_id, body.region)
    res_store.delete(instance_id)
    return {"status": "stopping"}


@app.post("/api/instances/{instance_id}/reserve")
def reserve_instance(instance_id: str, body: ReservationRequest):
    from models import Reservation
    reservation = Reservation(instance_id=instance_id, **body.model_dump())
    res_store.upsert(reservation)
    return {"status": "reserved"}


@app.post("/api/instances/{instance_id}/allow-ip")
def allow_ip(instance_id: str, body: AllowIpRequest):
    aws_client.allow_ip_on_port(instance_id, body.region, body.ip)
    return {"status": "allowed", "ip": body.ip}


@app.delete("/api/instances/{instance_id}/reserve")
def cancel_reservation(instance_id: str):
    res_store.delete(instance_id)
    return {"status": "cancelled"}


@app.get("/health")
def health():
    return {"ok": True}
