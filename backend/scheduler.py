"""Background task: start/stop instances based on reservations."""
import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import aws_client
import reservations as res_store

log = logging.getLogger("scheduler")

TICK_SECONDS = 60


async def run() -> None:
    log.info("Scheduler started (tick every %ds)", TICK_SECONDS)
    while True:
        try:
            _tick()
        except Exception as e:
            log.exception("Scheduler tick error: %s", e)
        await asyncio.sleep(TICK_SECONDS)


CET = ZoneInfo("Europe/Berlin")


def _tick() -> None:
    now = datetime.now(CET)
    today = now.date().isoformat()
    current_time = now.strftime("%H:%M")

    for reservation in res_store.get_all():
        if reservation.date != today:
            continue

        # --- Start logic ---
        if reservation.start_time and not reservation.started and current_time >= reservation.start_time:
            log.info("Attempting to start %s in %s", reservation.instance_id, reservation.region)
            try:
                ok = aws_client.start_instance(reservation.instance_id, reservation.region)
                if ok:
                    log.info("Started %s", reservation.instance_id)
                    res_store.update_flags(reservation.instance_id, started=True, retrying=False)
                else:
                    log.warning(
                        "InsufficientCapacity for %s — will retry next tick",
                        reservation.instance_id,
                    )
                    res_store.update_flags(reservation.instance_id, retrying=True)
            except Exception as e:
                log.error("Error starting %s: %s", reservation.instance_id, e)

        # --- Stop logic ---
        if (
            (reservation.start_time is None or reservation.started)
            and not reservation.stopped
            and reservation.stop_time is not None
            and current_time >= reservation.stop_time
        ):
            log.info("Stopping %s in %s (scheduled)", reservation.instance_id, reservation.region)
            try:
                aws_client.stop_instance(reservation.instance_id, reservation.region)
                res_store.delete(reservation.instance_id)
            except Exception as e:
                log.error("Failed to stop %s: %s", reservation.instance_id, e)
