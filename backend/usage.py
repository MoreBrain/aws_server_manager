"""Simple JSON-file persistence for "used by" initials per instance.

Kept separate from reservations because the initials describe who is
*currently* using a running server, independent of any scheduled
start/stop reservation.
"""
import json
import os

DATA_FILE = os.getenv("USAGE_FILE", "/app/data/usage.json")


def _load() -> dict[str, str]:
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE) as f:
        return json.load(f)


def _save(data: dict[str, str]) -> None:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get(instance_id: str) -> str | None:
    return _load().get(instance_id)


def set_initials(instance_id: str, initials: str | None) -> None:
    data = _load()
    if initials:
        data[instance_id] = initials
    else:
        data.pop(instance_id, None)
    _save(data)


def delete(instance_id: str) -> None:
    data = _load()
    if data.pop(instance_id, None) is not None:
        _save(data)
