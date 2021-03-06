"""/location/members"""
import asyncpg
import io

import sanic
from sanic_jwt import decorators as jwtdec

from . import uid_get, rqst_get
from . import User

mbrs = sanic.Blueprint('location_members_api', url_prefix='/members')


@mbrs.get('/')
@rqst_get('cont')
@uid_get('location')
@jwtdec.protected()
async def serve_location_members(rqst, location, *, cont: 'where to continue search from'):
    """
    Serves all a location's members, in page determined by cont.
    (Output is not paginated in the actual application)
    """
    return sanic.response.json(await location.members(cont=int(cont)))


@mbrs.get('/info')
@uid_get('perms')
@rqst_get('check')
@jwtdec.protected()
async def serve_specific_member(rqst, perms, *, check: 'member to check'):
    """
    Gives a specific members' info.
    """
    if not perms.can_manage_accounts:
        sanic.exceptions.abort(403, "You aren't allowed to view member info.")
    user = await User(check, rqst.app)
    return sanic.response.json({'member': user.to_dict()}, status=200)


@mbrs.post('/add')
@uid_get('location', 'perms')
@rqst_get('member')  # member to create
@jwtdec.protected()
async def add_member_to_location(rqst, location, perms, *, member):
    """
    Addition of a given member.
    Creates an account for them with the chosen default password and
    roles, in the same location the requester is in.
    """
    try:
        username, rid, fullname, password = [member[i] for i in ('username', 'rid', 'name', 'password')]
    except KeyError:
        sanic.exceptions.abort(422, 'Missing required attributes.')
    if not perms.can_manage_accounts:
        sanic.exceptions.abort(403, "You aren't allowed to add members.")
    try:
        new = sanic.response.json(await location.add_member(username=username, password=password, rid=rid, fullname=fullname), status=200)
    except asyncpg.exceptions.UniqueViolationError:
        sanic.exceptions.abort(409, 'This username is already taken.')
    return new


@mbrs.post('/add/batch')
@uid_get('location', 'perms')
@rqst_get('rid', files=['csv'], form=True)
@jwtdec.protected()
async def add_members_from_csv(rqst, location, *, perms, rid, csv):
    """
    Batch addition of members.
    Really hope I can implement this but probably not.
    """
    if not perms.can_manage_accounts:
        sanic.exceptions.abort(401, "You aren't allowed to add members.")
    if csv is None:  # using conditional instead of try/except bc the data itself might also be null instead of just not present
        sanic.exceptions.abort(422, "No file given!")
    try:
        await location.add_members_batch(io.BytesIO(csv.body), rid)
    except Exception as e:
        sanic.exceptions.abort(422, str(e))
    return sanic.response.json('Added members.', status=201)


@mbrs.post('/remove')
@uid_get('location', 'role', 'perms')
@rqst_get('member')
@jwtdec.protected()
async def delet_user(rqst, location, role, perms, *, member: 'to remove'):
    """
    Deletes a given user.
    This deletes them *everywhere*, not just from within the location
    (because a user can't exist without being a member of a library).
    """
    if not perms.can_manage_accounts:
        sanic.exceptions.abort(401, "You aren't allowed to remove members.")
    await (await User(member, rqst.app, location=location, role=role)).delete()
    return sanic.response.raw('', 204)
