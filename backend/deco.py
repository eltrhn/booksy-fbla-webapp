from functools import partial

import sanic

from .typedef import Location, Role, MediaType, MediaItem, User

async def connect_redis(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        """
        Just so I don't have to keep typing out the get-connection line
        """
        async with func.__globals__.app.rd_pool.get() as conn:
            return await func(conn, *args, **kwargs)
    return wrapper

async def uid_get(*attrs=None, user=False):
    async def decorator(func):
        """
        To be placed directly after the sanic routing deco
        so that it can make use of the request info
        """
        @wraps(func)
        async def wrapper(rqst, *args, **kwargs):
            """
            So I don't have to keep typing out the same try-except.
            Grabs the User ID from a request and then gets whatever
            requested info out of it.
            """
            try:
                uid = getattr(rqst, 'json' if rqst.method == 'POST' else 'raw_args')['uid']
                user = await User(uid, rqst.app)
            except KeyError:
                sanic.exceptions.abort(422, 'No user ID given')
            vals = [user] if attrs is None or user is True
            if attrs is not None:
                vals += [getattr(user, i) for i in attrs)]
            return await func(rqst, *vals, *args, **kwargs)
        return wrapper
    return decorator

async def rqst_get(*attrs):
    async def decorator(func):
        @wraps(func)
        async def wrapper(rqst, *args, **kwargs):
            """
            Another try-except abstraction.
            Grabs any requested info from a request and, if matching
            the keywords, converts it to an Object; else just gives
            the text
            """
            maps = {'item': (MediaItem, 'mid'), 'location': (Location, 'lid'), 'role': (Role, 'rid'), 'user': (User, 'uid')}
            container = getattr(rqst, 'json' if rqst.method == 'POST' else 'raw_args')
            try:
                vals = [maps[attrs[i]][0](container[maps[attrs[i]][1]]) if i in maps else container[i] for i in attrs]
            except KeyError:
                sanic.exceptions.abort(422, 'Missing requested attributes')
            return await func(rqst, *vals, *args, **kwargs)
        return wrapper
    return decorator
