from ..core import AsyncInit
from ..attributes import Perms, Maxes, Locks


class MediaType(AsyncInit):
    """
    Defines a kind of media, e.g. books or audiotapes.
    Have maxes defined on them that override user/role maxes
    and are overridden by item maxes.
    """
    
    @staticmethod
    def do_imports():
        global Location, Role, MediaItem, MediaType, User
        from . import Location, Role, MediaItem, MediaType, User
    
    async def __init__(self, name, location, app):
        self.name = name
        self._app = app
        self.pool = app.pg_pool
        self.acquire = self.pool.acquire
        self.location = location if isinstance(location, Location) else await Location(int(location), self._app)
        check = await self.pool.fetchval('''SELECT name FROM mtypes WHERE name = $1::text AND lid = $2::bigint''', self.name, self.location.lid)
        if not check:
            raise ValueError('This type does not exist yet')
        res = await self.pool.fetchrow('''SELECT unit, maxes FROM mtypes WHERE name = $1::text AND lid = $2::bigint''', self.name, self.location.lid)
        self.maxes = Maxes(res['maxes']) if res['maxes'] else None
        self.unit = res['unit']
    
    def __str__(self):
        return self.name
    
    def to_dict(self):
        return {'name': self.name, 'unit': self.unit, 'maxes': self.maxes.props}

    async def edit(self, *, maxes=None, name=None, unit=None):
        query = '''
        UPDATE mtypes
          SET maxes = COALESCE($3::bigint, maxes),
              name = COALESCE($4::text, name),
              unit = COALESCE($5::text, unit)
        WHERE name = $1::text
          AND lid = $2::bigint
        '''
        await self.pool.execute(query, self.name, self.location.lid, maxes, name, unit)
        self.maxes, self.name = Maxes(maxes), name
