import inspect

import click

from rcon.settings import SERVER_INFO
from rcon.extended_commands import Rcon
from rcon import game_logs, broadcast, stats_loop, welcome_message_loop, auto_settings
from rcon.models import init_db
from rcon.user_config import seed_default_config
from rcon.cache_utils import RedisCached, get_redis_pool

@click.group()
def cli():
    pass

ctl = Rcon(
    SERVER_INFO
)

@cli.command(name='log_loop')
def run_logs_eventloop():
    game_logs.event_loop()

@cli.command(name='broadcast_loop')
def run_broadcast_loop():
    broadcast.run()

@cli.command(name='stats_loop')
def run_stats_loop():
    stats_loop.run()

@cli.command(name='welcome_message_loop')
def run_broadcast_loop():
    welcome_message_loop.run()

@cli.command(name='auto_settings')
def auto_settings_loop():
    auto_settings.run()

def init(force=False):
    init_db(force)
    seed_default_config()

@cli.command(name="init_db")
@click.option('--force', default=False, is_flag=True)
def do_init(force):
    init(force)

@cli.command(name="set_maprotation")
@click.argument('maps', nargs=-1)
def maprot(maps):
    ctl.set_maprotation(list(maps))

@cli.command(name="import_vips")
@click.argument('file', type=click.File('r'))
@click.option('-p', '--prefix', default='')
def importvips(file, prefix):
    for line in file:
        line = line.strip()
        steamid, name = line.split(' ', 1)
        ctl.do_add_vip(name=f'{prefix}{name}', steam_id_64=steamid)


@cli.command(name="clear_cache")
def clear():
    RedisCached.clear_all_caches(get_redis_pool())

def do_print(func):
    def wrap(*args, **kwargs):
        res = func(*args, **kwargs)
        print(res)
        return res
    return wrap


PREFIXES_TO_EXPOSE = [
    'get_', 'set_', 'do_'
]

EXCLUDED = {
    'set_maprotation'
}

# Dynamically register all the methods from ServerCtl
for name, func in inspect.getmembers(ctl):
    if not any(name.startswith(prefix) for prefix in PREFIXES_TO_EXPOSE) or name in EXCLUDED:
        continue
    wrapped = do_print(func)

    # Registering the arguments of the function must be done from last
    # to first as they are decorators
    for pname, param in [i for i in inspect.signature(func).parameters.items()][::-1]:
        if param.default != inspect._empty:
            wrapped = click.option(f"--{pname}", pname, default=param.default)(wrapped)
        else:
            wrapped = click.argument(pname)(wrapped)

    cli.command(name=name)(wrapped)


if __name__ == '__main__':
    cli()
