"""Simple JSON-file persistence for reservations."""
import json
import os
from datetime import datetime
from models import Reservation

DATA_FILE = os.getenv("RESERVATIONS_FILE", "/app/data/reservations.json")


def _load() -> list[dict]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)


def _save(data: list[dict]) -> None:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_all() -> list[Reservation]:
    return [Reservation(**r) for r in _load()]


def upsert(reservation: Reservation) -> None:
    """Insert or replace the reservation for this instance_id."""
    data = _load()
    data = [r for r in data if r["instance_id"] != reservation.instance_id]
    data.append(reservation.model_dump())
    _save(data)


def update_flags(
    instance_id: str,
    *,
    started: bool | None = None,
    stopped: bool | None = None,
    retrying: bool | None = None,
) -> None:
    data = _load()
    for r in data:
        if r["instance_id"] == instance_id:
            if started is not None:
                r["started"] = started
            if stopped is not None:
                r["stopped"] = stopped
            if retrying is not None:
                r["retrying"] = retrying
    _save(data)


def delete(instance_id: str) -> None:
    data = [r for r in _load() if r["instance_id"] != instance_id]
    _save(data)


def cleanup_past_stops() -> None:
    """Delete reservations whose stop time is in the past."""
    now = datetime.now()
    data = _load()
    filtered = []
    for r in data:
        stop_time = r.get("stop_time")
        if stop_time:
            stop_dt = datetime.strptime(f"{r['date']} {stop_time}", "%Y-%m-%d %H:%M")
            if stop_dt < now:
                continue
        filtered.append(r)
    if len(filtered) != len(data):
        _save(filtered)


def get_for_instance(instance_id: str) -> Reservation | None:
    for r in _load():
        if r["instance_id"] == instance_id:
            return Reservation(**r)
    return None
