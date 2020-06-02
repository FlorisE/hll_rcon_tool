import os
import time
import logging
import random
from functools import partial

from rcon.extended_commands import Rcon
from rcon.settings import SERVER_INFO
from rcon.user_config import AutoBroadcasts
from rcon.audit import online_mods, get_registered_mods
from functools import wraps


logger = logging.getLogger(__name__)

CHECK_INTERVAL = 20

def safe(func, default=None):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except:
            logger.exception("Unable to get data for broacasts")
            return default
    return wrapper


def run():
    ctl = Rcon(
        SERVER_INFO
    )

    config = AutoBroadcasts()

    while True: 
        msgs = config.get_messages()

        if not config.get_enabled() or not msgs:
            logger.debug("Auto broadcasts are disabled. Sleeping %s seconds", CHECK_INTERVAL)
            time.sleep(CHECK_INTERVAL)
            continue
     
        if config.get_randomize():
            logger.debug("Auto broadcasts. Radomizing")
            random.shuffle(msgs)

        for time_sec, msg in msgs:
            if not config.get_enabled():
                break
            subs = {
                'nextmap': safe(ctl.get_next_map, "")(),
                'maprotation': ' -> '.join(safe(ctl.get_map_rotation, [])()),
                'servername': safe(ctl.get_name, "")(),
                'onlineadmins': safe(online_mods, "")(),
                'ingameadmins': safe(ctl.get_ingame_mods(get_registered_mods())) 
            }
            formatted = msg.format(**subs)
            logger.debug("Broadcasting for %s seconds: %s", time_sec, formatted)
            ctl.set_broadcast(formatted) 
            time.sleep(int(time_sec)) 
        # Clear state in case next next iteration disables 
        ctl.set_broadcast('') 


if __name__ == "__main__":
    run()