from pydantic import BaseModel
from typing import Optional


class Instance(BaseModel):
    instance_id: str
    name: Optional[str]
    region: str
    instance_type: str
    status: str
    instance_status: Optional[str]  # "ok" / "impaired" / "initializing" / "insufficient-data" / "not-applicable"
    public_ip: Optional[str]
    cost_per_hour: Optional[float]
    reserved_by: Optional[str]
    scheduled_start: Optional[str]  # "YYYY-MM-DD HH:MM" or None
    stop_at: Optional[str]  # "YYYY-MM-DD HH:MM" or None


class StartStopRequest(BaseModel):
    region: str


class AllowIpRequest(BaseModel):
    region: str
    ip: str


class ReservationRequest(BaseModel):
    date: str                          # "YYYY-MM-DD"
    start_time: Optional[str] = None   # "HH:MM" or None = stop-only stub
    stop_time: Optional[str] = None    # "HH:MM" or None = don't stop
    reserved_by: Optional[str] = None
    region: str


class StopTimeRequest(BaseModel):
    stop_time: Optional[str] = None  # "HH:MM" or None = don't stop
    region: Optional[str] = None


class Reservation(ReservationRequest):
    instance_id: str
    started: bool = False
    stopped: bool = False
    retrying: bool = False
