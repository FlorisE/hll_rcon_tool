import random
import logging

from rcon.utils import HUMAN_MAP_NAMES, number_to_map
from functools import wraps

logger = logging.getLogger(__name__)

def safe(func, default=None):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except:
            logger.exception("Unable to get data for broacasts")
            return default
    return wrapper

def chunks(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def format_by_line_length(possible_votes, max_length=60):
    """
    Note: I've tried to format with a nice aligned table but it's not
    possible to get it right (unless you hardcode it maybe)
    because the font used in the game does not have consistent characters (varying width)
    """
    lines = [] 
    line = "" 
    for i in possible_votes: 
        line += i + " " 
        if len(line) > max_length: 
            lines.append(line) 
            line = "" 
    lines.append(line)       
    return "\n".join(lines)


def format_map_vote(rcon):
    vote_dict = number_to_map(rcon)
    items = [f"[{k}] {HUMAN_MAP_NAMES.get(v, v)}"  for k, v in vote_dict.items()]
    return format_by_line_length(items)
    
def format_message(ctl, msg):
    get_vip_names = lambda: [d['name'] for d in ctl.get_vip_ids()]
    get_admin_names = lambda: [d['name'] for d in ctl.get_admin_ids()]
    get_owner_names = lambda: [d['name'] for d in ctl.get_admin_ids() if d['role'] == 'owner']
    get_senior_names = lambda: [d['name'] for d in ctl.get_admin_ids() if d['role'] == 'senior']
    get_junior_names = lambda: [d['name'] for d in ctl.get_admin_ids() if d['role'] == 'junior']
    subs = {
        'nextmap': safe(ctl.get_next_map, "")(),
        'maprotation': ' -> '.join(safe(ctl.get_map_rotation, [])()),
        'servername': safe(ctl.get_name, "")(),
        'onlineadmins': ', '.join(safe(ctl.get_online_admins, [])()),
        'admins': ','.join(safe(get_admin_names, [])()),
        'owners': ','.join(safe(get_owner_names, [])()),
        'seniors': ','.join(safe(get_senior_names, [])()),
        'juniors': ','.join(safe(get_junior_names, [])()),
        'vips': ', '.join(safe(get_vip_names, [])()),
        'randomvip': safe(lambda: random.choice(get_vip_names() or [""]), "")(),
        'votenextmap': safe(format_map_vote, '')(ctl)
    }
    return msg.format(**subs)